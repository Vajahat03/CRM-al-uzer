import { useState, useEffect, useRef } from 'react';
import { KeyRound, Check, X, ShieldCheck, AlertCircle, BellRing, Volume2, VolumeX } from 'lucide-react';
import { getOwnerPin, setOwnerPin, verifyOwnerPin } from './securityService';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

// High-Volume 5-Second Pulsing Security Alert Siren Synthesizer
function start5SecondAlertSiren(): () => void {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return () => {};
    const ctx = new AudioContext();

    // Master High-Gain Node (Maximal volume alert)
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(1.0, ctx.currentTime);
    masterGain.connect(ctx.destination);

    let isStopped = false;
    const oscillators: OscillatorNode[] = [];

    // Pulse 5 distinct high-pitch alarm bursts over 5 seconds (1 burst per second)
    for (let i = 0; i < 5; i++) {
      const startTime = ctx.currentTime + i * 1.0;
      
      // Dual-tone piercing alarm: 1100Hz primary + 1450Hz overtone
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const pulseGain = ctx.createGain();

      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(1100, startTime);
      osc1.frequency.linearRampToValueAtTime(880, startTime + 0.4);

      osc2.type = 'square';
      osc2.frequency.setValueAtTime(1450, startTime);
      osc2.frequency.linearRampToValueAtTime(1150, startTime + 0.4);

      pulseGain.gain.setValueAtTime(0, startTime);
      pulseGain.gain.linearRampToValueAtTime(0.7, startTime + 0.05);
      pulseGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.55);

      osc1.connect(pulseGain);
      osc2.connect(pulseGain);
      pulseGain.connect(masterGain);

      osc1.start(startTime);
      osc1.stop(startTime + 0.6);
      osc2.start(startTime);
      osc2.stop(startTime + 0.6);

      oscillators.push(osc1, osc2);
    }

    return () => {
      if (!isStopped) {
        isStopped = true;
        try {
          masterGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
          setTimeout(() => ctx.close(), 150);
        } catch {
          // ignore
        }
      }
    };
  } catch {
    return () => {};
  }
}

export function ChangePinModal({ isOpen, onClose, onSuccess }: Props) {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [alarmSecondsLeft, setAlarmSecondsLeft] = useState(5);
  const [isAlarmActive, setIsAlarmActive] = useState(true);
  const stopAlarmRef = useRef<(() => void) | null>(null);

  // Trigger loud 5-second owner alert siren whenever modal opens
  useEffect(() => {
    if (!isOpen) return;

    setIsAlarmActive(true);
    setAlarmSecondsLeft(5);
    stopAlarmRef.current = start5SecondAlertSiren();

    const interval = setInterval(() => {
      setAlarmSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsAlarmActive(false);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      if (stopAlarmRef.current) {
        stopAlarmRef.current();
        stopAlarmRef.current = null;
      }
    };
  }, [isOpen]);

  const handleMuteAlarm = () => {
    if (stopAlarmRef.current) {
      stopAlarmRef.current();
      stopAlarmRef.current = null;
    }
    setIsAlarmActive(false);
    setAlarmSecondsLeft(0);
  };

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
        background: 'rgba(5, 10, 8, 0.88)',
        backdropFilter: 'blur(12px)',
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
          background: 'linear-gradient(155deg, #13241b 0%, #0a140f 100%)',
          border: '1px solid rgba(0, 255, 136, 0.35)',
          borderRadius: '24px',
          padding: '28px 24px',
          width: '100%',
          maxWidth: '420px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.7), 0 0 30px rgba(0, 255, 136, 0.15)',
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
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
          title="Cancel"
        >
          <X size={16} />
        </button>

        {/* 5-Second Loud Alert Siren Notification Banner */}
        {isAlarmActive && (
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(185, 28, 28, 0.35) 100%)',
              border: '1px solid #ef4444',
              borderRadius: '12px',
              padding: '10px 14px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              animation: 'pulseAlert 0.8s infinite alternate',
              boxShadow: '0 0 20px rgba(239, 68, 68, 0.3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BellRing size={18} style={{ color: '#fca5a5', animation: 'spin 1s ease-in-out infinite' }} />
              <div>
                <strong style={{ color: '#ffffff', fontSize: '12px', display: 'block' }}>
                  🚨 5-SEC SECURITY ALARM ACTIVE
                </strong>
                <span style={{ color: '#fecaca', fontSize: '11px' }}>
                  Audible owner alert sounding ({alarmSecondsLeft}s left)
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleMuteAlarm}
              style={{
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer',
              }}
              title="Silence alert tone"
            >
              <VolumeX size={13} /> Mute
            </button>
          </div>
        )}

        <div style={{ textAlign: 'center', marginBottom: '18px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: 'rgba(0, 255, 136, 0.15)',
              border: '1px solid rgba(0, 255, 136, 0.4)',
              color: '#00ff88',
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto 12px',
              boxShadow: '0 0 16px rgba(0, 255, 136, 0.25)',
            }}
          >
            <KeyRound size={24} />
          </div>
          <h3 style={{ color: '#ffffff', fontSize: '19px', fontWeight: 800, margin: '0 0 6px' }}>
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

        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
          autoComplete="off"
          data-lpignore="true"
          data-form-type="other"
        >
          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#cbd5e1', display: 'block', marginBottom: '4px' }}>
              Current 6-Digit PIN
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={currentPin}
              onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter current PIN"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.07)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                fontSize: '15px',
                letterSpacing: '3px',
                boxSizing: 'border-box',
                WebkitTextSecurity: 'disc',
              }}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              data-lpignore="true"
              data-form-type="other"
              name="current_security_pin_field"
              required
              autoFocus
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#cbd5e1', display: 'block', marginBottom: '4px' }}>
              New 6-Digit PIN
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6 new numbers"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.07)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                fontSize: '15px',
                letterSpacing: '3px',
                boxSizing: 'border-box',
                WebkitTextSecurity: 'disc',
              }}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              data-lpignore="true"
              data-form-type="other"
              name="new_security_pin_field"
              required
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#cbd5e1', display: 'block', marginBottom: '4px' }}>
              Confirm New 6-Digit PIN
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Re-enter new PIN"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.07)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                fontSize: '15px',
                letterSpacing: '3px',
                boxSizing: 'border-box',
                WebkitTextSecurity: 'disc',
              }}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              data-lpignore="true"
              data-form-type="other"
              name="confirm_security_pin_field"
              required
            />
          </div>

          <button
            type="submit"
            style={{
              marginTop: '6px',
              padding: '12px 16px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: '1px solid rgba(52, 211, 153, 0.5)',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 15px rgba(16, 185, 129, 0.35)',
            }}
          >
            <Check size={16} /> Save Security PIN
          </button>
        </form>
      </div>
    </div>
  );
}
