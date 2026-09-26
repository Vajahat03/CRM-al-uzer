import React, { useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { Lock, ShieldCheck, KeyRound, CheckCircle2, Sparkles, X } from 'lucide-react';
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

// Crystalline Web Audio Synthesizer for Neon Mechanical Lock & Magical World Eruption
function playSound(type: 'type' | 'error' | 'keyTurn' | 'magicalBurst') {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (type === 'type') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(950 + Math.random() * 120, ctx.currentTime);
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
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } else if (type === 'keyTurn') {
      // Precision Metallic Mechanism
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(640, ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.07, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.22);
    } else if (type === 'magicalBurst') {
      // Harmonic Chime Fanfare for Magical CRM World Opening
      const chord = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
      chord.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + 0.1 + idx * 0.07);
        gain.gain.setValueAtTime(0, ctx.currentTime + 0.1 + idx * 0.07);
        gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.12 + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1 + idx * 0.07 + 0.8);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + 0.1 + idx * 0.07);
        osc.stop(ctx.currentTime + 0.1 + idx * 0.07 + 0.85);
      });
    }
  } catch {
    // Ignore audio restrictions
  }
}

interface MagicalParticle {
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
  title = 'Confidential Financial & Reports Vault',
  subtitle = 'Enter 6-digit Security PIN to open the vault (Default: 163692)',
  isUnlocked,
  onUnlock,
  onLock,
}: SecureVaultLockProps) {
  const [pin, setPin] = useState('');
  const [isError, setIsError] = useState(false);
  const [isErupting, setIsErupting] = useState(false);
  const [particles, setParticles] = useState<MagicalParticle[]>([]);
  const [dataCards, setDataCards] = useState<EruptingDataCard[]>([]);
  const [showPortalGlow, setShowPortalGlow] = useState(false);
  const [showKeyAnimation, setShowKeyAnimation] = useState(false);
  const [isExpandingToDashboard, setIsExpandingToDashboard] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input automatically on mount
  useEffect(() => {
    if (!isUnlocked && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isUnlocked]);

  // Trigger the Magical Neon Eruption & Seamless Dashboard Blend
  const triggerMagicalWorldEruption = useCallback(() => {
    setIsErupting(true);
    setShowKeyAnimation(true);
    playSound('keyTurn');

    // Stage 1: Key turns in Neon Keyhole, Emerald shockwave expands
    setTimeout(() => {
      setShowPortalGlow(true);
      playSound('magicalBurst');

      const icons = [
        '✨', '💎', '📈', '📊', '₹', '🪙', '🧾', '👑', '⚡', '🌟', '💼', '📁', '🟢'
      ];
      const colors = ['#00ff88', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#ffffff', '#fbbf24'];
      const newParticles: MagicalParticle[] = [];

      // 60 high-velocity emerald crystal particles spraying outwards in all 360 degrees
      for (let i = 0; i < 60; i++) {
        const angle = (Math.PI * 2 * i) / 60 + (Math.random() - 0.5) * 0.4;
        const velocity = 180 + Math.random() * 320;
        newParticles.push({
          id: i,
          icon: icons[Math.floor(Math.random() * icons.length)],
          tx: `${Math.cos(angle) * velocity}px`,
          ty: `${Math.sin(angle) * velocity}px`,
          scale: `${0.8 + Math.random() * 1.5}`,
          rot: `${(Math.random() - 0.5) * 1080}deg`,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }

      // Live simulated Customer Cards & Reports bursting out in 3D perspective from keyhole
      const sampleBurstCards = [
        { label: '👤 AYASHA MAZHAR', sub: 'PAN CARD 400', amount: '₹400', tag: 'PAID', tagColor: '#10b981' },
        { label: '👤 NASIR RASHID', sub: 'DRIVING LICENSE', amount: '₹5,500', tag: 'PARTIAL', tagColor: '#f59e0b' },
        { label: '📊 MONTHLY REVENUE', sub: 'Gross Profit', amount: '₹28,450', tag: '+24%', tagColor: '#10b981' },
        { label: '🧾 THERMAL BILL', sub: 'Al Uzer Receipt', amount: '₹1,200', tag: 'DELIVERED', tagColor: '#10b981' },
        { label: '👤 SAHAIL HAKIM', sub: 'PAN CARD 500', amount: '₹450', tag: 'PAID', tagColor: '#10b981' },
        { label: '📈 PROFIT MARGIN', sub: 'Total Income', amount: '₹18,900', tag: 'HEALTHY', tagColor: '#00ff88' },
      ];

      const newBurstCards: EruptingDataCard[] = sampleBurstCards.map((card, idx) => {
        const angle = -Math.PI / 2 + ((idx - (sampleBurstCards.length - 1) / 2) * 0.5);
        const dist = 190 + Math.random() * 120;
        return {
          id: idx,
          label: card.label,
          sub: card.sub,
          amount: card.amount,
          tag: card.tag,
          tagColor: card.tagColor,
          tx: `${Math.cos(angle) * dist}px`,
          ty: `${Math.sin(angle) * dist}px`,
          rot: `${(Math.random() - 0.5) * 30}deg`,
        };
      });

      setParticles(newParticles);
      setDataCards(newBurstCards);
    }, 400);

    // Stage 2: Seamless Dashboard Morph & Blend
    setTimeout(() => {
      setIsExpandingToDashboard(true);
    }, 1100);

    // Stage 3: Complete transition to Unlocked CRM View
    setTimeout(() => {
      setIsErupting(false);
      setShowPortalGlow(false);
      setShowKeyAnimation(false);
      setIsExpandingToDashboard(false);
      setParticles([]);
      setDataCards([]);
      onUnlock();
    }, 1600);
  }, [onUnlock]);

  const verifyPin = useCallback((currentPin: string) => {
    if (verifyOwnerPin(currentPin)) {
      triggerMagicalWorldEruption();
    } else {
      setIsError(true);
      playSound('error');
      setTimeout(() => {
        setPin('');
        setIsError(false);
        if (inputRef.current) inputRef.current.focus();
      }, 700);
    }
  }, [triggerMagicalWorldEruption]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isErupting) return;
    const clean = e.target.value.replace(/\D/g, '').slice(0, 6);
    playSound('type');
    setPin(clean);
    if (clean.length === 6) {
      verifyPin(clean);
    }
  };

  if (isUnlocked) {
    return (
      <div className="unlocked-vault-wrapper">
        <div className="unlocked-banner">
          <div className="banner-left">
            <span className="live-emerald-dot" />
            <span className="banner-title">
              👑 OWNER MODE ACTIVE • ALL CONFIDENTIAL METRICS UNLOCKED
            </span>
          </div>
          <button
            className="vault-exit-btn"
            onClick={onLock}
            title="Lock back into restricted Employee Mode"
          >
            <Lock size={13} />
            <span>Exit Owner Mode</span>
          </button>
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className={`secure-vault-container ${isExpandingToDashboard ? 'morphing-to-crm' : ''}`}>
      {/* Expanding Holographic Portal Shockwave */}
      {showPortalGlow && <div className="neon-emerald-shockwave" />}

      {/* Main Glassmorphic Security Card in Project Neon Emerald Theme */}
      <div className={`secure-vault-card ${isError ? 'shake' : ''} ${isErupting ? 'erupting' : ''}`}>
        
        {/* 3D Realistic Metallic Padlock with Neon Emerald Glow */}
        <div className="padlock-3d-wrapper">
          
          {/* Central Laser Beam shooting upward from Keyhole */}
          {showPortalGlow && <div className="neon-laser-geyser" />}

          {/* Magical Particles Bursting Outward */}
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
                      filter: `drop-shadow(0 0 12px ${p.color}) drop-shadow(0 0 24px #00ff88)`,
                    } as React.CSSProperties
                  }
                >
                  {p.icon}
                </div>
              ))}
            </div>
          )}

          {/* Holographic CRM Dossiers & Charts Erupting out */}
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
                    <span style={{ fontWeight: 700 }}>{card.label}</span>
                    <span
                      style={{
                        fontSize: '9px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: card.tagColor,
                        color: '#091811',
                        fontWeight: 800,
                      }}
                    >
                      {card.tag}
                    </span>
                  </div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '3px' }}>
                    {card.sub} • <strong style={{ color: '#00ff88' }}>{card.amount}</strong>
                  </div>
                </div>
              ))}
            </div>
          )}

          <svg viewBox="0 0 120 120" width="140" height="140" className="neon-padlock-svg">
            <defs>
              {/* Brushed Titanium & Neon Emerald Metallic Gradients */}
              <linearGradient id="neonEmeraldBody" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1e3a2b" />
                <stop offset="35%" stopColor="#14532d" />
                <stop offset="70%" stopColor="#064e3b" />
                <stop offset="100%" stopColor="#022c22" />
              </linearGradient>

              <linearGradient id="neonEmeraldShackle" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f8fafc" />
                <stop offset="30%" stopColor="#6ee7b7" />
                <stop offset="70%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#064e3b" />
              </linearGradient>

              <radialGradient id="neonKeyholeGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="30%" stopColor="#00ff88" />
                <stop offset="70%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#022c22" />
              </radialGradient>

              <filter id="neonEmeraldAura" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Padlock Steel Shackle (Arch) */}
            <g className={`padlock-svg-shackle ${isErupting ? 'open' : ''}`}>
              <path
                d="M 38 60 L 38 34 C 38 20 82 20 82 34 L 82 60"
                fill="none"
                stroke="url(#neonEmeraldShackle)"
                strokeWidth="11"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M 40 60 L 40 35 C 40 23 80 23 80 35 L 80 60"
                fill="none"
                stroke="#ffffff"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.9"
              />
            </g>

            {/* Padlock Body (Titanium Emerald Ingot) */}
            <rect
              x="22"
              y="52"
              width="76"
              height="58"
              rx="16"
              fill="url(#neonEmeraldBody)"
              stroke="#00ff88"
              strokeWidth="2"
              filter="url(#neonEmeraldAura)"
            />

            {/* Laser Tech Circuit Inscriptions */}
            <path
              d="M 28 64 L 40 64 L 45 70 M 92 64 L 80 64 L 75 70"
              fill="none"
              stroke="#00ff88"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.75"
            />
            <path
              d="M 28 98 L 42 98 M 92 98 L 78 98"
              fill="none"
              stroke="#10b981"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.7"
            />

            {/* Glowing Neon Keyhole */}
            <circle cx="60" cy="74" r="8" fill="url(#neonKeyholeGlow)" />
            <path d="M 56 74 L 64 74 L 62 92 L 58 92 Z" fill="url(#neonKeyholeGlow)" />
            <circle cx="60" cy="74" r="3.5" fill="#022c22" />
            <rect x="58.5" y="74" width="3" height="15" rx="1.5" fill="#022c22" />

            {/* Cyber Emerald Virtual Laser Key */}
            {showKeyAnimation && (
              <g className="virtual-laser-key">
                <path
                  d="M 60 120 L 60 76 M 60 84 L 66 84 M 60 90 L 65 90"
                  stroke="#00ff88"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  filter="url(#neonEmeraldAura)"
                />
                <circle cx="60" cy="116" r="6" fill="none" stroke="#00ff88" strokeWidth="3" />
              </g>
            )}
          </svg>
        </div>

        {/* Header Titles */}
        <div className="vault-header-text">
          <div className="vault-shield-badge">
            <ShieldCheck size={14} />
            <span>EXECUTIVE OWNER VAULT</span>
          </div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>

        {/* Minimalist 6-Digit Neon PIN Indicator (No Bulky Keypad) */}
        <div className="pin-input-section" onClick={() => inputRef.current?.focus()}>
          {/* Hidden Real Input for Keyboard / Mobile Typing */}
          <input
            ref={inputRef}
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={pin}
            onChange={handleInputChange}
            className="hidden-pin-input"
            autoFocus
          />

          {/* 6 Glowing Emerald Pin Dots */}
          <div className="pin-dots-display">
            {[0, 1, 2, 3, 4, 5].map((idx) => {
              const isFilled = idx < pin.length;
              return (
                <div
                  key={idx}
                  className={`pin-dot ${isFilled ? 'filled' : ''} ${idx === pin.length ? 'current' : ''}`}
                >
                  {isFilled && <span className="pin-dot-glow" />}
                </div>
              );
            })}
          </div>

          <div className="pin-hint">
            <KeyRound size={14} />
            <span>Type 6-digit Owner PIN on keyboard or tap above to enter</span>
          </div>
        </div>

      </div>
    </div>
  );
}

// Modal Gate Wrapper for Triggering Owner Mode
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
    <div className="secure-modal-overlay">
      <button className="secure-modal-close-btn" onClick={onClose} title="Cancel">
        <X size={22} />
      </button>
      <div className="secure-modal-content">
        <SecureVaultLock
          isUnlocked={false}
          onUnlock={onSuccess}
          onLock={onClose}
          title="Owner Security Gate"
          subtitle="Enter 6-digit PIN to activate full Owner Mode (Default: 163692)"
        >
          <div />
        </SecureVaultLock>
      </div>
    </div>
  );
}
