import React, { useState, useEffect, useCallback, ReactNode } from 'react';
import { Lock, Unlock, ShieldAlert, Sparkles, KeyRound, RotateCcw, ShieldCheck, CheckCircle2 } from 'lucide-react';
import './SecureVaultLock.css';

const VAULT_PASSCODE = '163692';

interface SecureVaultLockProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  isUnlocked: boolean;
  onUnlock: () => void;
  onLock: () => void;
}

// Crisp Web Audio Synthesizer for high-tech vault SFX
function playSound(type: 'type' | 'error' | 'unlock') {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (type === 'type') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800 + Math.random() * 200, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } else if (type === 'error') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(90, ctx.currentTime + 0.28);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.28);
    } else if (type === 'unlock') {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 triumphant chime
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.09);
        gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.09);
        gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + idx * 0.09 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.09 + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.09);
        osc.stop(ctx.currentTime + idx * 0.09 + 0.55);
      });
    }
  } catch {
    // ignore audio block
  }
}

interface Particle {
  id: number;
  icon: string;
  tx: string;
  ty: string;
  scale: string;
  rot: string;
  color: string;
}

export function SecureVaultLock({
  children,
  title = 'Confidential Income & Financial Reports',
  subtitle = 'Enter 6-digit security code to decrypt and view sensitive records',
  isUnlocked,
  onUnlock,
  onLock,
}: SecureVaultLockProps) {
  const [pin, setPin] = useState('');
  const [isError, setIsError] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [showShockwave, setShowShockwave] = useState(false);

  // Trigger grand burst animation
  const triggerBurstSequence = useCallback(() => {
    setIsUnlocking(true);
    setShowShockwave(true);
    playSound('unlock');

    const icons = ['₹', '💰', '📊', '📈', '✨', '💎', '⚡', '💵', '🪙', '🔓'];
    const colors = ['#fbbf24', '#34d399', '#60a5fa', '#f43f5e', '#a78bfa', '#fde047'];
    const newParticles: Particle[] = [];

    for (let i = 0; i < 32; i++) {
      const angle = (i / 32) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
      const distance = 140 + Math.random() * 260;
      newParticles.push({
        id: i,
        icon: icons[Math.floor(Math.random() * icons.length)],
        tx: `${Math.cos(angle) * distance}px`,
        ty: `${Math.sin(angle) * distance}px`,
        scale: `${0.9 + Math.random() * 1.1}`,
        rot: `${(Math.random() - 0.5) * 720}deg`,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    setParticles(newParticles);

    // After animation finishes, mark unlocked
    setTimeout(() => {
      setIsUnlocking(false);
      setShowShockwave(false);
      setParticles([]);
      onUnlock();
    }, 1000);
  }, [onUnlock]);

  const verifyPin = useCallback((currentPin: string) => {
    if (currentPin === VAULT_PASSCODE) {
      triggerBurstSequence();
    } else {
      setIsError(true);
      playSound('error');
      setTimeout(() => {
        setPin('');
        setIsError(false);
      }, 700);
    }
  }, [triggerBurstSequence]);

  const handleDigit = (digit: string) => {
    if (pin.length >= 6 || isUnlocking) return;
    playSound('type');
    const nextPin = pin + digit;
    setPin(nextPin);
    if (nextPin.length === 6) {
      verifyPin(nextPin);
    }
  };

  const handleBackspace = () => {
    if (pin.length === 0 || isUnlocking) return;
    playSound('type');
    setPin(pin.slice(0, -1));
  };

  const handleClear = () => {
    if (isUnlocking) return;
    playSound('type');
    setPin('');
  };

  // Keyboard support for immediate typing
  useEffect(() => {
    if (isUnlocked) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape' || e.key === 'Delete') {
        handleClear();
      } else if (e.key === 'Enter') {
        if (pin.length > 0) verifyPin(pin);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isUnlocked, pin, verifyPin]);

  if (isUnlocked) {
    return (
      <div className="data-burst-in" style={{ position: 'relative' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            padding: '10px 16px',
            background: 'linear-gradient(135deg, rgba(6, 78, 59, 0.45) 0%, rgba(15, 23, 42, 0.6) 100%)',
            border: '1px solid rgba(52, 211, 153, 0.3)',
            borderRadius: '14px',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 10px #10b981',
                display: 'inline-block',
              }}
            />
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#34d399', letterSpacing: '0.6px' }}>
              VAULT UNLOCKED • CONFIDENTIAL MODE ACTIVE
            </span>
          </div>
          <button
            className="vault-lock-badge"
            onClick={onLock}
            title="Lock this page immediately"
          >
            <Lock size={13} />
            <span>Lock Vault</span>
          </button>
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className="secure-vault-container">
      {/* Holographic background rings */}
      <div className="vault-hologram-rings">
        <div className="vault-ring-outer" />
        <div className="vault-ring-inner" />
      </div>

      {/* Burst Shockwave & Flying Particles */}
      {showShockwave && <div className="burst-shockwave" />}

      {particles.length > 0 && (
        <div className="burst-particle-layer">
          {particles.map((p) => (
            <div
              key={p.id}
              className="burst-particle"
              style={
                {
                  '--tx': p.tx,
                  '--ty': p.ty,
                  '--scale': p.scale,
                  '--rot': p.rot,
                  color: p.color,
                  filter: `drop-shadow(0 0 8px ${p.color})`,
                } as React.CSSProperties
              }
            >
              {p.icon}
            </div>
          ))}
        </div>
      )}

      {/* Main Glassmorphic Security Card */}
      <div className={`secure-vault-card ${isError ? 'shake' : ''} ${isUnlocking ? 'unlocking' : ''}`}>
        {/* 3D Realistic Padlock */}
        <div className="padlock-3d-wrapper">
          <svg viewBox="0 0 120 120" width="130" height="130" style={{ filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.5))' }}>
            <defs>
              <linearGradient id="goldMetallic" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="35%" stopColor="#f59e0b" />
                <stop offset="70%" stopColor="#d97706" />
                <stop offset="100%" stopColor="#78350f" />
              </linearGradient>
              <linearGradient id="shackleChrome" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="40%" stopColor="#cbd5e1" />
                <stop offset="70%" stopColor="#64748b" />
                <stop offset="100%" stopColor="#334155" />
              </linearGradient>
              <radialGradient id="keyholeLaser" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="60%" stopColor="#059669" />
                <stop offset="100%" stopColor="#022c22" />
              </radialGradient>
              <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Padlock Shackle (Steel Arch) */}
            <g className={`padlock-svg-shackle ${isUnlocking ? 'open' : ''}`}>
              <path
                d="M 38 60 L 38 34 C 38 20 82 20 82 34 L 82 60"
                fill="none"
                stroke="url(#shackleChrome)"
                strokeWidth="11"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M 40 60 L 40 35 C 40 23 80 23 80 35 L 80 60"
                fill="none"
                stroke="#ffffff"
                strokeWidth="2.5"
                strokeLinecap="round"
                opacity="0.85"
              />
            </g>

            {/* Padlock Body (3D Gold Ingot Look) */}
            <rect
              x="22"
              y="52"
              width="76"
              height="58"
              rx="16"
              fill="url(#goldMetallic)"
              stroke="#fef08a"
              strokeWidth="1.5"
              filter="url(#goldGlow)"
            />
            {/* Inner bevel */}
            <rect
              x="26"
              y="56"
              width="68"
              height="50"
              rx="12"
              fill="none"
              stroke="rgba(255,255,255,0.4)"
              strokeWidth="1"
            />

            {/* Glowing Laser Keyhole */}
            <circle cx="60" cy="74" r="7" fill="url(#keyholeLaser)" />
            <polygon points="56,76 64,76 62,90 58,90" fill="url(#keyholeLaser)" />
            <circle cx="60" cy="74" r="3" fill="#ffffff" opacity="0.9" />
          </svg>
        </div>

        {/* Header Badges & Title */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(234, 179, 8, 0.15)', border: '1px solid rgba(234, 179, 8, 0.4)', padding: '4px 12px', borderRadius: '20px', marginBottom: '12px' }}>
          <ShieldAlert size={14} style={{ color: '#fde047' }} />
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#fef08a', letterSpacing: '1px' }}>
            {isUnlocking ? 'ACCESS GRANTED • DECRYPTING' : 'SECURE RESTRICTED AREA'}
          </span>
        </div>

        <h2 style={{ fontSize: '21px', fontWeight: 800, color: '#ffffff', margin: '0 0 6px', letterSpacing: '-0.4px' }}>
          {title}
        </h2>
        <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 16px', lineHeight: 1.4 }}>
          {subtitle}
        </p>

        {/* 6-Digit PIN Capsules Indicator */}
        <div className="pin-capsules">
          {[0, 1, 2, 3, 4, 5].map((index) => {
            const isFilled = pin.length > index;
            return (
              <div
                key={index}
                className={`pin-capsule ${isFilled ? 'filled' : ''} ${isError ? 'error' : ''}`}
              />
            );
          })}
        </div>

        {/* Numeric Security Keypad */}
        <div className="vault-keypad">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              className="vault-key-btn"
              onClick={() => handleDigit(digit)}
              disabled={isUnlocking}
              type="button"
            >
              {digit}
            </button>
          ))}
          <button
            className="vault-key-btn action clear"
            onClick={handleClear}
            disabled={isUnlocking}
            type="button"
            title="Clear code"
          >
            CLEAR
          </button>
          <button
            className="vault-key-btn"
            onClick={() => handleDigit('0')}
            disabled={isUnlocking}
            type="button"
          >
            0
          </button>
          <button
            className="vault-key-btn action submit"
            onClick={() => verifyPin(pin)}
            disabled={isUnlocking || pin.length === 0}
            type="button"
            title="Submit passcode"
          >
            <KeyRound size={18} />
          </button>
        </div>

        {/* Quick hint & keyboard support note */}
        <div style={{ marginTop: '20px', fontSize: '11px', color: '#64748b' }}>
          <span>⌨ Keyboard typing supported (Press 0-9 digits directly)</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Modal Wrapper to protect PDF report generation with the same passcode
 */
export function SecureReportGateModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(10px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div style={{ position: 'relative', width: '100%', maxWidth: '500px' }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '-44px',
            right: '0',
            background: 'rgba(255,255,255,0.15)',
            color: '#ffffff',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 100,
          }}
          title="Close"
        >
          ✕
        </button>
        <SecureVaultLock
          title="Protected Monthly PDF Report"
          subtitle="Enter passcode to generate and download business financial reports"
          isUnlocked={false}
          onUnlock={() => {
            onSuccess();
          }}
          onLock={onClose}
        >
          <div />
        </SecureVaultLock>
      </div>
    </div>
  );
}
