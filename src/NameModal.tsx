import { FormEvent, useState } from 'react';
import { X } from 'lucide-react';

type Props = {
  title: string;
  label: string;
  placeholder: string;
  editing?: string | null;
  onClose: () => void;
  onSubmit: (name: string, editingId?: string) => Promise<void>;
};

export function NameModal({ title, label, placeholder, editing, onClose, onSubmit }: Props) {
  const [name, setName] = useState(editing ?? '');

  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    await onSubmit(trimmed);
  };

  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <form className="modal small-modal" onSubmit={submit}>
        <div className="modal-header">
          <div>
            <span className="eyebrow accent">{editing ? 'EDIT' : 'NEW'}</span>
            <h2>{title}</h2>
            <p>Enter the name below.</p>
          </div>
          <button type="button" className="close-button" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="form-grid">
          <label className="span-two">{label}
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder={placeholder} autoFocus required />
          </label>
        </div>
        <div className="modal-actions">
          <button type="button" className="button secondary" onClick={onClose}>Cancel</button>
          <button className="button primary" type="submit">{editing ? 'Update' : 'Add'}</button>
        </div>
      </form>
    </div>
  );
}
