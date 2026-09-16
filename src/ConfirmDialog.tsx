import { AlertTriangle } from 'lucide-react';

type Props = { title: string; message: string; confirmLabel?: string; onConfirm: () => void; onCancel: () => void };

export function ConfirmDialog({ title, message, confirmLabel = 'Delete', onConfirm, onCancel }: Props) {
  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}>
      <div className="confirm-dialog">
        <div className="confirm-icon"><AlertTriangle size={24} /></div>
        <h2>{title}</h2>
        <p>{message}</p>
        <div className="modal-actions">
          <button className="button secondary" onClick={onCancel}>Cancel</button>
          <button className="button danger" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
