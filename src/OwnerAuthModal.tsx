import { useState, useEffect, useCallback } from 'react';
import { KeyRound, X, Lock } from 'lucide-react';
import { verifyOwnerPin } from './securityService';

interface OwnerAuthModalProps {
  isOpen: boolean;
  actionTitle?: string;
  actionDescription?: string;
  onClose: () => void;
  onVerified: () => void;
}

export function OwnerAuthModal({
  isOpen,
  actionTitle = 'Owner Authorization Required',
  actionDescription = 'Enter Owner PIN to edit or delete records',
  onClose,
  onVerified,
}: OwnerAuthModalProps) {
  const [pin, setPin] = useState('');
  const [isError, setIsError] = useState(false);

  const verifyPin = useCallback((currentPin: string) => {
    if (verifyOwnerPin(currentPin)) {
      setPin('');
      onVerified();
    } else {
      setIsError(true);
      setTimeout(() => {
        setPin('');
        setIsError(false);
      }, 600);
    }
  }, [onVerified]);

  const handleDigit = (digit: string) => {
    if (pin.length >= 6) return;
    const nextPin = pin + digit;
    setPin(nextPin);
    if (nextPin.length === 6) {
      verifyPin(nextPin);
    }
  };

  const handleBackspace = () => {
    if (pin.length === 0) return;
    setPin(pin.slice(0, -1));
  };

  const handleClear = () => {
    setPin('');
  };

  useEffect(() => {
    if (!isOpen) {
      setPin('');
      setIsError(false);
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter' && pin.length > 0) {
        verifyPin(pin);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, pin, verifyPin, onClose]);

  if (!isOpen) return null;

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
          maxWidth: '380px',
          textAlign: 'center',
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
            margin: '0 auto 14px',
          }}
        >
          <Lock size={24} />
        </div>

        <h3 style={{ color: '#ffffff', fontSize: '18px', fontWeight: 800, margin: '0 0 6px' }}>
          {actionTitle}
        </h3>
        <p style={{ color: '#94a3b8', fontSize: '12.5px', margin: '0 0 18px', lineHeight: 1.4 }}>
          {actionDescription}
        </p>

        {/* PIN Indicators */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px' }}>
          {[0, 1, 2, 3, 4, 5].map((idx) => {
            const isFilled = pin.length > idx;
            return (
              <div
                key={idx}
                style={{
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  border: `2px solid ${isError ? '#ef4444' : isFilled ? '#f59e0b' : 'rgba(234, 179, 8, 0.3)'}`,
                  background: isError ? '#ef4444' : isFilled ? '#f59e0b' : 'transparent',
                  boxShadow: isFilled ? '0 0 10px #f59e0b' : 'none',
                  transition: 'all 0.15s ease',
                  transform: isFilled ? 'scale(1.2)' : 'scale(1)',
                }}
              />
            );
          })}
        </div>

        {/* Numeric Keypad */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '10px',
            maxWidth: '280px',
            margin: '0 auto',
          }}
        >
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              style={{
                height: '46px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '12px',
                color: '#ffffff',
                fontSize: '18px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.1s ease',
              }}
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            style={{
              height: '46px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: '12px',
              color: '#f87171',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            CLEAR
          </button>
          <button
            type="button"
            onClick={() => handleDigit('0')}
            style={{
              height: '46px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '12px',
              color: '#ffffff',
              fontSize: '18px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            0
          </button>
          <button
            type="button"
            onClick={() => verifyPin(pin)}
            style={{
              height: '46px',
              background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
              border: 'none',
              borderRadius: '12px',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            title="Authorize"
          >
            <KeyRound size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
