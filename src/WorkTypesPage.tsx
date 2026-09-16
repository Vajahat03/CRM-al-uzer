import { useState } from 'react';
import { BriefcaseBusiness, Plus, Search, X, Check } from 'lucide-react';
import { WorkType, formatCurrency, makeId } from './types';
import { RowMenu } from './RowMenu';
import { ConfirmDialog } from './ConfirmDialog';

type Props = {
  workTypes: WorkType[];
  onSaveWorkType?: (data: Partial<WorkType>, editingId?: string) => Promise<void>;
  onDeleteWorkType?: (id: string) => Promise<void>;
  setWorkTypes?: (types: WorkType[]) => void;
  notify: (message: string) => void;
};

export function WorkTypesPage({
  workTypes,
  onSaveWorkType,
  onDeleteWorkType,
  setWorkTypes,
  notify,
}: Props) {
  const [query, setQuery] = useState('');
  const [name, setName] = useState('');
  const [expense, setExpense] = useState('');
  const [editing, setEditing] = useState<WorkType | null>(null);
  const [editName, setEditName] = useState('');
  const [editExpense, setEditExpense] = useState('');
  const [deleting, setDeleting] = useState<WorkType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const visible = workTypes.filter((row) => row.name.toLowerCase().includes(query.toLowerCase()));

  const add = async (): Promise<void> => {
    const normalized = name.trim().toUpperCase();
    const amount = Number(expense);
    if (!normalized || amount < 0) {
      notify('Enter a valid work type name and expense.');
      return;
    }
    if (workTypes.some((row) => row.name.toUpperCase() === normalized)) {
      notify('A work type with this name already exists.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newWorkType: WorkType = { id: makeId(), name: normalized, expense: amount, is_active: true };
      if (onSaveWorkType) {
        await onSaveWorkType(newWorkType);
      } else if (setWorkTypes) {
        setWorkTypes([...workTypes, newWorkType]);
      }
      setName('');
      setExpense('');
      notify('Work type saved & synced permanently.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (row: WorkType): void => {
    setEditing(row);
    setEditName(row.name);
    setEditExpense(String(row.expense));
  };

  const saveEdit = async (): Promise<void> => {
    if (!editing) return;
    const normalized = editName.trim().toUpperCase();
    const amount = Number(editExpense);
    if (!normalized || amount < 0) {
      notify('Enter a valid name and expense.');
      return;
    }
    if (workTypes.some((row) => row.name.toUpperCase() === normalized && row.id !== editing.id)) {
      notify('Another work type already uses that name.');
      return;
    }

    setIsSubmitting(true);
    try {
      const updated: Partial<WorkType> = { name: normalized, expense: amount };
      if (onSaveWorkType) {
        await onSaveWorkType(updated, editing.id);
      } else if (setWorkTypes) {
        setWorkTypes(workTypes.map((row) => (row.id === editing.id ? { ...row, ...updated } : row)));
      }
      setEditing(null);
      notify('Work type updated & synced.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async (): Promise<void> => {
    if (!deleting) return;
    setIsSubmitting(true);
    try {
      if (onDeleteWorkType) {
        await onDeleteWorkType(deleting.id);
      } else if (setWorkTypes) {
        setWorkTypes(workTypes.filter((row) => row.id !== deleting.id));
      }
      setDeleting(null);
      notify('Work type deleted.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow accent">SETTINGS & SERVICES</span>
          <h1>Work types & expense chart</h1>
          <p>Master catalog of all government and online services with automated expense lookup.</p>
        </div>
      </div>
      <div className="worktype-layout">
        <section className="panel table-panel">
          <div className="table-toolbar">
            <div>
              <h2>Master work types</h2>
              <p className="panel-copy">{workTypes.length} services configured and synced</p>
            </div>
            <div className="table-search compact">
              <Search size={16} />
              <input placeholder="Find work type..." value={query} onChange={(event) => setQuery(event.target.value)} />
            </div>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Work type</th>
                  <th>Expense</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {visible.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <strong>{row.name}</strong>
                    </td>
                    <td className="expense-value">{formatCurrency(row.expense)}</td>
                    <td>
                      <span className="active-status">
                        <i />
                        Active
                      </span>
                    </td>
                    <td>
                      <RowMenu onEdit={() => startEdit(row)} onDelete={() => setDeleting(row)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!visible.length && <div className="empty-state">No work types found. Add a work type to get started.</div>}
          </div>
        </section>
        <section className="panel add-work-panel">
          <div className="form-icon">
            <BriefcaseBusiness size={20} />
          </div>
          <h2>Add a work type</h2>
          <p>This is instantly available in customer forms and synced across sessions.</p>
          <label>
            Work type name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. PAN CARD 800, PASSPORT FRESH"
              onKeyDown={(e) => {
                if (e.key === 'Enter') void add();
              }}
            />
          </label>
          <label>
            Expense amount
            <input
              type="number"
              min="0"
              value={expense}
              onChange={(event) => setExpense(event.target.value)}
              placeholder="₹ 0"
              onKeyDown={(e) => {
                if (e.key === 'Enter') void add();
              }}
            />
          </label>
          <button className="button primary full" onClick={add} disabled={isSubmitting || !name.trim()}>
            <Plus size={16} /> {isSubmitting ? 'Saving...' : 'Add & Sync work type'}
          </button>
        </section>
      </div>

      {editing && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setEditing(null);
          }}
        >
          <div className="modal small-modal">
            <div className="modal-header">
              <div>
                <span className="eyebrow accent">EDIT</span>
                <h2>Edit work type</h2>
                <p>Update the service name or default expense.</p>
              </div>
              <button className="close-button" onClick={() => setEditing(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="form-grid">
              <label className="span-two">
                Work type
                <input value={editName} onChange={(event) => setEditName(event.target.value)} autoFocus />
              </label>
              <label className="span-two">
                Expense amount
                <input
                  type="number"
                  min="0"
                  value={editExpense}
                  onChange={(event) => setEditExpense(event.target.value)}
                  placeholder="₹ 0"
                />
              </label>
            </div>
            <div className="modal-actions">
              <button className="button secondary" onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button className="button primary" onClick={saveEdit} disabled={isSubmitting || !editName.trim()}>
                <Check size={15} /> Update work type
              </button>
            </div>
          </div>
        </div>
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete work type?"
          message={`"${deleting.name}" will be removed from your catalog. Existing customer records will keep their stored values.`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </>
  );
}
