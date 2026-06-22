/**
 * MediaModal — anniversary-themed full-screen media viewer.
 *
 * Features:
 *  - 10 random frame effects with proper visual frames (border + mat + corner ornaments)
 *  - Always-visible prev / next navigation buttons
 *  - Gesture zone support: left 25% = prev, right 25% = next
 *  - Keyboard: ← → navigate, Esc close
 *  - Video: key-based remount + autoPlay (no redundant load/play calls)
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { OrbitMediaFile } from './MediaOrbit';

interface MediaModalProps {
  media: OrbitMediaFile;
  allMedia: OrbitMediaFile[];
  currentIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

// ── Frame types & config ──────────────────────────────────────────────────────

type FrameType =
  | 'cherry' | 'snow' | 'fireworks' | 'hearts' | 'stars'
  | 'butterfly' | 'leaves' | 'bubbles' | 'rainbow' | 'moon';

const FRAME_TYPES: FrameType[] = [
  'cherry', 'snow', 'fireworks', 'hearts', 'stars',
  'butterfly', 'leaves', 'bubbles', 'rainbow', 'moon',
];

interface FrameConfig {
  label: string;
  cornerEmoji: string;
  /** Outer frame border color */
  outerBorder: string;
  /** Mat (padding) background color */
  matBg: string;
  /** Inner border at mat edge */
  innerBorder: string;
  /** Accent for glow / dots */
  accent: string;
  /** Full box-shadow for outer frame */
  glow: string;
}

const FRAME_CONFIGS: Record<FrameType, FrameConfig> = {
  cherry: {
    label: '🌸 Hoa Anh Đào',
    cornerEmoji: '🌸',
    outerBorder: '#FF69B4',
    matBg: 'linear-gradient(135deg, #2D0018, #400025)',
    innerBorder: '#FF69B4aa',
    accent: '#FF69B4',
    glow: '0 0 0 1px #FF69B440, 0 0 30px #FF69B460, 0 0 70px #FF1493 30, 0 8px 32px rgba(0,0,0,0.7)',
  },
  snow: {
    label: '❄️ Tuyết Rơi',
    cornerEmoji: '❄️',
    outerBorder: '#87CEEB',
    matBg: 'linear-gradient(135deg, #061020, #0A1A2E)',
    innerBorder: '#87CEEBaa',
    accent: '#B0E0FF',
    glow: '0 0 0 1px #87CEEB40, 0 0 30px #87CEEB60, 0 0 70px #00BFFF20, 0 8px 32px rgba(0,0,0,0.7)',
  },
  fireworks: {
    label: '🎆 Pháo Hoa',
    cornerEmoji: '✨',
    outerBorder: '#FFD700',
    matBg: 'linear-gradient(135deg, #1A0A00, #241200)',
    innerBorder: '#FFD700aa',
    accent: '#FFD700',
    glow: '0 0 0 1px #FFD70040, 0 0 30px #FFD70060, 0 0 70px #FF8C0030, 0 8px 32px rgba(0,0,0,0.7)',
  },
  hearts: {
    label: '💝 Mưa Tim',
    cornerEmoji: '💗',
    outerBorder: '#DC143C',
    matBg: 'linear-gradient(135deg, #1E0010, #2A0018)',
    innerBorder: '#DC143Caa',
    accent: '#FF4577',
    glow: '0 0 0 1px #DC143C40, 0 0 30px #DC143C60, 0 0 70px #FF145750, 0 8px 32px rgba(0,0,0,0.7)',
  },
  stars: {
    label: '✨ Sao Lấp Lánh',
    cornerEmoji: '⭐',
    outerBorder: '#9457EB',
    matBg: 'linear-gradient(135deg, #0D0020, #160030)',
    innerBorder: '#9457EBaa',
    accent: '#B47FFF',
    glow: '0 0 0 1px #9457EB40, 0 0 30px #9457EB60, 0 0 70px #FFD70030, 0 8px 32px rgba(0,0,0,0.7)',
  },
  butterfly: {
    label: '🦋 Bướm Bay',
    cornerEmoji: '🦋',
    outerBorder: '#C8A4E8',
    matBg: 'linear-gradient(135deg, #12082A, #1A1035)',
    innerBorder: '#C8A4E8aa',
    accent: '#DDB6FF',
    glow: '0 0 0 1px #C8A4E840, 0 0 30px #9B59B660, 0 0 70px #7B2FBE30, 0 8px 32px rgba(0,0,0,0.7)',
  },
  leaves: {
    label: '🍂 Lá Mùa Thu',
    cornerEmoji: '🍂',
    outerBorder: '#E8A44A',
    matBg: 'linear-gradient(135deg, #1E0800, #2A1200)',
    innerBorder: '#E8A44Aaa',
    accent: '#FFC06E',
    glow: '0 0 0 1px #E8A44A40, 0 0 30px #E8A44A60, 0 0 70px #C0392B30, 0 8px 32px rgba(0,0,0,0.7)',
  },
  bubbles: {
    label: '🫧 Bong Bóng',
    cornerEmoji: '🫧',
    outerBorder: '#4AC8E8',
    matBg: 'linear-gradient(135deg, #001520, #002030)',
    innerBorder: '#4AC8E8aa',
    accent: '#7DDFF0',
    glow: '0 0 0 1px #4AC8E840, 0 0 30px #4AC8E860, 0 0 70px #00BCD430, 0 8px 32px rgba(0,0,0,0.7)',
  },
  rainbow: {
    label: '🌈 Cầu Vồng',
    cornerEmoji: '🌈',
    outerBorder: '#FFD700',
    matBg: 'linear-gradient(135deg, #080010, #100018)',
    innerBorder: 'rgba(255,215,0,0.6)',
    accent: '#FF69B4',
    glow: '0 0 0 1px rgba(255,100,100,0.3), 0 0 30px rgba(255,200,0,0.5), 0 0 60px rgba(100,100,255,0.3), 0 8px 32px rgba(0,0,0,0.7)',
  },
  moon: {
    label: '🌙 Ánh Trăng',
    cornerEmoji: '🌙',
    outerBorder: '#7B9EC8',
    matBg: 'linear-gradient(135deg, #03040F, #070815)',
    innerBorder: '#7B9EC8aa',
    accent: '#C0D8F0',
    glow: '0 0 0 1px #7B9EC840, 0 0 30px #7B9EC860, 0 0 70px #4A6A9830, 0 8px 32px rgba(0,0,0,0.7)',
  },
};

