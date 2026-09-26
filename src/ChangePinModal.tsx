import { useState } from 'react';
import { KeyRound, Check, X, ShieldCheck, AlertCircle } from 'lucide-react';
import { getOwnerPin, setOwnerPin, verifyOwnerPin } from './securityService';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export function ChangePinModal({ isOpen, onClose, onSuccess }: Props) {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!verifyOwnerPin(currentPin)) {
      setErrorMsg('Current PIN is incorrect.');
      return;
    }

    if (!/^\d{6}$/.test(newPin)) {
      setErrorMsg('New PIN must be exactly 6 numeric digits.');
      return;
    }

    if (newPin !== confirmPin) {
      setErrorMsg('New PIN and Confirm PIN do not match.');
      return;
    }

    const saved = setOwnerPin(newPin);
    if (saved) {
      setSuccessMsg('Security PIN updated successfully!');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } else {
      setErrorMsg('Failed to save new PIN. Please try again.');
    }
  };

  return (
    <div
      className="modal-backdrop"
      style={{
        zIndex: 99999,
        background: 'rgba(5, 10, 8, 0.85)',
        backdropFilter: 'blur(10px)',
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
          background: 'linear-gradient(145deg, #121e18 0%, #0d1511 100%)',
          border: '1px solid rgba(234, 179, 8, 0.35)',
          borderRadius: '20px',
          padding: '28px 24px',
          width: '100%',
          maxWidth: '400px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
          position: 'relative',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'rgba(255,255,255,0.08)',
            border: 'none',
            color: '#94a3b8',
            borderRadius: '50%',
            width: '30px',
            height: '30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
          title="Cancel"
        >
          <X size={16} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '18px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: 'rgba(234, 179, 8, 0.15)',
              border: '1px solid rgba(234, 179, 8, 0.4)',
              color: '#facc15',
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto 12px',
            }}
          >
            <KeyRound size={24} />
          </div>
          <h3 style={{ color: '#ffffff', fontSize: '18px', fontWeight: 800, margin: '0 0 6px' }}>
            Change Owner Security PIN
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '12.5px', margin: 0 }}>
            Set a new 6-digit passcode for owner vault access & authorization.
          </p>
        </div>

        {errorMsg && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid #ef4444',
              color: '#fca5a5',
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '14px',
            }}
          >
            <AlertCircle size={15} /> {errorMsg}
          </div>
        )}

        {successMsg && (
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid #10b981',
              color: '#6ee7b7',
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '14px',
            }}
          >
            <ShieldCheck size={15} /> {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#cbd5e1', display: 'block', marginBottom: '4px' }}>
              Current 6-Digit PIN
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={currentPin}
              onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter current PIN"
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.07)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                fontSize: '14px',
                letterSpacing: '2px',
              }}
              required
              autoFocus
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#cbd5e1', display: 'block', marginBottom: '4px' }}>
              New 6-Digit PIN
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter new 6-digit PIN"
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.07)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                fontSize: '14px',
                letterSpacing: '2px',
              }}
              required
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#cbd5e1', display: 'block', marginBottom: '4px' }}>
              Confirm New 6-Digit PIN
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Re-enter new PIN"
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.07)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                fontSize: '14px',
                letterSpacing: '2px',
              }}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#cbd5e1',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                flex: 2,
                padding: '10px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #d97706 0%, #ea580c 100%)',
                border: 'none',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: '0 4px 14px rgba(234, 88, 12, 0.4)',
              }}
            >
              <Check size={16} /> Save Security PIN
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
