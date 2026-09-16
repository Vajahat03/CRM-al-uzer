import { useState } from 'react';
import { Plus, Search, Printer } from 'lucide-react';
import { CustomerRecord, WorkType, WorkStatus, formatCurrency, formatDate } from './types';
import { RowMenu } from './RowMenu';
import { ConfirmDialog } from './ConfirmDialog';
import { CustomerModal } from './CustomerModal';
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
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editing, setEditing] = useState<CustomerRecord | null>(null);
  const [deleting, setDeleting] = useState<CustomerRecord | null>(null);

  const filtered = customers.filter((row) => {
    const matchesSearch = `${row.customer_name} ${row.mobile} ${row.work_type} ${row.id}`
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesPayment = paymentFilter === 'all' || row.payment_status.toLowerCase() === paymentFilter;
    const matchesStatus = statusFilter === 'all' || row.work_status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesPayment && matchesStatus;
  });

  const statusOptions = workStatuses.map((ws) => ws.name);

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
      <div className="customer-summary">
        <div>
          <strong>{customers.length}</strong>
          <span>Total records</span>
        </div>
        <div>
          <strong>{workTypes.length}</strong>
          <span>Active work types</span>
        </div>
        <div>
          <strong>{customers.filter((row) => row.payment_status !== 'PAID').length}</strong>
          <span>Open payments</span>
        </div>
      </div>
      <section className="panel table-panel">
        <div className="table-toolbar">
          <div className="table-search">
            <Search size={16} />
            <input
              placeholder="Search customer, mobile or work type"
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
                <th>Work status</th>
                <th>Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
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
                    <span className="work-pill">{row.work_type}</span>
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
                    <span className="work-status">{row.work_status}</span>
                  </td>
                  <td>{formatDate(row.created_at)}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                      <button
                        type="button"
                        className="crm-action-btn"
                        onClick={() => printThermalBill(row)}
                        title="Print Thermal Bill"
                        style={{ color: '#167c57', borderColor: '#b2dfcb', background: '#f0f9f4' }}
                      >
                        <Printer size={13} />
                      </button>
                      <RowMenu
                        onEdit={() => {
                          setEditing(row);
                          if (onEdit) onEdit(row);
                        }}
                        onDelete={() => {
                          setDeleting(row);
                          if (onDelete) onDelete(row);
                        }}
                        onSendSMS={onSendSMS ? () => onSendSMS(row) : undefined}
                        onPrint={() => printThermalBill(row)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
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
