import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { formatCurrency, WorkType } from './types';

type Props = { workTypes: WorkType[]; selected: string; onSelect: (name: string) => void };

export function WorkTypeField({ workTypes, selected, onSelect }: Props) {
  const [query, setQuery] = useState(selected);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setQuery(selected); }, [selected]);

  useEffect(() => {
    const handler = (event: MouseEvent): void => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
        if (selected) setQuery(selected);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [selected]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = workTypes.filter((row) => row.is_active && (q === '' || row.name.toLowerCase().includes(q)));
    return list.slice(0, 40);
  }, [query, workTypes]);

  const choose = (name: string): void => { onSelect(name); setQuery(name); setOpen(false); };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'ArrowDown') { event.preventDefault(); setOpen(true); setHighlight((h) => Math.min(h + 1, matches.length - 1)); }
    else if (event.key === 'ArrowUp') { event.preventDefault(); setHighlight((h) => Math.max(h - 1, 0)); }
    else if (event.key === 'Enter' && open && matches[highlight]) { event.preventDefault(); choose(matches[highlight].name); }
    else if (event.key === 'Escape') setOpen(false);
  };

  const match = workTypes.find((row) => row.name === selected);

  return (
    <div className="combobox" ref={rootRef}>
      <div className="combobox-input" onClick={() => setOpen(true)}>
        <input
          value={query}
          placeholder="Type to search work type..."
          onFocus={() => setOpen(true)}
          onChange={(event) => { setQuery(event.target.value); setOpen(true); setHighlight(0); onSelect(''); }}
          onKeyDown={onKeyDown}
          required
        />
        {match && <span className="combobox-expense">{formatCurrency(match.expense)}</span>}
        <ChevronDown size={16} className="combobox-caret" />
      </div>
      {open && (
        <div className="combobox-menu">
          {matches.length ? matches.map((row, index) => (
            <button
              type="button"
              key={row.id}
              className={`combobox-option ${index === highlight ? 'hovered' : ''} ${row.name === selected ? 'chosen' : ''}`}
              onMouseEnter={() => setHighlight(index)}
              onClick={() => choose(row.name)}
            >
              <span>{row.name}</span>
              <i>{formatCurrency(row.expense)}</i>
            </button>
          )) : <div className="combobox-empty">No matching work type. Add it from the Work Types page.</div>}
        </div>
      )}
    </div>
  );
}