// ── Particle components ───────────────────────────────────────────────────────

const CherryParticles: React.FC = () => (
  <>
    {Array.from({ length: 16 }, (_, i) => (
      <div key={i} className="absolute pointer-events-none select-none"
        style={{
          left: `${(i * 6.1 + 2) % 94}%`, top: `-8%`, fontSize: `${10 + (i % 4) * 3}px`,
          animation: `p_fall ${4 + (i % 4)}s linear ${(i * 0.4) % 3.5}s infinite`, opacity: 0.9
        }}>
        {['🌸', '🌺', '🌷', '🌼'][i % 4]}
      </div>
    ))}
  </>
);

const SnowParticles: React.FC = () => (
  <>
    {Array.from({ length: 18 }, (_, i) => (
      <div key={i} className="absolute pointer-events-none select-none text-sky-200"
        style={{
          left: `${(i * 5.3 + 1) % 96}%`, top: `-6%`, fontSize: `${8 + (i % 4) * 3}px`,
          animation: `p_fall ${5 + (i % 5)}s linear ${(i * 0.28) % 4}s infinite`, opacity: 0.8
        }}>
        {['❄', '❅', '❆', '·', '✦'][i % 5]}
      </div>
    ))}
  </>
);

const FireworksParticles: React.FC = () => {
  const colors = ['#FFD700', '#FF4500', '#00CED1', '#FF69B4', '#7FFF00', '#FF1493'];
  const positions = [
    [12, 15], [85, 12], [48, 8], [22, 80], [78, 75], [60, 20],
  ] as [number, number][];
  return (
    <>
      {positions.map(([lx, ty], bi) =>
        Array.from({ length: 8 }, (_, pi) => {
          const angle = (pi / 8) * 360;
          const dist = 55 + bi * 8;
          const dx = Math.cos((angle * Math.PI) / 180) * dist;
          const dy = Math.sin((angle * Math.PI) / 180) * dist;
          const color = colors[(bi * 2 + pi) % colors.length];
          return (
            <div key={`${bi}-${pi}`}
              className="absolute pointer-events-none select-none rounded-full"
              style={{
                left: `${lx}%`, top: `${ty}%`, width: `${4 + (pi % 3)}px`, height: `${4 + (pi % 3)}px`,
                background: color, boxShadow: `0 0 4px ${color}`,
                animation: `p_burst_${bi * 8 + pi} ${1.8 + bi * 0.25}s ease-out ${bi * 0.6 + pi * 0.04}s infinite`
              }} />
          );
        })
      )}
      <style>{positions.map(([,], bi) =>
        Array.from({ length: 8 }, (_, pi) => {
          const angle = (pi / 8) * 360;
          const dist = 55 + bi * 8;
          const dx = Math.round(Math.cos((angle * Math.PI) / 180) * dist);
          const dy = Math.round(Math.sin((angle * Math.PI) / 180) * dist);
          return `@keyframes p_burst_${bi * 8 + pi} { 0%{transform:translate(-50%,-50%) scale(0);opacity:1} 60%{opacity:.8} 100%{transform:translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(.2);opacity:0} }`;
        }).join('\n')
      ).join('\n')}</style>
    </>
  );
};

