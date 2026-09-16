import { useEffect, useMemo, useRef, useState } from 'react';
import { User, Phone, History } from 'lucide-react';
import { CustomerRecord } from './types';

type Props = {
  value: string;
  onChange: (name: string, mobile?: string) => void;
  customers: CustomerRecord[];
  placeholder?: string;
  required?: boolean;
  autoFocus?: boolean;
};

export function CustomerNameField({
  value,
  onChange,
  customers,
  placeholder = 'Enter customer full name',
  required = true,
  autoFocus = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Extract unique customers from history with their most recent mobile number
  const customerHistory = useMemo(() => {
    const map = new Map<string, { name: string; mobile: string; count: number }>();
    customers.forEach((c) => {
      const trimmed = c.customer_name?.trim();
      if (!trimmed) return;
      const key = trimmed.toLowerCase();
      if (!map.has(key)) {
        map.set(key, { name: trimmed, mobile: c.mobile || '', count: 1 });
      } else {
        const existing = map.get(key)!;
        existing.count += 1;
        if (!existing.mobile && c.mobile) {
          existing.mobile = c.mobile;
        }
      }
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [customers]);

  const matches = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return customerHistory.slice(0, 8);
    return customerHistory.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 10);
  }, [value, customerHistory]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectCustomer = (item: { name: string; mobile: string }) => {
    onChange(item.name, item.mobile);
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setOpen(true);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((prev) => Math.min(prev + 1, matches.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && open && matches[highlight]) {
      e.preventDefault();
      selectCustomer(matches[highlight]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className="customer-name-autocomplete" ref={rootRef} style={{ position: 'relative', width: '100%' }}>
      <input
        ref={inputRef}
        name="customerName"
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setHighlight(0);
        }}
        onFocus={() => {
          if (matches.length > 0) setOpen(true);
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        required={required}
        autoFocus={autoFocus}
        autoComplete="off"
      />

      {open && matches.length > 0 && (
        <div
          className="customer-suggestions-menu"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            maxHeight: '220px',
            overflowY: 'auto',
            background: '#ffffff',
            border: '1px solid #d1d9d4',
            borderRadius: '10px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08)',
            zIndex: 1050,
            padding: '4px',
          }}
        >
          <div
            style={{
              padding: '5px 9px',
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.8px',
              color: '#8b9790',
              textTransform: 'uppercase',
              borderBottom: '1px solid #f0f3f1',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <History size={11} /> Previous Customer Matches
          </div>
          {matches.map((item, idx) => (
            <button
              key={`${item.name}-${idx}`}
              type="button"
              className={`customer-suggestion-item ${idx === highlight ? 'highlighted' : ''}`}
              onMouseEnter={() => setHighlight(idx)}
              onClick={() => selectCustomer(item)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                textAlign: 'left',
                border: 'none',
                borderRadius: '6px',
                background: idx === highlight ? '#eaf6ef' : 'transparent',
                cursor: 'pointer',
                transition: 'background 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: '#167c57',
                    color: '#ffffff',
                    fontSize: '10px',
                    fontWeight: 700,
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                  }}
                >
                  {item.name.slice(0, 2).toUpperCase()}
                </div>
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <strong style={{ display: 'block', fontSize: '13px', color: '#16251e', lineHeight: 1.2 }}>
                    {item.name}
                  </strong>
                  {item.mobile && (
                    <span style={{ fontSize: '11px', color: '#687770', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '1px' }}>
                      <Phone size={10} /> {item.mobile}
                    </span>
                  )}
                </div>
              </div>
              <span
                style={{
                  fontSize: '10px',
                  background: '#f0f4f1',
                  color: '#445249',
                  padding: '2px 6px',
                  borderRadius: '12px',
                  fontWeight: 600,
                  flexShrink: 0,
                  marginLeft: '8px',
                }}
              >
                {item.count} {item.count === 1 ? 'visit' : 'visits'}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
