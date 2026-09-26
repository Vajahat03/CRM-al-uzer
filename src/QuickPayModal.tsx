import React, { useState } from 'react';
import { CheckCircle2, DollarSign, X, Check, ArrowRight, Wallet } from 'lucide-react';
import { CustomerRecord, formatCurrency, getStatus } from './types';

interface QuickPayModalProps {
  customer: CustomerRecord | null;
  onClose: () => void;
  onSavePayment: (updatedData: Partial<CustomerRecord>, customerId: string) => Promise<void>;
}

export function QuickPayModal({
  customer,
  onClose,
  onSavePayment,
}: QuickPayModalProps) {
  if (!customer) return null;

  const totalAmount = Number(customer.total_amount) || 0;
  const alreadyPaid = Number(customer.paid) || 0;
  const remainingBalance = Math.max(totalAmount - alreadyPaid, 0);

  const [additionalAmount, setAdditionalAmount] = useState<string>(String(remainingBalance));
  const [paymentMode, setPaymentMode] = useState<string>(customer.payment_mode || 'Cash');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const additionalNum = Number(additionalAmount) || 0;
  const newTotalPaid = Math.min(alreadyPaid + additionalNum, totalAmount);
  const newBalance = Math.max(totalAmount - newTotalPaid, 0);
  const newPaymentStatus = getStatus(newTotalPaid, totalAmount);

  const handleSettleFull = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSavePayment(
        {
          paid: totalAmount,
          income: totalAmount - (Number(customer.expense) || 0),
          payment_status: 'PAID',
          payment_mode: paymentMode,
        },
        customer.id
      );
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCustomPay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || additionalNum <= 0) return;
    setIsSubmitting(true);
    try {
      await onSavePayment(
        {
          paid: newTotalPaid,
          income: newTotalPaid - (Number(customer.expense) || 0),
          payment_status: newPaymentStatus,
          payment_mode: paymentMode,
        },
        customer.id
      );
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      style={{
        zIndex: 99998,
        background: 'rgba(5, 10, 8, 0.82)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '440px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out',
        }}
      >
        <div
          style={{
            padding: '20px 24px 16px',
            background: 'linear-gradient(135deg, #064e3b 0%, #047857 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <Wallet size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800 }}>Collect Payment / Settle</h3>
              <span style={{ fontSize: '12px', color: '#a7f3d0' }}>{customer.customer_name}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              color: '#ffffff',
              borderRadius: '50%',
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: '20px 24px' }}>
          {/* Financial summary card */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '14px 16px',
              marginBottom: '18px',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px',
              textAlign: 'center',
            }}
          >
            <div>
              <span style={{ fontSize: '11px', color: '#64748b', display: 'block', fontWeight: 600 }}>Total Billed</span>
              <strong style={{ fontSize: '15px', color: '#0f172a' }}>{formatCurrency(totalAmount)}</strong>
            </div>
            <div>
              <span style={{ fontSize: '11px', color: '#64748b', display: 'block', fontWeight: 600 }}>Already Paid</span>
              <strong style={{ fontSize: '15px', color: '#059669' }}>{formatCurrency(alreadyPaid)}</strong>
            </div>
            <div>
              <span style={{ fontSize: '11px', color: '#64748b', display: 'block', fontWeight: 600 }}>Balance Due</span>
              <strong style={{ fontSize: '15px', color: remainingBalance > 0 ? '#ea580c' : '#059669' }}>
                {formatCurrency(remainingBalance)}
              </strong>
            </div>
          </div>

          {/* Quick 1-Click Settle Button */}
          {remainingBalance > 0 && (
            <button
              type="button"
              onClick={handleSettleFull}
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                marginBottom: '16px',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
              }}
            >
              <CheckCircle2 size={18} />
              <span>Mark Fully Paid (Receive {formatCurrency(remainingBalance)})</span>
            </button>
          )}

          {/* Custom Partial Payment Form */}
          <form onSubmit={handleCustomPay}>
            <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: '14px', marginBottom: '14px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '8px' }}>
                Or enter custom received amount:
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                    Receiving Amount (₹)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={remainingBalance || undefined}
                    value={additionalAmount}
                    onChange={(e) => setAdditionalAmount(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                      fontWeight: 700,
                      color: '#0f172a',
                    }}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                    Payment Mode
                  </label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      fontWeight: 600,
                    }}
                  >
                    <option value="Cash">💵 Cash</option>
                    <option value="Online">💳 Online / UPI</option>
                  </select>
                </div>
              </div>

              {additionalNum > 0 && (
                <div style={{ fontSize: '12px', color: '#475569', background: '#f1f5f9', padding: '8px 12px', borderRadius: '8px', marginBottom: '12px' }}>
                  Updated Total Paid: <strong>{formatCurrency(newTotalPaid)}</strong> | Remaining Due: <strong>{formatCurrency(newBalance)}</strong>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '8px 16px',
                  background: '#f1f5f9',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  color: '#475569',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || additionalNum <= 0}
                style={{
                  padding: '8px 18px',
                  background: '#1e293b',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>Save Payment</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