const HeartsParticles: React.FC = () => (
  <>
    {Array.from({ length: 16 }, (_, i) => (
      <div key={i} className="absolute pointer-events-none select-none"
        style={{
          left: `${(i * 5.9 + 3) % 92}%`, bottom: `-5%`, fontSize: `${10 + (i % 5) * 3}px`,
          animation: `p_rise ${3.5 + (i % 4)}s ease-out ${(i * 0.3) % 3.5}s infinite`, opacity: 0.9
        }}>
        {['💗', '💕', '❤️', '💖', '🩷'][i % 5]}
      </div>
    ))}
  </>
);

const StarsParticles: React.FC = () => (
  <>
    {Array.from({ length: 18 }, (_, i) => (
      <div key={i} className="absolute pointer-events-none select-none"
        style={{
          left: `${(i * 5.1 + 2) % 94}%`, top: `${(i * 7.3 + 5) % 84}%`, fontSize: `${8 + (i % 5) * 3}px`,
          animation: `p_twinkle ${1.5 + (i % 4) * 0.4}s ease-in-out ${(i * 0.2) % 2.5}s infinite alternate`, opacity: 0.85
        }}>
        {['✨', '⭐', '🌟', '💫', '★'][i % 5]}
      </div>
    ))}
  </>
);

const ButterflyParticles: React.FC = () => (
  <>
    {Array.from({ length: 10 }, (_, i) => (
      <div key={i} className="absolute pointer-events-none select-none"
        style={{
          left: `${(i * 9.5 + 5) % 88}%`, top: `${(i * 11 + 8) % 80}%`, fontSize: `${14 + (i % 3) * 6}px`,
          animation: `p_flutter ${3 + (i % 4)}s ease-in-out ${(i * 0.5) % 3}s infinite`, opacity: 0.85
        }}>
        🦋
      </div>
    ))}
  </>
);

const LeavesParticles: React.FC = () => (
  <>
    {Array.from({ length: 14 }, (_, i) => (
      <div key={i} className="absolute pointer-events-none select-none"
        style={{
          left: `${(i * 6.7 + 2) % 95}%`, top: `-8%`, fontSize: `${12 + (i % 4) * 4}px`,
          animation: `p_leaf ${4 + (i % 4)}s ease-in ${(i * 0.38) % 3.5}s infinite`, opacity: 0.9
        }}>
        {['🍂', '🍁', '🍃', '🌿'][i % 4]}
      </div>
    ))}
  </>
);

const BubblesParticles: React.FC = () => (
  <>
    {Array.from({ length: 14 }, (_, i) => (
      <div key={i} className="absolute pointer-events-none select-none"
        style={{
          left: `${(i * 6.8 + 4) % 90}%`, bottom: `-5%`, fontSize: `${14 + (i % 4) * 6}px`,
          animation: `p_bubble ${3.5 + (i % 5)}s ease-out ${(i * 0.35) % 3}s infinite`, opacity: 0.7
        }}>
        {['○', '◯', '⊙', '🔵'][i % 4]}
      </div>
    ))}
  </>
);

