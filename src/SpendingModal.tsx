import { FormEvent, useState, useRef } from 'react';
import { X, Check, ArrowRight, Save } from 'lucide-react';
import { Spending, Category } from './types';

type Props = {
  categories: Category[];
  editing?: Spending | null;
  onClose: () => void;
  onSubmit: (data: Partial<Spending>, editingId?: string) => Promise<void>;
  onAddCategory: () => void;
};

export function SpendingModal({ categories, editing, onClose, onSubmit, onAddCategory }: Props) {
  const [expenseName, setExpenseName] = useState(editing?.expense_name ?? '');
  const [amount, setAmount] = useState(editing ? String(editing.amount) : '');
  const [category, setCategory] = useState(editing?.category ?? categories[0]?.name ?? 'Business');
  const [date, setDate] = useState(editing ? editing.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10));
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const validateAndBuildData = (): Partial<Spending> | null => {
    const name = expenseName.trim();
    const amountVal = Number(amount) || 0;
    const cat = category || categories[0]?.name || 'Business';
    if (!name || amountVal <= 0) return null;

    return {
      expense_name: name,
      amount: amountVal,
      category: cat,
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
      const savedName = data.expense_name;
      setExpenseName('');
      setAmount('');
      setSaveSuccessMsg(`✓ Added "${savedName}" (₹${data.amount})! Ready for next.`);
      setTimeout(() => setSaveSuccessMsg(''), 3500);
      nameInputRef.current?.focus();
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
      <form className="modal small-modal" onSubmit={handleSaveAndClose}>
        <div className="modal-header">
          <div>
            <span className="eyebrow accent">BUSINESS EXPENSE</span>
            <h2>{editing ? 'Edit spending' : 'Add spending'}</h2>
            <p>Keep non-customer expenses separate.</p>
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

        <div className="form-grid">
          <label>
            Expense name
            <input
              ref={nameInputRef}
              name="expenseName"
              value={expenseName}
              onChange={(e) => setExpenseName(e.target.value)}
              placeholder="e.g. Electricity bill, Chai, Shop Rent"
              autoFocus
              required
            />
          </label>
          <label>
            Category
            <div className="select-with-add">
              <select name="category" value={category} onChange={(e) => setCategory(e.target.value)}>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <button type="button" className="add-inline" onClick={onAddCategory} title="Add new category">
                +
              </button>
            </div>
          </label>
          <label>
            Date
            <input name="date" type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
          </label>
          <label>
            Amount
            <input
              name="amount"
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="₹ 0"
              required
            />
          </label>
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
                borderColor: '#167c57',
                background: '#eaf6ef',
                color: '#126e4e',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
              onClick={handleSaveAndNext}
              disabled={isSubmitting || !expenseName.trim() || Number(amount) <= 0}
              title="Save this spending and immediately start next spending"
            >
              <ArrowRight size={15} /> Save & Next
            </button>
          )}

          <button
            className="button primary"
            type="submit"
            disabled={isSubmitting || !expenseName.trim() || Number(amount) <= 0}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Save size={15} /> {editing ? 'Update' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}
