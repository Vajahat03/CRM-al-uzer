import React, { useState } from 'react';
import { X, Send, Smartphone, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { CustomerRecord, formatCurrency } from '../types';
import { smsService } from './smsService';

interface SendSMSModalProps {
  customer: CustomerRecord;
  onClose: () => void;
  onSent: (message: string) => void;
}

export const SendSMSModal: React.FC<SendSMSModalProps> = ({
  customer,
  onClose,
  onSent,
}) => {
  const settings = smsService.getSettings();
  const balance = Math.max((Number(customer.total_amount) || 0) - (Number(customer.paid) || 0), 0);
  const now = new Date();
  const createdAtDate = customer.created_at ? new Date(customer.created_at) : now;
  const daysPending = Math.max(0, Math.floor((now.getTime() - createdAtDate.getTime()) / (1000 * 60 * 60 * 24)));

  const defaultMsg = smsService.compileMessage(
    settings.messageTemplate,
    customer,
    balance,
    daysPending,
    settings.businessName
  );

  const [message, setMessage] = useState(defaultMsg);
  const [isSending, setIsSending] = useState(false);
  const cleanPhone = smsService.sanitizePhone(customer.mobile);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cleanPhone) {
      alert('Cannot send SMS: Customer has no valid 10-digit mobile number.');
      return;
    }

    setIsSending(true);
    const item = await smsService.createSingleCustomerSMS(customer, message);
    await smsService.dispatchQueueItem(item.id);
    setIsSending(false);
    onSent(`SMS reminder dispatched to ${customer.customer_name} (+91 ${cleanPhone})!`);
    onClose();
  };

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <form className="modal small-modal" onSubmit={handleSend}>
        <div className="modal-header">
          <div>
            <span className="eyebrow accent">AUTOMATED REMINDER</span>
            <h2>Send SMS Reminder</h2>
            <p>Dispatch via Connected Android SIM Gateway</p>
          </div>
          <button type="button" className="close-button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Customer Summary Box */}
        <div className="calculation-card" style={{ marginTop: '4px', marginBottom: '14px' }}>
          <div>
            <span>Customer</span>
            <strong>{customer.customer_name}</strong>
          </div>
          <div>
            <span>Mobile</span>
            <strong style={{ fontFamily: 'monospace', color: cleanPhone ? '#147d59' : '#cd7051' }}>
              {cleanPhone ? `+91 ${cleanPhone}` : 'No Mobile'}
            </strong>
          </div>
          <div>
            <span>Pending Balance</span>
            <strong className="warning-text">{formatCurrency(balance)}</strong>
          </div>
          <div>
            <span>Overdue Duration</span>
            <strong style={{ color: daysPending >= 5 ? '#c78329' : '#147d59' }}>
              {daysPending} days {daysPending >= 5 ? '(5+ Days Overdue)' : ''}
            </strong>
          </div>
        </div>

        {!cleanPhone && (
          <div
            style={{
              padding: '10px 12px',
              background: '#fff3dd',
              border: '1px solid #fae1b4',
              color: '#996014',
              borderRadius: '8px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '14px',
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>Please add a 10-digit mobile number to this customer profile before sending an SMS.</span>
          </div>
        )}

        {/* Message Input Field */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink)' }}>
              SMS Message Text
            </label>
            <span style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'monospace' }}>
              {message.length} chars (~{Math.ceil(message.length / 160)} SMS)
            </span>
          </div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            style={{
              width: '100%',
              padding: '10px 12px',
              background: '#ffffff',
              border: '1px solid var(--line)',
              borderRadius: '8px',
              fontSize: '12px',
              lineHeight: 1.5,
              color: 'var(--ink)',
              fontFamily: 'inherit',
              resize: 'vertical',
            }}
            placeholder="Type SMS text..."
            required
          />
        </div>

        <div className="modal-actions">
          <button type="button" className="button secondary" onClick={onClose} disabled={isSending}>
            Cancel
          </button>
          <button
            type="submit"
            className="button primary"
            disabled={!cleanPhone || isSending || !message.trim()}
          >
            <Send size={14} />
            <span>{isSending ? 'Sending SMS...' : 'Send SMS Now'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
