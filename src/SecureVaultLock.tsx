import React, { useState, useEffect, useCallback, ReactNode } from 'react';
import { Lock, Flame, KeyRound } from 'lucide-react';
import './SecureVaultLock.css';
import { verifyOwnerPin } from './securityService';

interface SecureVaultLockProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  isUnlocked: boolean;
  onUnlock: () => void;
  onLock: () => void;
}

// Cinematic Web Audio Synthesizer for Volcanic Eruption & Mechanical Lock
function playSound(type: 'type' | 'error' | 'keyTurn' | 'eruption') {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (type === 'type') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(850 + Math.random() * 150, ctx.currentTime);
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
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(90, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.14, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } else if (type === 'keyTurn') {
      // Heavy metallic ratchet and mechanical turn
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(280, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(560, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } else if (type === 'eruption') {
      // Subterranean Volcanic Rumble
      const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 1.5, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < noiseBuffer.length; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(100, ctx.currentTime);
      filter.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.5);
      filter.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 1.4);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.18, ctx.currentTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.4);

      whiteNoise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      whiteNoise.start();
      whiteNoise.stop(ctx.currentTime + 1.4);

      // Crystalline Eruption Fanfare Chime
      const notes = [440, 554.37, 659.25, 880, 1108.73, 1318.51];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + 0.2 + idx * 0.08);
        gain.gain.setValueAtTime(0, ctx.currentTime + 0.2 + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.22 + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2 + idx * 0.08 + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + 0.2 + idx * 0.08);
        osc.stop(ctx.currentTime + 0.2 + idx * 0.08 + 0.65);
      });
    }
  } catch {
    // ignore audio blocks
  }
}

interface VolcanoParticle {
  id: number;
  icon: string;
  tx: string;
  ty: string;
  scale: string;
  rot: string;
  color: string;
}

interface EruptingDataCard {
  id: number;
  label: string;
  sub: string;
  amount: string;
  tag: string;
  tagColor: string;
  tx: string;
  ty: string;
  rot: string;
}