const RainbowParticles: React.FC = () => {
  const rainbowColors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#8B00FF', '#FF69B4'];
  return (
    <>
      {Array.from({ length: 20 }, (_, i) => (
        <div key={i} className="absolute pointer-events-none select-none font-bold"
          style={{
            left: `${(i * 4.8 + 2) % 94}%`, top: `${(i * 6.2 + 3) % 88}%`,
            fontSize: `${8 + (i % 4) * 3}px`, color: rainbowColors[i % rainbowColors.length],
            animation: `p_twinkle ${1.2 + (i % 4) * 0.3}s ease-in-out ${(i * 0.15) % 2}s infinite alternate`,
            textShadow: `0 0 6px ${rainbowColors[i % rainbowColors.length]}`, opacity: 0.9
          }}>
          {['✦', '✧', '◆', '◇', '★', '☆'][i % 6]}
        </div>
      ))}
    </>
  );
};

const MoonParticles: React.FC = () => (
  <>
    {Array.from({ length: 16 }, (_, i) => (
      <div key={i} className="absolute pointer-events-none select-none"
        style={{
          left: `${(i * 5.9 + 3) % 92}%`, top: `${(i * 7.8 + 4) % 86}%`, fontSize: `${8 + (i % 5) * 3}px`,
          animation: `p_twinkle ${2 + (i % 5) * 0.4}s ease-in-out ${(i * 0.22) % 3}s infinite alternate`, opacity: 0.75
        }}>
        {['🌟', '⭐', '✦', '·', '🌙'][i % 5]}
      </div>
    ))}
  </>
);

const FRAME_PARTICLES: Record<FrameType, React.FC> = {
  cherry: CherryParticles, snow: SnowParticles, fireworks: FireworksParticles,
  hearts: HeartsParticles, stars: StarsParticles, butterfly: ButterflyParticles,
  leaves: LeavesParticles, bubbles: BubblesParticles, rainbow: RainbowParticles, moon: MoonParticles,
};

// ── Frame decoration components ─────────────────────────────────────────────

/** CSS L-bracket corners at the inner photo border + floating emoji ornaments */
const FrameCorners: React.FC<{ accent: string; emoji: string }> = ({ accent, emoji }) => (
  <>
    {/* 4 CSS L-bracket corners at the inner photo edge */}
    {([
      { s: { top: -2, left: -2 }, bs: { borderTop: `3px solid ${accent}`, borderLeft: `3px solid ${accent}`, borderTopLeftRadius: 6 } },
      { s: { top: -2, right: -2 }, bs: { borderTop: `3px solid ${accent}`, borderRight: `3px solid ${accent}`, borderTopRightRadius: 6 } },
      { s: { bottom: -2, left: -2 }, bs: { borderBottom: `3px solid ${accent}`, borderLeft: `3px solid ${accent}`, borderBottomLeftRadius: 6 } },
      { s: { bottom: -2, right: -2 }, bs: { borderBottom: `3px solid ${accent}`, borderRight: `3px solid ${accent}`, borderBottomRightRadius: 6 } },
    ] as const).map(({ s, bs }, i) => (
      <div key={i} style={{ position: 'absolute', width: 24, height: 24, pointerEvents: 'none', zIndex: 20, ...s, ...bs }} />
    ))}
    {/* Floating emoji at outer corners */}
    {[
      { style: { top: -14, left: -10 }, delay: '0s' },
      { style: { top: -14, right: -10 }, delay: '0.5s' },
      { style: { bottom: -14, left: -10 }, delay: '1.0s' },
      { style: { bottom: -14, right: -10 }, delay: '1.5s' },
    ].map(({ style: st, delay }, i) => (
      <div key={`em-${i}`} style={{
        position: 'absolute', ...st, fontSize: 24, zIndex: 22, pointerEvents: 'none',
        filter: `drop-shadow(0 0 8px ${accent}) drop-shadow(0 0 3px ${accent})`,
        animation: `bracketFloat 2.2s ease-in-out ${delay} infinite alternate`,
      }}>{emoji}</div>
    ))}
    {/* Side ornaments */}
    {[
      { style: { top: '50%', left: -20, transform: 'translateY(-50%)' }, delay: '0.3s' },
      { style: { top: '50%', right: -20, transform: 'translateY(-50%)' }, delay: '0.8s' },
    ].map(({ style: st, delay }, i) => (
      <div key={`sd-${i}`} style={{
        position: 'absolute', ...st as React.CSSProperties, fontSize: 18, zIndex: 22, pointerEvents: 'none', opacity: 0.75,
        filter: `drop-shadow(0 0 6px ${accent})`,
        animation: `bracketFloat 3s ease-in-out ${delay} infinite alternate`,
      }}>{emoji}</div>
    ))}
  </>
);

