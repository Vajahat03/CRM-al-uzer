import { FormEvent, useState, useRef } from 'react';
import { Check, X, Printer, ArrowRight, Save } from 'lucide-react';
import { CustomerRecord, getStatus, formatCurrency, todayISO, WorkType, WorkStatus } from './types';
import { WorkTypeField } from './WorkTypeField';
import { CustomerNameField } from './CustomerNameField';
import { printThermalBill } from './billPrinter';

type Props = {
  workTypes: WorkType[];
  workStatuses: WorkStatus[];
  customers?: CustomerRecord[];
  editing?: CustomerRecord | null;
  onClose: () => void;
  onSubmit: (data: Partial<CustomerRecord>, editingId?: string) => Promise<void>;
};

export function CustomerModal({
  workTypes,
  workStatuses,
  customers = [],
  editing,
  onClose,
  onSubmit,
}: Props) {
  const [customerName, setCustomerName] = useState(editing?.customer_name ?? '');
  const [selected, setSelected] = useState(editing?.work_type ?? '');
  const [mobile, setMobile] = useState(editing?.mobile ?? '');
  const [total, setTotal] = useState(String(editing?.total_amount ?? ''));
  const [paid, setPaid] = useState(String(editing?.paid ?? ''));
  const [date, setDate] = useState(editing ? editing.created_at.slice(0, 10) : todayISO());
  const [status, setStatus] = useState(editing?.work_status ?? workStatuses[0]?.name ?? 'Pending');
  const [paymentMode, setPaymentMode] = useState(editing?.payment_mode ?? 'Cash');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const expense = workTypes.find((row) => row.name === selected)?.expense ?? 0;
  const totalValue = Number(total) || 0;
  const paidValue = Number(paid) || 0;

  const handleNameSelect = (name: string, matchingMobile?: string) => {
    setCustomerName(name);
    if (matchingMobile && !mobile) {
      setMobile(matchingMobile);
    }
  };

  const validateAndBuildData = (): Partial<CustomerRecord> | null => {
    const name = customerName.trim();
    const mobileValue = mobile.replace(/\D/g, '').slice(0, 10);
    const totalAmount = Number(total) || 0;
    const paidAmount = Number(paid) || 0;
    const match = workTypes.find((row) => row.name === selected);

    if (!match || !selected || !name || totalAmount <= 0 || paidAmount < 0 || paidAmount > totalAmount) {
      return null;
    }

    return {
      customer_name: name,
      mobile: mobileValue,
      work_type: match.name,
      total_amount: totalAmount,
      charges: editing?.charges ?? 0,
      paid: paidAmount,
      expense: match.expense,
      income: totalAmount - match.expense,
      payment_status: getStatus(paidAmount, totalAmount),
      work_status: status,
      payment_mode: paymentMode,
      created_at: new Date(date + 'T' + new Date().toTimeString().slice(0, 8)).toISOString(),
    };
  };

  // Standard Save (Save and Close)
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

  // Save & Next (Save and Reset for next customer)
  const handleSaveAndNext = async () => {
    const data = validateAndBuildData();
    if (!data || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(data, editing?.id);
      const savedName = data.customer_name;
      // Reset form fields for next entry
      setCustomerName('');
      setMobile('');
      setSelected('');
      setTotal('');
      setPaid('');
      setPaymentMode('Cash');
      setStatus(workStatuses[0]?.name ?? 'Pending');
      setSaveSuccessMsg(`✓ Saved ${savedName}! Ready for next customer.`);
      setTimeout(() => setSaveSuccessMsg(''), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save & Print (Save and Trigger Thermal Bill Print)
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
      <form className="modal" onSubmit={handleSaveAndClose}>
        <div className="modal-header">
          <div>
            <span className="eyebrow accent">{editing ? 'EDIT TRANSACTION' : 'NEW TRANSACTION'}</span>
            <h2>{editing ? 'Edit customer work' : 'Add customer work'}</h2>
            <p>Select customer from history or enter new name. Work type expense calculates automatically.</p>
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
              animation: 'fadeIn 0.2s ease',
            }}
          >
            <Check size={16} /> {saveSuccessMsg}
          </div>
        )}

        <div className="form-grid">
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
          <label className="span-two">
            Work type
            <WorkTypeField workTypes={workTypes} selected={selected} onSelect={setSelected} />
            <input type="hidden" name="workType" value={selected} />
          </label>
          <label>
            Work status
            <select name="workStatus" value={status} onChange={(event) => setStatus(event.target.value)}>
              {workStatuses.map((ws) => (
                <option key={ws.id} value={ws.name}>
                  {ws.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Date
            <input name="date" type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
          </label>
          <label>
            Total amount
            <input
              name="totalAmount"
              type="number"
              min="1"
              value={total}
              onChange={(event) => setTotal(event.target.value)}
              placeholder="₹ 0"
              required
            />
          </label>
          <label>
            Paid amount
            <input
              name="paid"
              type="number"
              min="0"
              max={totalValue || undefined}
              value={paid}
              onChange={(event) => setPaid(event.target.value)}
              placeholder="₹ 0"
              required
            />
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
        <div className="calculation-card">
          <div>
            <span>Expense</span>
            <strong>{formatCurrency(expense)}</strong>
          </div>
          <div>
            <span>Income</span>
            <strong className="success-text">{formatCurrency(totalValue - expense)}</strong>
          </div>
          <div>
            <span>Pending payment</span>
            <strong className="warning-text">{formatCurrency(Math.max(totalValue - paidValue, 0))}</strong>
          </div>
          <div>
            <span>Payment status</span>
            <strong className={`status ${getStatus(paidValue, totalValue).toLowerCase()}`}>
              {getStatus(paidValue, totalValue)}
            </strong>
          </div>
        </div>
        <div className="lookup-note">
          <Check size={15} /> The expense auto-fills from the work type you pick above.
        </div>
        <div className="modal-actions" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'flex-end' }}>
          <button type="button" className="button secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          
          <button
            type="button"
            className="button secondary"
            style={{
              borderColor: '#b2c7bd',
              background: '#f1f7f4',
              color: '#135c3f',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            onClick={handleSaveAndPrint}
            disabled={isSubmitting || !customerName.trim() || !selected || totalValue <= 0}
            title="Save job and print thermal bill receipt"
          >
            <Printer size={15} /> Save & Print
          </button>

          {!editing && (
            <button
              type="button"
              className="button secondary"
              style={{
                borderColor: '#167c57',
                background: '#eaf6ef',
                color: '#126e4e',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
              onClick={handleSaveAndNext}
              disabled={isSubmitting || !customerName.trim() || !selected || totalValue <= 0}
              title="Save this customer and immediately start next customer form"
            >
              <ArrowRight size={15} /> Save & Next
            </button>
          )}

          <button
            className="button primary"
            type="submit"
            disabled={isSubmitting || !customerName.trim() || !selected || totalValue <= 0}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Save size={15} /> {editing ? 'Update work' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}