export function SecureVaultLock({
  children,
  title = 'Confidential Income & Financial Reports',
  subtitle = 'Enter 6-digit security code to trigger keyhole unlock and decrypt data',
  isUnlocked,
  onUnlock,
  onLock,
}: SecureVaultLockProps) {
  const [pin, setPin] = useState('');
  const [isError, setIsError] = useState(false);
  const [isErupting, setIsErupting] = useState(false);
  const [particles, setParticles] = useState<VolcanoParticle[]>([]);
  const [dataCards, setDataCards] = useState<EruptingDataCard[]>([]);
  const [showMagmaRing, setShowMagmaRing] = useState(false);
  const [showGeyserBeam, setShowGeyserBeam] = useState(false);
  const [showKeyAnimation, setShowKeyAnimation] = useState(false);

  // Trigger grand volcanic eruption sequence from keyhole
  const triggerVolcanicEruption = useCallback(() => {
    setIsErupting(true);
    setShowKeyAnimation(true);
    playSound('keyTurn');

    // Stage 1: Key turns, Geyser erupts from keyhole
    setTimeout(() => {
      setShowGeyserBeam(true);
      setShowMagmaRing(true);
      playSound('eruption');

      const icons = [
        '🌋', '🔥', '💥', '✨', '⚡', '₹', '💰', '💵', '🪙', '📈', '📊', '💎', '🧾', '👑'
      ];
      const colors = ['#ff4500', '#ff8c00', '#ffd700', '#ff3b30', '#34d399', '#fef08a', '#ffffff'];
      const newParticles: VolcanoParticle[] = [];

      // Generate 55 high-velocity volcanic particles spraying upward in a geyser cone from the keyhole
      for (let i = 0; i < 55; i++) {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.6;
        const velocity = 200 + Math.random() * 380;
        newParticles.push({
          id: i,
          icon: icons[Math.floor(Math.random() * icons.length)],
          tx: `${Math.cos(angle) * velocity}px`,
          ty: `${Math.sin(angle) * velocity}px`,
          scale: `${0.8 + Math.random() * 1.4}`,
          rot: `${(Math.random() - 0.5) * 1080}deg`,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }

      // Live simulated Customer Cards & Reports bursting out in 3D perspective from keyhole
      const sampleBurstCards = [
        { label: '👤 AYASHA MAZHAR', sub: 'PAN CARD 400', amount: '₹400', tag: 'PAID', tagColor: '#10b981' },
        { label: '👤 NASIR RASHID', sub: 'DRIVING LICENSE', amount: '₹5,500', tag: 'PARTIAL', tagColor: '#f59e0b' },
        { label: '📊 MONTHLY REVENUE', sub: 'Gross Profit', amount: '₹28,450', tag: '+24%', tagColor: '#3b82f6' },
        { label: '🧾 THERMAL BILL', sub: 'Al Uzer Receipt', amount: '₹1,200', tag: 'DELIVERED', tagColor: '#10b981' },
        { label: '👤 SAHAIL HAKIM', sub: 'PAN CARD 500', amount: '₹450', tag: 'PAID', tagColor: '#10b981' },
        { label: '📈 PROFIT MARGIN', sub: 'Total Income', amount: '₹18,900', tag: 'STABLE', tagColor: '#8b5cf6' },
      ];

      const newBurstCards: EruptingDataCard[] = sampleBurstCards.map((card, idx) => {
        const angle = -Math.PI / 2 + ((idx - (sampleBurstCards.length - 1) / 2) * 0.45);
        const dist = 180 + Math.random() * 140;
        return {
          id: idx,
          label: card.label,
          sub: card.sub,
          amount: card.amount,
          tag: card.tag,
          tagColor: card.tagColor,
          tx: `${Math.cos(angle) * dist}px`,
          ty: `${Math.sin(angle) * dist}px`,
          rot: `${(Math.random() - 0.5) * 35}deg`,
        };
      });

      setParticles(newParticles);
      setDataCards(newBurstCards);
    }, 450);

    // Stage 2: Data bursts outwards from keyhole and takes over the page
    setTimeout(() => {
      setIsErupting(false);
      setShowGeyserBeam(false);
      setShowMagmaRing(false);
      setShowKeyAnimation(false);
      setParticles([]);
      setDataCards([]);
      onUnlock();
    }, 1450);
  }, [onUnlock]);

  const verifyPin = useCallback((currentPin: string) => {
    if (verifyOwnerPin(currentPin)) {
      triggerVolcanicEruption();
    } else {
      setIsError(true);
      playSound('error');
      setTimeout(() => {
        setPin('');
        setIsError(false);
      }, 700);
    }
  }, [triggerVolcanicEruption]);

  const handleDigit = (digit: string) => {
    if (pin.length >= 6 || isErupting) return;
    playSound('type');
    const nextPin = pin + digit;
    setPin(nextPin);
    if (nextPin.length === 6) {
      verifyPin(nextPin);
    }
  };

  const handleBackspace = () => {
    if (pin.length === 0 || isErupting) return;
    playSound('type');
    setPin(pin.slice(0, -1));
  };

  const handleClear = () => {
    if (isErupting) return;
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
      <div className="data-volcanic-eruption">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            padding: '10px 16px',
            background: 'linear-gradient(135deg, rgba(234, 88, 12, 0.25) 0%, rgba(15, 23, 42, 0.7) 100%)',
            border: '1px solid rgba(251, 146, 60, 0.4)',
            borderRadius: '14px',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 4px 20px rgba(234, 88, 12, 0.15)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#f97316',
                boxShadow: '0 0 12px #f97316',
                display: 'inline-block',
              }}
            />
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#fed7aa', letterSpacing: '0.6px' }}>
              🌋 FINANCIAL VAULT UNLOCKED • LIVE ERUPTION ACTIVE
            </span>
          </div>
          <button
            className="vault-lock-badge"
            onClick={onLock}
            title="Lock this vault immediately"
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
      {/* Volcanic Magma Rings */}
      {showMagmaRing && <div className="volcano-magma-ring" />}

      {/* Main Glassmorphic Security Card */}
      <div className={`secure-vault-card ${isError ? 'shake' : ''} ${isErupting ? 'erupting' : ''}`}>
        {/* 3D Realistic Padlock & Keyhole */}
        <div className="padlock-3d-wrapper">
          {/* Volcanic Geyser Beam Shooting Upwards from Keyhole */}
          {showGeyserBeam && <div className="volcano-geyser-beam" />}

          {/* Volcanic Particles Erupting Outward from Keyhole */}
          {particles.length > 0 && (
            <div className="volcano-particle-layer">
              {particles.map((p) => (
                <div
                  key={p.id}
                  className="volcano-particle"
                  style={
                    {
                      '--tx': p.tx,
                      '--ty': p.ty,
                      '--scale': p.scale,
                      '--rot': p.rot,
                      color: p.color,
                      filter: `drop-shadow(0 0 10px ${p.color}) drop-shadow(0 0 20px #ff4500)`,
                    } as React.CSSProperties
                  }
                >
                  {p.icon}
                </div>
              ))}
            </div>
          )}

          {/* Holographic Customer Records & Charts Erupting out from Keyhole */}
          {dataCards.length > 0 && (
            <div className="volcano-particle-layer">
              {dataCards.map((card) => (
                <div
                  key={card.id}
                  className="holographic-data-card"
                  style={
                    {
                      '--tx': card.tx,
                      '--ty': card.ty,
                      '--rot': card.rot,
                    } as React.CSSProperties
                  }
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <span>{card.label}</span>
                    <span
                      style={{
                        fontSize: '9px',
                        padding: '1px 5px',
                        borderRadius: '4px',
                        background: card.tagColor,
                        color: '#ffffff',
                      }}
                    >
                      {card.tag}
                    </span>
                  </div>
                  <div style={{ fontSize: '9.5px', color: '#94a3b8', marginTop: '2px' }}>
                    {card.sub} • <strong style={{ color: '#facc15' }}>{card.amount}</strong>
                  </div>
                </div>
              ))}
            </div>
          )}

          <svg viewBox="0 0 120 120" width="130" height="130" style={{ filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.6))' }}>
            <defs>
              <linearGradient id="goldMetallic" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="30%" stopColor="#f59e0b" />
                <stop offset="70%" stopColor="#ea580c" />
                <stop offset="100%" stopColor="#7c2d12" />
              </linearGradient>
              <linearGradient id="shackleChrome" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="40%" stopColor="#cbd5e1" />
                <stop offset="70%" stopColor="#64748b" />
                <stop offset="100%" stopColor="#334155" />
              </linearGradient>
              <radialGradient id="magmaCore" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="35%" stopColor="#ffd700" />
                <stop offset="70%" stopColor="#ff4500" />
                <stop offset="100%" stopColor="#8b0000" />
              </radialGradient>
              <filter id="volcanoGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Padlock Shackle (Steel Arch) */}
            <g className={`padlock-svg-shackle ${isErupting ? 'open' : ''}`}>
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
              filter="url(#volcanoGlow)"
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

            {/* Glowing Volcanic Keyhole */}
            <circle
              className={`keyhole-core ${isErupting ? 'erupting' : ''}`}
              cx="60"
              cy="74"
              r="7"
              fill="url(#magmaCore)"
            />
            <polygon
              points="56,76 64,76 62,90 58,90"
              fill="url(#magmaCore)"
            />

            {/* Animated Golden Key inserting and turning */}
            {showKeyAnimation && (
              <g className="virtual-key">
                <circle cx="60" cy="56" r="8" fill="none" stroke="#ffd700" strokeWidth="3" filter="drop-shadow(0 0 6px #ff8c00)" />
                <line x1="60" y1="64" x2="60" y2="78" stroke="#ffd700" strokeWidth="4" strokeLinecap="round" />
                <line x1="60" y1="74" x2="65" y2="74" stroke="#ffd700" strokeWidth="3" strokeLinecap="round" />
                <line x1="60" y1="78" x2="66" y2="78" stroke="#ffd700" strokeWidth="3" strokeLinecap="round" />
              </g>
            )}
          </svg>
        </div>

        {/* Header Badges & Title */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(234, 88, 12, 0.2)', border: '1px solid rgba(251, 146, 60, 0.5)', padding: '4px 14px', borderRadius: '20px', marginBottom: '12px' }}>
          <Flame size={14} style={{ color: '#fb923c' }} />
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#fdba74', letterSpacing: '1px' }}>
            {isErupting ? '🌋 VOLCANIC DATA ERUPTION IN PROGRESS' : 'RESTRICTED FINANCIAL VAULT'}
          </span>
        </div>

        <h2 style={{ fontSize: '21px', fontWeight: 800, color: '#ffffff', margin: '0 0 6px', letterSpacing: '-0.4px' }}>
          {title}
        </h2>
        <p style={{ fontSize: '13px', color: '#cbd5e1', margin: '0 0 16px', lineHeight: 1.4 }}>
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
              disabled={isErupting}
              type="button"
            >
              {digit}
            </button>
          ))}
          <button
            className="vault-key-btn action clear"
            onClick={handleClear}
            disabled={isErupting}
            type="button"
            title="Clear code"
          >
            CLEAR
          </button>
          <button
            className="vault-key-btn"
            onClick={() => handleDigit('0')}
            disabled={isErupting}
            type="button"
          >
            0
          </button>
          <button
            className="vault-key-btn action submit"
            onClick={() => verifyPin(pin)}
            disabled={isErupting || pin.length === 0}
            type="button"
            title="Unlock Vault"
          >
            <KeyRound size={18} />
          </button>
        </div>

        {/* Quick hint & keyboard support note */}
        <div style={{ marginTop: '20px', fontSize: '11px', color: '#94a3b8' }}>
          <span>⌨ Press 0-9 on your keyboard for rapid unlock</span>
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
        backgroundColor: 'rgba(0, 0, 0, 0.88)',
        backdropFilter: 'blur(12px)',
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
          subtitle="Enter passcode to erupt and download business financial reports"
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
