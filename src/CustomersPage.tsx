import { useState, useMemo } from 'react';
import { Plus, Search, Printer, Calendar, CheckCircle2, Layers, Pencil, Trash2 } from 'lucide-react';
import { CustomerRecord, WorkType, WorkStatus, formatCurrency, formatDate, MONTH_NAMES } from './types';
import { RowMenu } from './RowMenu';
import { ConfirmDialog } from './ConfirmDialog';
import { CustomerModal } from './CustomerModal';
import { OwnerAuthModal } from './OwnerAuthModal';
import { QuickPayModal } from './QuickPayModal';
import { printThermalBill } from './billPrinter';

type Props = {
  customers: CustomerRecord[];
  workTypes: WorkType[];
  workStatuses: WorkStatus[];
  search: string;
  onSearch: (value: string) => void;
  onAdd: () => void;
  onEdit?: (row: CustomerRecord) => void;
  onDelete?: (row: CustomerRecord) => void;
  onSendSMS?: (row: CustomerRecord) => void;
  saveCustomer: (data: Partial<CustomerRecord>, editingId?: string) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
};

export function CustomersPage({
  customers,
  workTypes,
  workStatuses,
  search,
  onSearch,
  onAdd,
  onEdit,
  onDelete,
  onSendSMS,
  saveCustomer,
  deleteCustomer,
}: Props) {
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth()).padStart(2, '0')}`;
  });
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editing, setEditing] = useState<CustomerRecord | null>(null);
  const [deleting, setDeleting] = useState<CustomerRecord | null>(null);
  const [quickPayCustomer, setQuickPayCustomer] = useState<CustomerRecord | null>(null);
  const [ownerAuth, setOwnerAuth] = useState<{
    isOpen: boolean;
    action: 'edit' | 'delete';
    customer: CustomerRecord | null;
  }>({
    isOpen: false,
    action: 'edit',
    customer: null,
  });

  // Generate available Month & Year options from recorded customer dates + current & recent months
  const monthOptions = useMemo(() => {
    const map = new Map<string, { key: string; label: string; year: number; month: number }>();
    const registerDate = (iso?: string) => {
      if (!iso) return;
      try {
        const d = new Date(iso);
        if (isNaN(d.getTime())) return;
        const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
        if (!map.has(key)) {
          const label = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
          map.set(key, { key, label, year: d.getFullYear(), month: d.getMonth() });
        }
      } catch {}
    };

    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      registerDate(d.toISOString());
    }

    customers.forEach((c) => registerDate(c.created_at));

    return Array.from(map.values()).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
  }, [customers]);

  const monthFilteredCustomers = useMemo(() => {
    if (selectedMonthKey === 'ALL') return customers;
    return customers.filter((c) => {
      if (!c.created_at) return false;
      const d = new Date(c.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
      return key === selectedMonthKey;
    });
  }, [customers, selectedMonthKey]);

  const filtered = useMemo(() => {
    return monthFilteredCustomers.filter((row) => {
      const matchesSearch = `${row.customer_name} ${row.mobile} ${row.work_type} ${row.id}`
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesPayment = paymentFilter === 'all' || row.payment_status.toLowerCase() === paymentFilter;
      const matchesStatus = statusFilter === 'all' || row.work_status.toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesPayment && matchesStatus;
    });
  }, [monthFilteredCustomers, search, paymentFilter, statusFilter]);

  const statusOptions = workStatuses.map((ws) => ws.name);

  const selectedMonthLabel =
    selectedMonthKey === 'ALL'
      ? 'All Months (All Time Records)'
      : monthOptions.find((m) => m.key === selectedMonthKey)?.label || selectedMonthKey;

  const totalBilled = useMemo(
    () => monthFilteredCustomers.reduce((sum, r) => sum + (Number(r.total_amount) || 0), 0),
    [monthFilteredCustomers]
  );
  const totalPending = useMemo(
    () => monthFilteredCustomers.reduce((sum, r) => sum + Math.max((Number(r.total_amount) || 0) - (Number(r.paid) || 0), 0), 0),
    [monthFilteredCustomers]
  );

  const handleRequestOwnerAuth = (action: 'edit' | 'delete', customer: CustomerRecord) => {
    setOwnerAuth({
      isOpen: true,
      action,
      customer,
    });
  };

  const handleOwnerVerified = () => {
    const { action, customer } = ownerAuth;
    setOwnerAuth({ isOpen: false, action: 'edit', customer: null });
    if (!customer) return;

    if (action === 'edit') {
      setEditing(customer);
      if (onEdit) onEdit(customer);
    } else if (action === 'delete') {
      setDeleting(customer);
      if (onDelete) onDelete(customer);
    }
  };

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow accent">BUSINESS</span>
          <h1>Customer details</h1>
          <p>Manage customer work, payments, delivery status and bill printing.</p>
        </div>
        <button className="button primary" onClick={onAdd}>
          <Plus size={16} /> Add customer
        </button>
      </div>

      {/* Month Filter Bar */}
      <div
        className="month-filter-strip"
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8e2',
          borderRadius: '12px',
          padding: '12px 16px',
          marginBottom: '16px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: '#eaf6ef',
              color: '#167c57',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <Calendar size={18} />
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#88958e', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              Select Month Filter
            </div>
            <strong style={{ fontSize: '15px', color: '#16251e' }}>{selectedMonthLabel}</strong>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <select
            className="filter-select"
            value={selectedMonthKey}
            onChange={(e) => setSelectedMonthKey(e.target.value)}
            style={{ fontWeight: 600, minWidth: '190px' }}
          >
            <option value="ALL">All Months (All Time Records)</option>
            {monthOptions.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="customer-summary">
        <div>
          <strong>{monthFilteredCustomers.length}</strong>
          <span>Total records ({selectedMonthKey === 'ALL' ? 'All Time' : selectedMonthLabel})</span>
        </div>
        <div>
          <strong>{formatCurrency(totalBilled)}</strong>
          <span>Total Billed</span>
        </div>
        <div>
          <strong className={totalPending > 0 ? 'warning-text' : 'success-text'}>{formatCurrency(totalPending)}</strong>
          <span>Unpaid Balance ({monthFilteredCustomers.filter((row) => row.payment_status !== 'PAID').length} open)</span>
        </div>
        <div>
          <strong>{workTypes.length}</strong>
          <span>Active work types</span>
        </div>
      </div>
      <section className="panel table-panel">
        <div className="table-toolbar">
          <div className="table-search">
            <Search size={16} />
            <input
              placeholder={`Search ${selectedMonthLabel} customer, mobile or work type`}
              value={search}
              onChange={(event) => onSearch(event.target.value)}
            />
          </div>
          <div className="filter-group">
            <select className="filter-select" value={paymentFilter} onChange={(event) => setPaymentFilter(event.target.value)}>
              <option value="all">All payments</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="pending">Pending</option>
            </select>
            <select className="filter-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">All work statuses</option>
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Work type</th>
                <th>Total amount</th>
                <th>Charges</th>
                <th>Paid</th>
                <th>Expense</th>
                <th>Payment</th>
                <th>Mode</th>
                <th>Work status</th>
                <th>Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const balance = (Number(row.total_amount) || 0) - (Number(row.paid) || 0);
                return (
                  <tr key={row.id}>
                    <td>
                      <div className="customer-cell">
                        <div className="table-avatar">{row.customer_name.slice(0, 2).toUpperCase()}</div>
                        <div>
                          <strong>{row.customer_name}</strong>
                          <span>{row.mobile || 'No mobile added'}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <span className="work-pill">{row.work_type}</span>
                        {row.items && row.items.length > 1 && (
                          <span
                            style={{
                              fontSize: '10px',
                              color: '#059669',
                              background: '#ecfdf5',
                              border: '1px solid #a7f3d0',
                              borderRadius: '6px',
                              padding: '1px 6px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              width: 'fit-content',
                              fontWeight: 700,
                            }}
                          >
                            <Layers size={10} /> {row.items.length} works itemized
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <strong>{formatCurrency(row.total_amount)}</strong>
                    </td>
                    <td>{formatCurrency(row.charges)}</td>
                    <td>{formatCurrency(row.paid)}</td>
                    <td>{formatCurrency(row.expense)}</td>
                    <td>
                      <span className={`status ${row.payment_status.toLowerCase()}`}>{row.payment_status}</span>
                    </td>
                    <td>
                      <span
                        className="work-pill"
                        style={{
                          fontSize: '11px',
                          background: row.payment_mode === 'Online' ? '#e0f2fe' : '#f0fdf4',
                          color: row.payment_mode === 'Online' ? '#0369a1' : '#15803d',
                          fontWeight: 600,
                        }}
                      >
                        {row.payment_mode === 'Online' ? '💳 Online' : '💵 Cash'}
                      </span>
                    </td>
                    <td>
                      <span className="work-status">{row.work_status}</span>
                    </td>
                    <td>{formatDate(row.created_at)}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                        {/* Quick Pay / Paid Button */}
                        <button
                          type="button"
                          className="crm-action-btn"
                          onClick={() => setQuickPayCustomer(row)}
                          title={balance > 0 ? `Collect remaining balance (${formatCurrency(balance)})` : 'Customer has paid in full'}
                          style={
                            balance > 0
                              ? { color: '#059669', borderColor: '#6ee7b7', background: '#ecfdf5', fontWeight: 700 }
                              : { color: '#64748b', borderColor: '#cbd5e1', background: '#f8fafc' }
                          }
                        >
                          <CheckCircle2 size={13} />
                          <span style={{ fontSize: '11px', marginLeft: '3px' }}>{balance > 0 ? 'Pay' : 'Paid'}</span>
                        </button>

                        <button
                          type="button"
                          className="crm-action-btn"
                          onClick={() => printThermalBill(row)}
                          title="Print Thermal Bill"
                          style={{ color: '#167c57', borderColor: '#b2dfcb', background: '#f0f9f4' }}
                        >
                          <Printer size={13} />
                        </button>

                        <button
                          type="button"
                          className="crm-action-btn"
                          onClick={() => handleRequestOwnerAuth('edit', row)}
                          title="Edit (Requires Owner PIN)"
                        >
                          <Pencil size={13} />
                        </button>

                        <button
                          type="button"
                          className="crm-action-btn danger"
                          onClick={() => handleRequestOwnerAuth('delete', row)}
                          title="Delete (Requires Owner PIN)"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!filtered.length && <div className="empty-state">No customer records match your search and filters.</div>}
        </div>
      </section>

      {editing && (
        <CustomerModal
          workTypes={workTypes}
          workStatuses={workStatuses}
          customers={customers}
          editing={editing}
          onClose={() => setEditing(null)}
          onSubmit={saveCustomer}
        />
      )}

      {quickPayCustomer && (
        <QuickPayModal
          customer={quickPayCustomer}
          onClose={() => setQuickPayCustomer(null)}
          onSavePayment={saveCustomer}
        />
      )}

      <OwnerAuthModal
        isOpen={ownerAuth.isOpen}
        actionTitle={ownerAuth.action === 'delete' ? 'Owner Authorization: Delete Customer' : 'Owner Authorization: Edit Customer'}
        actionDescription={
          ownerAuth.action === 'delete'
            ? `Enter Owner PIN (163692) to delete "${ownerAuth.customer?.customer_name}"'s record.`
            : `Enter Owner PIN (163692) to edit "${ownerAuth.customer?.customer_name}"'s record.`
        }
        onClose={() => setOwnerAuth({ isOpen: false, action: 'edit', customer: null })}
        onVerified={handleOwnerVerified}
      />

      {deleting && (
        <ConfirmDialog
          title="Delete customer?"
          message={`"${deleting.customer_name}"'s record will be permanently removed and dashboard totals recalculated.`}
          onConfirm={async () => {
            await deleteCustomer(deleting.id);
            setDeleting(null);
          }}
          onCancel={() => setDeleting(null)}
        />
      )}
    </>
  );
}
