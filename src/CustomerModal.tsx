import { FormEvent, useState } from 'react';
import { Check, X, Printer, ArrowRight, Save, Plus, Trash2, Layers } from 'lucide-react';
import { CustomerRecord, CustomerWorkItem, getStatus, formatCurrency, todayISO, makeId, WorkType, WorkStatus } from './types';
import { WorkTypeField } from './WorkTypeField';
import { CustomerNameField } from './CustomerNameField';
import { printThermalBill } from './billPrinter';

type Props = {
  workTypes: WorkType[];
  workStatuses: WorkStatus[];
  customers?: CustomerRecord[];
  editing?: CustomerRecord | null;
  isOwnerMode?: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<CustomerRecord>, editingId?: string) => Promise<void>;
};

interface FormItem {
  id: string;
  work_type: string;
  amount: string;
  expense: number;
  work_status: string;
}

export function CustomerModal({
  workTypes,
  workStatuses,
  customers = [],
  editing,
  isOwnerMode = false,
  onClose,
  onSubmit,
}: Props) {
  const [customerName, setCustomerName] = useState(editing?.customer_name ?? '');
  const [mobile, setMobile] = useState(editing?.mobile ?? '');
  const [date, setDate] = useState(editing ? editing.created_at.slice(0, 10) : todayISO());
  const [paymentMode, setPaymentMode] = useState(editing?.payment_mode ?? 'Cash');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize line items: from editing.items if present, or single item from editing.work_type
  const [isMultiItem, setIsMultiItem] = useState<boolean>(() => {
    return Boolean(editing?.items && editing.items.length > 1);
  });

  const [items, setItems] = useState<FormItem[]>(() => {
    if (editing?.items && editing.items.length > 0) {
      return editing.items.map((it) => ({
        id: it.id || makeId(),
        work_type: it.work_type,
        amount: String(it.amount),
        expense: it.expense,
        work_status: it.work_status,
      }));
    }
    const initWork = editing?.work_type || (workTypes[0]?.name ?? '');
    const initExpense = workTypes.find((w) => w.name === initWork)?.expense ?? 0;
    return [
      {
        id: makeId(),
        work_type: initWork,
        amount: String(editing?.total_amount ?? ''),
        expense: editing?.expense ?? initExpense,
        work_status: editing?.work_status ?? (workStatuses[0]?.name ?? 'Pending'),
      },
    ];
  });

  // Calculate combined total amount from items
  const calculatedTotal = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const calculatedExpense = items.reduce((sum, item) => sum + (Number(item.expense) || 0), 0);

  const [paid, setPaid] = useState(String(editing?.paid ?? ''));
  const paidValue = Number(paid) || 0;

  const handleNameSelect = (name: string, matchingMobile?: string) => {
    setCustomerName(name);
    if (matchingMobile && !mobile) {
      setMobile(matchingMobile);
    }
  };

  const handleItemWorkChange = (index: number, newWorkName: string) => {
    const match = workTypes.find((w) => w.name === newWorkName);
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      work_type: newWorkName,
      expense: match?.expense ?? 0,
    };
    setItems(updated);
  };

  const handleItemAmountChange = (index: number, newAmount: string) => {
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      amount: newAmount,
    };
    setItems(updated);
  };

  const handleItemStatusChange = (index: number, newStatus: string) => {
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      work_status: newStatus,
    };
    setItems(updated);
  };

  const addItemRow = () => {
    const defaultWork = workTypes[0]?.name ?? '';
    const defaultExpense = workTypes[0]?.expense ?? 0;
    setItems([
      ...items,
      {
        id: makeId(),
        work_type: defaultWork,
        amount: '',
        expense: defaultExpense,
        work_status: workStatuses[0]?.name ?? 'Pending',
      },
    ]);
    setIsMultiItem(true);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) return;
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
    if (updated.length <= 1) {
      setIsMultiItem(false);
    }
  };

  const handleSetFullPay = () => {
    setPaid(String(calculatedTotal));
  };

  const validateAndBuildData = (): Partial<CustomerRecord> | null => {
    const name = customerName.trim();
    const mobileValue = mobile.replace(/\D/g, '').slice(0, 10);
    const totalAmount = calculatedTotal;
    const paidAmount = Number(paid) || 0;

    if (!name || items.length === 0 || totalAmount <= 0 || paidAmount < 0 || paidAmount > totalAmount) {
      return null;
    }

    // Check that every item has a valid work type
    const validItems: CustomerWorkItem[] = items.map((it) => ({
      id: it.id,
      work_type: it.work_type,
      amount: Number(it.amount) || 0,
      expense: it.expense,
      work_status: it.work_status,
    }));

    // Primary summary work type string
    const summaryWorkType =
      validItems.length === 1
        ? validItems[0].work_type
        : validItems.map((it) => it.work_type).join(', ');

    // Primary work status (if any pending/in-progress, reflect that; else completed)
    const pendingItem = validItems.find((it) => it.work_status !== 'Completed' && it.work_status !== 'Delivered');
    const overallWorkStatus = pendingItem ? pendingItem.work_status : validItems[0]?.work_status || 'Pending';

    return {
      customer_name: name,
      mobile: mobileValue,
      work_type: summaryWorkType,
      total_amount: totalAmount,
      charges: editing?.charges ?? 0,
      paid: paidAmount,
      expense: calculatedExpense,
      income: totalAmount - calculatedExpense,
      payment_status: getStatus(paidAmount, totalAmount),
      work_status: overallWorkStatus,
      payment_mode: paymentMode,
      items: validItems,
      created_at: new Date(date + 'T' + new Date().toTimeString().slice(0, 8)).toISOString(),
    };
  };

  const handleSaveAndClose = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    const data = validateAndBuildData();
    if (!data || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(data, editing?.id);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveAndNext = async () => {
    const data = validateAndBuildData();
    if (!data || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(data, editing?.id);
      const savedName = data.customer_name;
      setCustomerName('');
      setMobile('');
      setPaid('');
      setPaymentMode('Cash');
      const firstWork = workTypes[0]?.name ?? '';
      const firstExpense = workTypes[0]?.expense ?? 0;
      setItems([
        {
          id: makeId(),
          work_type: firstWork,
          amount: '',
          expense: firstExpense,
          work_status: workStatuses[0]?.name ?? 'Pending',
        },
      ]);
      setIsMultiItem(false);
      setSaveSuccessMsg(`✓ Saved ${savedName}! Ready for next customer.`);
      setTimeout(() => setSaveSuccessMsg(''), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveAndPrint = async () => {
    const data = validateAndBuildData();
    if (!data || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(data, editing?.id);
      printThermalBill(data);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <form
        className="modal"
        style={{ maxWidth: isMultiItem ? '680px' : '560px' }}
        onSubmit={handleSaveAndClose}
        autoComplete="off"
        data-lpignore="true"
        data-form-type="other"
      >
        <div className="modal-header">
          <div>
            <span className="eyebrow accent">{editing ? 'EDIT TRANSACTION' : 'NEW TRANSACTION'}</span>
            <h2>{editing ? 'Edit customer work' : 'Add customer work'}</h2>
            <p>Single or multiple work items with consolidated accounting and one bill.</p>
          </div>
          <button type="button" className="close-button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {saveSuccessMsg && (
          <div
            style={{
              background: '#e6f5ee',
              border: '1px solid #a3dfc2',
              color: '#0d6648',
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '12px',
            }}
          >
            <Check size={16} /> {saveSuccessMsg}
          </div>
        )}

        {/* Customer Primary Details */}
        <div className="form-grid" style={{ marginBottom: '14px' }}>
          <label>
            Customer name
            <CustomerNameField
              value={customerName}
              onChange={handleNameSelect}
              customers={customers}
              placeholder="Search or enter customer name"
              autoFocus
              required
            />
          </label>
          <label>
            Mobile number
            <input
              name="mobile"
              type="tel"
              inputMode="numeric"
              value={mobile}
              maxLength={10}
              placeholder="10 digit mobile number"
              onChange={(event) => {
                const digits = event.target.value.replace(/\D/g, '').slice(0, 10);
                setMobile(digits);
              }}
            />
          </label>
          <label>
            Date
            <input name="date" type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
          </label>
          <label>
            Payment mode
            <select
              name="paymentMode"
              value={paymentMode}
              onChange={(event) => setPaymentMode(event.target.value)}
            >
              <option value="Cash">💵 Cash</option>
              <option value="Online">💳 Online / UPI</option>
            </select>
          </label>
        </div>

        {/* Work Services Section (Supports Multiple Work Items) */}
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '14px',
            padding: '14px',
            marginBottom: '16px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Layers size={16} style={{ color: '#059669' }} />
              <span>Services & Work Types ({items.length})</span>
            </span>
            <button
              type="button"
              onClick={addItemRow}
              style={{
                background: '#ecfdf5',
                color: '#059669',
                border: '1px solid #a7f3d0',
                padding: '5px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer',
              }}
            >
              <Plus size={14} />
              <span>Add Another Work / Service</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {items.map((item, idx) => (
              <div
                key={item.id || idx}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '10px',
                  display: 'grid',
                  gridTemplateColumns: items.length > 1 ? '1.8fr 1fr 1fr auto' : '2fr 1fr 1fr',
                  gap: '8px',
                  alignItems: 'center',
                }}
              >
                <div>
                  <label style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '3px' }}>
                    Service {idx + 1}
                  </label>
                  <select
                    value={item.work_type}
                    onChange={(e) => handleItemWorkChange(idx, e.target.value)}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', fontWeight: 600 }}
                  >
                    {workTypes.map((wt) => (
                      <option key={wt.id} value={wt.name}>
                        {isOwnerMode ? `${wt.name} (Exp: ₹${wt.expense})` : wt.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '3px' }}>
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="₹ 0"
                    value={item.amount}
                    onChange={(e) => handleItemAmountChange(idx, e.target.value)}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 700 }}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '3px' }}>
                    Status
                  </label>
                  <select
                    value={item.work_status}
                    onChange={(e) => handleItemStatusChange(idx, e.target.value)}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: 600 }}
                  >
                    {workStatuses.map((ws) => (
                      <option key={ws.id} value={ws.name}>
                        {ws.name}
                      </option>
                    ))}
                  </select>
                </div>

                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItemRow(idx)}
                    style={{
                      background: '#fee2e2',
                      color: '#ef4444',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '7px',
                      cursor: 'pointer',
                      marginTop: '16px',
                    }}
                    title="Remove item"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Consolidated Totals and Payment Summary */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '10px',
            background: '#f1f5f9',
            borderRadius: '12px',
            padding: '12px',
            marginBottom: '14px',
            textAlign: 'center',
          }}
        >
          {isOwnerMode ? (
            <>
              <div>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, display: 'block' }}>Total Billed</span>
                <strong style={{ fontSize: '16px', color: '#0f172a' }}>{formatCurrency(calculatedTotal)}</strong>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, display: 'block' }}>Total Expense</span>
                <strong style={{ fontSize: '16px', color: '#64748b' }}>{formatCurrency(calculatedExpense)}</strong>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, display: 'block' }}>Estimated Profit</span>
                <strong style={{ fontSize: '16px', color: '#059669' }}>{formatCurrency(calculatedTotal - calculatedExpense)}</strong>
              </div>
            </>
          ) : (
            <>
              <div>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, display: 'block' }}>Total Billed</span>
                <strong style={{ fontSize: '16px', color: '#0f172a' }}>{formatCurrency(calculatedTotal)}</strong>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, display: 'block' }}>Amount Paid</span>
                <strong style={{ fontSize: '16px', color: '#167c57' }}>{formatCurrency(paidValue)}</strong>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, display: 'block' }}>Balance Due</span>
                <strong style={{ fontSize: '16px', color: calculatedTotal - paidValue > 0 ? '#ea580c' : '#059669' }}>
                  {formatCurrency(Math.max(calculatedTotal - paidValue, 0))}
                </strong>
              </div>
            </>
          )}
        </div>

        {/* Paid Amount & Balance Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '18px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', margin: 0 }}>
                Paid Amount (₹)
              </label>
              {calculatedTotal > 0 && (
                <button
                  type="button"
                  onClick={handleSetFullPay}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#059669',
                    fontSize: '11px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Full Paid
                </button>
              )}
            </div>
            <input
              name="paid"
              type="number"
              min="0"
              max={calculatedTotal || undefined}
              value={paid}
              onChange={(event) => setPaid(event.target.value)}
              placeholder="₹ 0"
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: 700 }}
              required
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
              Remaining Balance (Due)
            </label>
            <div
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                background: calculatedTotal - paidValue > 0 ? '#fff7ed' : '#ecfdf5',
                border: `1px solid ${calculatedTotal - paidValue > 0 ? '#fed7aa' : '#a7f3d0'}`,
                color: calculatedTotal - paidValue > 0 ? '#ea580c' : '#059669',
                fontSize: '15px',
                fontWeight: 800,
              }}
            >
              {formatCurrency(Math.max(calculatedTotal - paidValue, 0))}
            </div>
          </div>
        </div>

        <div className="modal-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" className="button secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {!editing && (
              <button
                type="button"
                className="button secondary"
                onClick={handleSaveAndNext}
                disabled={isSubmitting}
                title="Save this record and immediately open a clean form for the next customer"
                style={{
                  background: '#f0fdf4',
                  borderColor: '#86efac',
                  color: '#15803d',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <ArrowRight size={15} />
                <span>Save & Next</span>
              </button>
            )}

            <button
              type="button"
              className="button secondary"
              onClick={handleSaveAndPrint}
              disabled={isSubmitting}
              title="Save transaction and print 80mm/58mm thermal receipt"
              style={{
                background: '#f8fafc',
                borderColor: '#cbd5e1',
                color: '#0f172a',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Printer size={15} />
              <span>Save & Print Bill</span>
            </button>

            <button
              type="submit"
              className="button primary"
              disabled={isSubmitting}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Save size={15} />
              <span>{isSubmitting ? 'Saving...' : editing ? 'Update Record' : 'Save & Close'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
