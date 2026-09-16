import { useState } from 'react';
import { Plus, Tags, ListChecks } from 'lucide-react';
import { Category, WorkStatus } from './types';
import { RowMenu } from './RowMenu';
import { ConfirmDialog } from './ConfirmDialog';

type Props = {
  categories: Category[];
  workStatuses: WorkStatus[];
  onAddCategory: (name: string) => Promise<void>;
  onEditCategory: (cat: Category) => void;
  onDeleteCategory: (cat: Category) => void;
  onAddStatus: (name: string) => Promise<void>;
  onEditStatus: (ws: WorkStatus) => void;
  onDeleteStatus: (ws: WorkStatus) => void;
  notify: (message: string) => void;
};

type DeleteState = { field: 'category' | 'status'; id: string; name: string };

export function CategoriesAndStatusesPage({ categories, workStatuses, onAddCategory, onEditCategory, onDeleteCategory, onAddStatus, onEditStatus, onDeleteStatus, notify }: Props) {
  const [deleting, setDeleting] = useState<DeleteState | null>(null);
  const [newCat, setNewCat] = useState('');
  const [newStatus, setNewStatus] = useState('');

  const handleAddCategory = async (): Promise<void> => {
    const trimmed = newCat.trim();
    if (!trimmed) {
      notify('Please enter a category name.');
      return;
    }
    await onAddCategory(trimmed);
    setNewCat('');
  };

  const handleAddStatus = async (): Promise<void> => {
    const trimmed = newStatus.trim();
    if (!trimmed) {
      notify('Please enter a status name.');
      return;
    }
    await onAddStatus(trimmed);
    setNewStatus('');
  };

  const confirmDelete = async (): Promise<void> => {
    if (!deleting) return;
    if (deleting.field === 'category') onDeleteCategory({ id: deleting.id, name: deleting.name });
    else onDeleteStatus({ id: deleting.id, name: deleting.name });
    setDeleting(null);
  };

  return (
    <>
      <div className="page-heading">
        <div><span className="eyebrow accent">SETTINGS</span><h1>Categories & Work Statuses</h1><p>Manage spending categories and the work status options shown in the customer form.</p></div>
      </div>
      <div className="worktype-layout">
        <section className="panel table-panel">
          <div className="table-toolbar"><div><h2>Spending categories</h2><p className="panel-copy">{categories.length} categories</p></div></div>
          <div className="table-scroll">
            <table>
              <thead><tr><th>Category</th><th /></tr></thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat.id}>
                    <td><span className="work-pill">{cat.name}</span></td>
                    <td><RowMenu onEdit={() => onEditCategory(cat)} onDelete={() => setDeleting({ field: 'category', id: cat.id, name: cat.name })} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="panel add-work-panel">
          <div className="form-icon"><Tags size={20} /></div>
          <h2>Add a category</h2>
          <p>Appears in the spending form immediately.</p>
          <label>Category name<input value={newCat} onChange={(event) => setNewCat(event.target.value)} placeholder="e.g. Rent" /></label>
          <button className="button primary full" onClick={() => void handleAddCategory()}><Plus size={16} /> Add category</button>
        </section>
      </div>

      <div className="worktype-layout" style={{ marginTop: '18px' }}>
        <section className="panel table-panel">
          <div className="table-toolbar"><div><h2>Work statuses</h2><p className="panel-copy">{workStatuses.length} statuses</p></div></div>
          <div className="table-scroll">
            <table>
              <thead><tr><th>Status</th><th /></tr></thead>
              <tbody>
                {workStatuses.map((ws) => (
                  <tr key={ws.id}>
                    <td><span className="work-pill">{ws.name}</span></td>
                    <td><RowMenu onEdit={() => onEditStatus(ws)} onDelete={() => setDeleting({ field: 'status', id: ws.id, name: ws.name })} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="panel add-work-panel">
          <div className="form-icon"><ListChecks size={20} /></div>
          <h2>Add a work status</h2>
          <p>Appears in the customer form immediately.</p>
          <label>Status name<input value={newStatus} onChange={(event) => setNewStatus(event.target.value)} placeholder="e.g. On Hold" /></label>
          <button className="button primary full" onClick={() => void handleAddStatus()}><Plus size={16} /> Add work status</button>
        </section>
      </div>

      {deleting && <ConfirmDialog title={`Delete ${deleting.field === 'category' ? 'category' : 'work status'}?`} message={`"${deleting.name}" will be removed from the list.`} onConfirm={() => void confirmDelete()} onCancel={() => setDeleting(null)} />}
    </>
  );
}
