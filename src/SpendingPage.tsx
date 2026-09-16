import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Spending, Category, formatCurrency, formatDate } from './types';
import { RowMenu } from './RowMenu';
import { ConfirmDialog } from './ConfirmDialog';
import { SpendingModal } from './SpendingModal';

type Props = {
  spendings: Spending[];
  categories: Category[];
  onAdd?: () => void;
  saveSpending: (data: Partial<Spending>, editingId?: string) => Promise<void>;
  deleteSpending: (id: string) => Promise<void>;
  onAddCategory: () => void;
};

export function SpendingPage({ spendings, categories, onAdd, saveSpending, deleteSpending, onAddCategory }: Props) {
  const [editing, setEditing] = useState<Spending | null>(null);
  const [deleting, setDeleting] = useState<Spending | null>(null);
  const [showForm, setShowForm] = useState(false);

  return (
    <>
      <div className="page-heading">
        <div><span className="eyebrow accent">BUSINESS</span><h1>Spending</h1><p>Keep business expenses separate from customer work.</p></div>
        <button className="button primary" onClick={() => { if (onAdd) onAdd(); else { setEditing(null); setShowForm(true); } }}><Plus size={16} /> Add spending</button>
      </div>
      <section className="panel table-panel">
        <div className="panel-header" style={{ padding: '20px 20px 0' }}>
          <div><h2>Business spending</h2><p>{formatCurrency(spendings.reduce((sum, row) => sum + row.amount, 0))} recorded expenses</p></div>
        </div>
        <div className="table-scroll">
          <table>
            <thead><tr><th>Expense name</th><th>Category</th><th>Amount</th><th>Date</th><th /></tr></thead>
            <tbody>
              {spendings.map((row) => (
                <tr key={row.id}>
                  <td><strong>{row.expense_name}</strong></td>
                  <td><span className="work-pill">{row.category}</span></td>
                  <td><strong>{formatCurrency(row.amount)}</strong></td>
                  <td>{formatDate(row.created_at)}</td>
                  <td><RowMenu onEdit={() => { setEditing(row); setShowForm(true); }} onDelete={() => setDeleting(row)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!spendings.length && <div className="empty-state"><strong>No spending recorded yet</strong><span>Add electricity, internet or other business expenses here.</span></div>}
        </div>
      </section>

      {showForm && <SpendingModal categories={categories} editing={editing} onClose={() => { setShowForm(false); setEditing(null); }} onSubmit={saveSpending} onAddCategory={onAddCategory} />}
      {deleting && <ConfirmDialog title="Delete spending?" message={`"${deleting.expense_name}" will be removed and dashboard totals recalculated.`} onConfirm={async () => { await deleteSpending(deleting.id); setDeleting(null); }} onCancel={() => setDeleting(null)} />}
    </>
  );
}
