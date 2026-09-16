import { useEffect, useRef, useState } from 'react';
import { MoreHorizontal, Pencil, Trash2, Smartphone, Printer } from 'lucide-react';

type Props = {
  onEdit: () => void;
  onDelete: () => void;
  onSendSMS?: () => void;
  onPrint?: () => void;
};

export function RowMenu({ onEdit, onDelete, onSendSMS, onPrint }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (event: MouseEvent): void => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="row-menu" ref={ref}>
      <button type="button" className="dots" onClick={() => setOpen((o) => !o)} title="Actions">
        <MoreHorizontal size={17} />
      </button>
      {open && (
        <div className="row-menu-pop">
          {onPrint && (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onPrint();
              }}
              style={{ color: '#167c57' }}
            >
              <Printer size={14} /> Print Bill
            </button>
          )}
          {onSendSMS && (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onSendSMS();
              }}
            >
              <Smartphone size={14} /> Send SMS
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
          >
            <Pencil size={14} /> Edit
          </button>
          <button
            type="button"
            className="danger"
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      )}
    </div>
  );
}
