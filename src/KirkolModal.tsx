import { FormEvent, useState, useRef } from 'react';
import { X, Check, Wand, ArrowRight, Save } from 'lucide-react';
import { Kirkol, formatCurrency, todayISO } from './types';

export function KirkolModal({
  editing,
  onClose,
  onSubmit,
}: {
  editing: Kirkol | null;
  onClose: () => void;
  onSubmit: (data: Partial<Kirkol>, editingId?: string) => Promise<void>;
}) {
  const [work, setWork] = useState(editing?.work ?? '');
  const [price, setPrice] = useState(String(editing?.price ?? ''));
  const [date, setDate] = useState(editing ? editing.created_at.slice(0, 10) : todayISO());
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const workInputRef = useRef<HTMLInputElement>(null);

  const priceValue = Number(price) || 0;

  const validateAndBuildData = (): Partial<Kirkol> | null => {
    const workName = work.trim();
    const priceAmount = Number(price) || 0;
    if (!workName || priceAmount <= 0) return null;

    return {
      work: workName,
      price: priceAmount,
      created_at: new Date(date + 'T' + new Date().toTimeString().slice(0, 8)).toISOString(),
    };
  };

  const handleSaveAndClose = async (event?: FormEvent<HTMLFormElement>) => {
    if (event) event.preventDefault();
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
      const savedWork = data.work;
      setWork('');
      setPrice('');
      setSaveSuccessMsg(`✓ Added "${savedWork}" (₹${data.price})! Ready for next.`);
      setTimeout(() => setSaveSuccessMsg(''), 3500);
      workInputRef.current?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form className="modal small-modal kirkol-modal" onSubmit={handleSaveAndClose}>
        <div className="kirkol-modal-header">
          <div className="kirkol-mascot">
            <Wand size={26} />
          </div>
          <div>
            <span className="eyebrow accent">KIRKOL</span>
            <h2>{editing ? 'Edit kirkol' : 'Add kirkol'}</h2>
            <p>Enter the counter work and price.</p>
          </div>
          <button type="button" className="close-button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {saveSuccessMsg && (
          <div
            style={{
              background: '#fff0ea',
              border: '1px solid #fbd0be',
              color: '#d65a1f',
              padding: '7px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '10px',
            }}
          >
            <Check size={14} /> {saveSuccessMsg}
          </div>
        )}

        <label className="kirkol-field">
          Work description
          <input
            ref={workInputRef}
            name="work"
            value={work}
            onChange={(e) => setWork(e.target.value)}
            placeholder="e.g. Xerox 5 pages, Lamination, Photo"
            autoFocus
            required
          />
        </label>
        <label className="kirkol-field">
          Price
          <input
            name="price"
            type="number"
            min="1"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="₹ 0"
            required
          />
        </label>
        <label className="kirkol-field">
          Date
          <input name="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </label>
        <div className="kirkol-preview">
          <span>Total kirkol price</span>
          <strong>{formatCurrency(priceValue)}</strong>
        </div>
        <div className="modal-actions" style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button type="button" className="button secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>

          {!editing && (
            <button
              type="button"
              className="button secondary"
              style={{
                borderColor: '#e8753a',
                background: '#fff5f0',
                color: '#d65a1f',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
              onClick={handleSaveAndNext}
              disabled={isSubmitting || !work.trim() || priceValue <= 0}
              title="Save this entry and start another one immediately"
            >
              <ArrowRight size={15} /> Save & Next
            </button>
          )}

          <button
            className="button kirkol-submit"
            type="submit"
            disabled={isSubmitting || !work.trim() || priceValue <= 0}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Check size={16} /> {editing ? 'Update' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}