/** Sweeping shimmer light over the frame mat */
const ShimmerOverlay: React.FC<{ accent: string }> = ({ accent }) => (
  <div style={{
    position: 'absolute', inset: 0, borderRadius: 13, pointerEvents: 'none', zIndex: 5,
    background: `linear-gradient(110deg, transparent 20%, ${accent}22 50%, transparent 80%)`,
    backgroundSize: '200% 100%',
    animation: 'shimmerSweep 4s ease-in-out 0.5s infinite',
    mixBlendMode: 'overlay',
  }} />
);

/** Pulsing outer glow ring */
const GlowRing: React.FC<{ accent: string }> = ({ accent }) => (
  <div style={{
    position: 'absolute', inset: -8, borderRadius: 22, pointerEvents: 'none', zIndex: 0,
    border: `1px solid ${accent}40`,
    animation: 'ringPulse 2.5s ease-in-out infinite',
  }} />
);

// ── Rainbow border special case ───────────────────────────────────────────────

const RainbowBorder: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    className="p-0.5 rounded-2xl"
    style={{
      background: 'linear-gradient(135deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #8b00ff, #ff0000)',
      boxShadow: '0 0 30px rgba(255,100,100,0.4), 0 0 60px rgba(100,100,255,0.3), 0 8px 32px rgba(0,0,0,0.7)',
      animation: 'rainbowRotate 4s linear infinite',
    }}
  >
    {children}
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────

export const MediaModal: React.FC<MediaModalProps> = ({
  media,
  allMedia,
  currentIndex,
  onClose,
  onPrev,
  onNext,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoading, setVideoLoading] = useState(false);

  // Pick a random frame per photo URL
  const frameType = useMemo<FrameType>(
    () => FRAME_TYPES[Math.floor(Math.random() * FRAME_TYPES.length)],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [media.url],
  );

  const cfg = FRAME_CONFIGS[frameType];
  const Particles = FRAME_PARTICLES[frameType];
  const total = allMedia.length;

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
    },
    [onClose, onPrev, onNext],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  // Optimised video loading: keep the same <video> DOM node alive, just swap src.
  // This avoids the unmount/remount stutter that key={media.url}+autoPlay causes.
  useEffect(() => {
    if (media.type !== 'video') return;
    const v = videoRef.current;
    if (!v) return;

    let cancelled = false;
    v.pause();
    // removeAttribute is cleaner than v.src='' — avoids spurious error events
    v.removeAttribute('src');
    v.load(); // abort any in-flight fetch and reset internal state

    setVideoLoading(true);
    v.src = media.url;
    v.load(); // explicitly start buffering the new src

    const onCanPlay = () => {
      if (cancelled) return;
      setVideoLoading(false);
      v.play().catch(() => { /* autoplay blocked */ });
    };
    const onError = () => { if (!cancelled) setVideoLoading(false); };

    v.addEventListener('canplay', onCanPlay, { once: true });
    v.addEventListener('error', onError, { once: true });
    return () => {
      cancelled = true;
      v.removeEventListener('canplay', onCanPlay);
      v.removeEventListener('error', onError);
    };
  }, [media.url, media.type]);

  const frameContent = (
    /* Outer frame wrapper — pulsing border + glow */
    <div
      className="relative w-full"
      style={{
        borderRadius: 18,
        border: `3px solid ${cfg.outerBorder}`,
        boxShadow: cfg.glow,
        animation: 'framePulse 3s ease-in-out infinite',
      }}
    >
      {/* Pulsing outer glow ring */}
      <GlowRing accent={cfg.accent} />

      {/* Mat area with diagonal texture pattern */}
      <div style={{
        background: cfg.matBg,
        backgroundImage: `repeating-linear-gradient(45deg, transparent 0, transparent 7px, ${cfg.accent}0D 7px, ${cfg.accent}0D 8px)`,
        padding: '10px 14px 8px',
        borderRadius: 15,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Shimmer sweep */}
        <ShimmerOverlay accent={cfg.accent} />

        {/* Top title strip */}
        <div style={{
          textAlign: 'center', marginBottom: 8,
          borderBottom: `1px solid ${cfg.accent}35`,
          paddingBottom: 6,
        }}>
          <span style={{
            fontSize: 10, color: cfg.accent, opacity: 0.85,
            letterSpacing: '0.25em', textTransform: 'uppercase' as const,
            textShadow: `0 0 8px ${cfg.accent}`,
          }}>
            ✦ {cfg.label.replace(/^.\S*\s/, '')} ✦
          </span>
        </div>

        {/* Photo / video with inner border + corner brackets */}
        <div
          className="relative overflow-visible"
          style={{ borderRadius: 8, border: `2px solid ${cfg.innerBorder}`, overflow: 'hidden' }}
        >
          <FrameCorners accent={cfg.accent} emoji={cfg.cornerEmoji} />

          {media.type === 'image' ? (
            <img
              key={media.url}
              src={media.url}
              alt="Kỉ niệm"
              className="w-full object-contain bg-black"
              style={{ maxHeight: 'min(62vh, 65vw)', display: 'block' }}
            />
          ) : (
            <div style={{ position: 'relative' }}>
              {/* Persistent video element — src managed via useEffect to avoid DOM teardown stutter */}
              <video
                ref={videoRef}
                controls
                loop
                playsInline
                preload="auto"
                className="w-full bg-black"
                style={{ maxHeight: 'min(62vh, 65vw)', display: 'block' }}
              />
              {videoLoading && (
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(0,0,0,0.55)',
                }}>
                  <span style={{
                    fontSize: 36, color: cfg.accent,
                    animation: 'p_twinkle 0.7s ease-in-out infinite alternate',
                  }}>⏳</span>
                </div>
              )}
            </div>
          )}

          {/* Decorative caption strip at photo bottom */}
          <div style={{
            background: `linear-gradient(to right, transparent, ${cfg.accent}25, transparent)`,
            borderTop: `1px solid ${cfg.accent}40`,
            padding: '5px 12px',
            textAlign: 'center',
            fontSize: 10,
            letterSpacing: '0.3em',
            color: cfg.accent,
            textShadow: `0 0 10px ${cfg.accent}`,
          }}>
            ✦ &nbsp; KỈ NIỆM &nbsp; ✦
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        background: 'radial-gradient(ellipse at center, #1a0025 0%, #06000d 100%)',
        animation: 'modalFadeIn 0.25s ease',
      }}
    >
      {/* Particle overlay */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
        <Particles />
      </div>

      {/* ── Prev button ── */}
      {total > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full flex items-center justify-center text-3xl font-thin text-white transition-all duration-200 active:scale-90"
          style={{
            background: 'rgba(0,0,0,0.55)',
            border: `2px solid ${cfg.outerBorder}60`,
            boxShadow: `0 0 14px ${cfg.accent}50`,
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = `${cfg.accent}50`; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,0.55)'; }}
          aria-label="Ảnh trước"
        >
          ‹
        </button>
      )}

      {/* ── Next button ── */}
      {total > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full flex items-center justify-center text-3xl font-thin text-white transition-all duration-200 active:scale-90"
          style={{
            background: 'rgba(0,0,0,0.55)',
            border: `2px solid ${cfg.outerBorder}60`,
            boxShadow: `0 0 14px ${cfg.accent}50`,
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = `${cfg.accent}50`; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,0.55)'; }}
          aria-label="Ảnh tiếp theo"
        >
          ›
        </button>
      )}

      {/* Close backdrop */}
      <div className="absolute inset-0 z-10" onClick={onClose} />

      {/* ── Main card ── */}
      <div
        className="relative z-20 flex flex-col items-center gap-3 px-4 md:px-16"
        style={{
          maxWidth: 'min(96vw, 860px)',
          width: '100%',
          animation: 'modalScaleIn 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Frame label + counter */}
        <div className="flex items-center gap-3">
          <span className="text-xs opacity-60" style={{ color: cfg.accent }}>{cfg.label}</span>
          {total > 1 && (
            <span
              className="text-xs px-2.5 py-0.5 rounded-full"
              style={{ color: cfg.accent, background: `${cfg.accent}18`, border: `1px solid ${cfg.accent}40` }}
            >
              {currentIndex + 1} / {total}
            </span>
          )}
        </div>

        {/* Frame (rainbow gets special wrapper) */}
        {frameType === 'rainbow' ? (
          <RainbowBorder>{frameContent}</RainbowBorder>
        ) : frameContent}

        {/* Progress dots */}
        {total > 1 && (
          <div className="flex gap-1.5 items-center">
            {allMedia.map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === currentIndex ? '18px' : '6px',
                  height: '6px',
                  background: i === currentIndex ? cfg.accent : `${cfg.accent}35`,
                }}
              />
            ))}
          </div>
        )}

        <p className="text-white/20 text-xs">
          <span className="hidden sm:inline">{total > 1 ? '← → điều hướng  •  ESC / 🤟 kẹp giữa / ↑ cử chỉ = đóng' : 'ESC / 🤟 kẹp giữa / ↑ cử chỉ = đóng'}</span>
          <span className="sm:hidden opacity-60">{total > 1 ? 'vuốt trái/phải • 🤟kẹp giữa / ↑vuốt lên để đóng' : '🤟kẹp giữa / ↑vuốt lên để đóng'}</span>
        </p>
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-40 w-10 h-10 rounded-full bg-black/50 text-pink-300 hover:text-white transition-all text-xl flex items-center justify-center"
        style={{ border: `1px solid ${cfg.outerBorder}50` }}
        aria-label="Đóng"
      >
        ✕
      </button>

      <style>{`
        @keyframes modalFadeIn  { from{opacity:0}              to{opacity:1} }
        @keyframes modalScaleIn { from{opacity:0;transform:scale(0.92)} to{opacity:1;transform:scale(1)} }
        @keyframes bracketFloat { from{transform:scale(0.85) rotate(-8deg);opacity:0.8} to{transform:scale(1.15) rotate(8deg);opacity:1} }
        @keyframes framePulse   { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.9;transform:scale(1.003)} }
        @keyframes ringPulse    { 0%,100%{opacity:0.4;transform:scale(1)} 50%{opacity:0.85;transform:scale(1.04)} }
        @keyframes shimmerSweep { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes p_fall   { 0%{transform:translateY(0) rotate(0deg);opacity:.9} 100%{transform:translateY(110vh) rotate(360deg);opacity:0} }
        @keyframes p_rise   { 0%{transform:translateY(0) scale(.8);opacity:.9}    100%{transform:translateY(-110vh) scale(1.1);opacity:0} }
        @keyframes p_twinkle{ from{transform:scale(.5) rotate(0deg);opacity:.2}   to{transform:scale(1.3) rotate(20deg);opacity:1} }
        @keyframes p_flutter{ 0%,100%{transform:translateX(0) rotate(-10deg) scale(1)} 50%{transform:translateX(30px) rotate(10deg) scale(1.1)} }
        @keyframes p_leaf   { 0%{transform:translateY(0) rotate(0deg);opacity:.9} 50%{transform:translateY(50vh) rotate(180deg) translateX(20px)} 100%{transform:translateY(110vh) rotate(360deg);opacity:0} }
        @keyframes p_bubble { 0%{transform:translateY(0) scale(.8);opacity:.7} 100%{transform:translateY(-110vh) scale(1.2);opacity:0} }
        @keyframes rainbowRotate { from{background-position:0% 50%} to{background-position:100% 50%} }
      `}</style>
    </div>
  );
};
