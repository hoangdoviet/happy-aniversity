/**
 * SeasonalOverlay — CSS particle effects based on Vietnamese seasons.
 *
 * Anniversary start: July 2025 (month 1) → June 2026 (month 12).
 * Month 0 = heart screen (treated as Summer).
 * Month 12 = 1-year anniversary → special heart celebration effect.
 *
 * Season mapping (Vietnamese climate):
 *   Hạ  (Summer):      months 1, 11     → July, May
 *   Thu (Autumn):      months 2, 3, 4   → Aug, Sep, Oct
 *   Đông (Winter):     months 5, 6, 7   → Nov, Dec, Jan
 *   Xuân (Spring):     months 8, 9, 10  → Feb, Mar, Apr
 *   Anniversary ♥:     month 12         → June 2026 — 1 năm
 */
import React, { useMemo } from 'react';

type Season = 'spring' | 'summer' | 'autumn' | 'winter' | 'anniversary';

const SEASON_MAP: Record<number, Season> = {
    0: 'summer',       // heart screen
    1: 'summer',       // July 2025
    2: 'autumn',       // Aug 2025
    3: 'autumn',       // Sep 2025
    4: 'autumn',       // Oct 2025
    5: 'winter',       // Nov 2025
    6: 'winter',       // Dec 2025
    7: 'winter',       // Jan 2026
    8: 'spring',       // Feb 2026
    9: 'spring',       // Mar 2026
    10: 'spring',      // Apr 2026
    11: 'summer',      // May 2026
    12: 'anniversary', // Jun 2026 — 1 năm ♥
};

interface SeasonMeta {
    label: string;
    icon: string;
    /** Small repeating particles */
    emojis: string[];
    /** Large accent particles (fewer, bigger, more dramatic) */
    accentEmojis: string[];
    particleCount: number;
    accentCount: number;
    direction: 'fall' | 'rise';
    color: string;
    /** Subtle full-screen atmospheric gradient tint */
    atmosphere: string;
    /** CSS filter applied to all particles */
    glow: string;
}

const SEASON_META: Record<Season, SeasonMeta> = {
    anniversary: {
        label: '1 Năm ♥',
        icon: '💖',
        emojis: ['💖', '💕', '❤️', '💗', '💝', '🩷', '💖', '💕'],
        accentEmojis: ['🌹', '💐', '🎊', '🎉', '✨', '🌟'],
        particleCount: 42,
        accentCount: 12,
        direction: 'rise',
        color: '#FF69B4',
        atmosphere: 'radial-gradient(ellipse 140% 60% at 50% 110%, rgba(255,105,180,0.22) 0%, rgba(255,215,0,0.10) 42%, transparent 70%)',
        glow: 'drop-shadow(0 0 10px #FF69B4) drop-shadow(0 0 5px rgba(255,100,160,0.95))',
    },
    spring: {
        label: 'Mùa Xuân',
        icon: '🌸',
        emojis: ['🌸', '🌸', '✿', '🌺', '🌷', '🌸', '✿', '🌸'],
        accentEmojis: ['🦋', '🌸', '🌺', '🌷'],
        particleCount: 34,
        accentCount: 7,
        direction: 'fall',
        color: '#FFB7C5',
        atmosphere: 'radial-gradient(ellipse 140% 45% at 50% -5%, rgba(255,160,190,0.18) 0%, transparent 68%)',
        glow: 'drop-shadow(0 0 6px #FFB7C5) drop-shadow(0 0 3px rgba(255,150,180,0.7))',
    },
    summer: {
        label: 'Mùa Hạ',
        icon: '☀️',
        emojis: ['✨', '⭐', '💫', '🌟', '✦', '✧', '⭐', '✨'],
        accentEmojis: ['🌟', '✨', '💫', '⭐'],
        particleCount: 36,
        accentCount: 8,
        direction: 'rise',
        color: '#FFD700',
        atmosphere: 'radial-gradient(ellipse 110% 55% at 50% 115%, rgba(255,200,0,0.16) 0%, transparent 60%)',
        glow: 'drop-shadow(0 0 8px #FFD700) drop-shadow(0 0 4px rgba(255,220,0,0.8))',
    },
    autumn: {
        label: 'Mùa Thu',
        icon: '🍂',
        emojis: ['🍂', '🍁', '🍂', '🍃', '🍁', '🍂', '🍁', '🍃'],
        accentEmojis: ['🍂', '🍁', '🍃'],
        particleCount: 32,
        accentCount: 7,
        direction: 'fall',
        color: '#E8834E',
        atmosphere: 'linear-gradient(to top, rgba(200,90,20,0.14) 0%, rgba(180,70,10,0.04) 35%, transparent 55%)',
        glow: 'drop-shadow(0 0 5px #E8834E) drop-shadow(0 0 3px rgba(220,100,30,0.6))',
    },
    winter: {
        label: 'Mùa Đông',
        icon: '❄',
        emojis: ['❄', '❅', '❆', '·', '❄', '❅', '❄', '❆'],
        accentEmojis: ['❄', '❅', '❆'],
        particleCount: 42,
        accentCount: 8,
        direction: 'fall',
        color: '#A8D8F0',
        atmosphere: 'radial-gradient(ellipse 140% 45% at 50% -5%, rgba(140,200,240,0.15) 0%, transparent 65%)',
        glow: 'drop-shadow(0 0 7px #A8D8F0) drop-shadow(0 0 4px rgba(180,220,255,0.9))',
    },
};

// ── Particle configs ──────────────────────────────────────────────────────────

interface ParticleConfig {
    emoji: string;
    left: number;
    size: number;
    duration: number;
    swayDuration: number;
    delay: number;
    isAccent: boolean;
}

const seeded = (n: number) => {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
};

function buildParticles(season: Season): ParticleConfig[] {
    const meta = SEASON_META[season];
    const regular: ParticleConfig[] = Array.from({ length: meta.particleCount }, (_, i) => ({
        emoji: meta.emojis[i % meta.emojis.length],
        left: seeded(i * 3.1) * 94 + 1,
        size: 14 + Math.floor(seeded(i * 7.3) * 16),   // 14–30 px
        duration: 5 + seeded(i * 2.7) * 9,
        swayDuration: 3 + seeded(i * 4.1) * 4,
        delay: seeded(i * 5.9) * 7,
        isAccent: false,
    }));
    const accent: ParticleConfig[] = Array.from({ length: meta.accentCount }, (_, i) => ({
        emoji: meta.accentEmojis[i % meta.accentEmojis.length],
        left: seeded(i * 11.3 + 50) * 88 + 4,
        size: 28 + Math.floor(seeded(i * 9.1) * 18),   // 28–46 px
        duration: 7 + seeded(i * 3.3) * 8,
        swayDuration: 4 + seeded(i * 5.7) * 5,
        delay: seeded(i * 7.1) * 6,
        isAccent: true,
    }));
    return [...regular, ...accent];
}

// ── CSS keyframes per season ──────────────────────────────────────────────────

const CSS_KEYFRAMES: Record<Season, string> = {
    anniversary: `
        @keyframes s_drop {
            0%   { transform: translateY(118vh) scale(0.45) rotate(-10deg); opacity: 0; }
            8%   { opacity: 1; }
            45%  { transform: translateY(55vh) scale(1.15) rotate(8deg); opacity: 1; }
            88%  { opacity: 1; }
            100% { transform: translateY(-15vh) scale(0.55) rotate(20deg); opacity: 0; }
        }
        @keyframes s_sway {
            from { transform: translateX(-30px) rotate(-10deg); }
            to   { transform: translateX( 30px) rotate( 10deg); }
        }
        @keyframes s_acc_drop {
            0%   { transform: translateY(120vh) scale(0.5) rotate(0deg); opacity: 0; }
            10%  { opacity: 1; }
            50%  { transform: translateY(55vh) scale(1.3) rotate(180deg); opacity: 1; }
            88%  { opacity: 1; }
            100% { transform: translateY(-18vh) scale(0.7) rotate(360deg); opacity: 0; }
        }
    `,
    spring: `
        @keyframes s_drop {
            0%   { transform: translateY(-10vh); opacity: 0; }
            7%   { opacity: 1; }
            90%  { opacity: 1; }
            100% { transform: translateY(110vh); opacity: 0; }
        }
        @keyframes s_sway {
            from { transform: translateX(-26px) rotate(-15deg); }
            to   { transform: translateX( 26px) rotate( 15deg); }
        }
        @keyframes s_acc_drop {
            0%   { transform: translateY(-12vh) rotate(0deg); opacity: 0; }
            8%   { opacity: 1; }
            88%  { opacity: 1; }
            100% { transform: translateY(112vh) rotate(180deg); opacity: 0; }
        }
    `,
    summer: `
        @keyframes s_drop {
            0%   { transform: translateY(115vh) scale(0.5); opacity: 0; }
            10%  { opacity: 1; }
            50%  { transform: translateY(50vh) scale(1.2); opacity: 1; }
            90%  { opacity: 1; }
            100% { transform: translateY(-15vh) scale(0.4); opacity: 0; }
        }
        @keyframes s_sway {
            from { transform: translateX(-22px); }
            to   { transform: translateX( 22px); }
        }
        @keyframes s_acc_drop {
            0%   { transform: translateY(115vh) scale(0.6); opacity: 0; }
            12%  { opacity: 1; }
            85%  { opacity: 1; }
            100% { transform: translateY(-15vh) scale(1.4); opacity: 0; }
        }
    `,
    autumn: `
        @keyframes s_drop {
            0%   { transform: translateY(-10vh) rotate(0deg); opacity: 0; }
            8%   { opacity: 1; }
            35%  { transform: translateY(35vh) translateX(20px) rotate(120deg); opacity: 1; }
            70%  { transform: translateY(70vh) translateX(-12px) rotate(270deg); opacity: 1; }
            92%  { opacity: 1; }
            100% { transform: translateY(110vh) translateX(8px) rotate(360deg); opacity: 0; }
        }
        @keyframes s_sway {
            from { transform: translateX(-32px) rotate(-20deg); }
            to   { transform: translateX( 32px) rotate( 20deg); }
        }
        @keyframes s_acc_drop {
            0%   { transform: translateY(-12vh) rotate(0deg); opacity: 0; }
            8%   { opacity: 1; }
            50%  { transform: translateY(50vh) translateX(30px) rotate(200deg); opacity: 1; }
            92%  { opacity: 1; }
            100% { transform: translateY(112vh) rotate(400deg); opacity: 0; }
        }
    `,
    winter: `
        @keyframes s_drop {
            0%   { transform: translateY(-8vh); opacity: 0; }
            7%   { opacity: 0.9; }
            90%  { opacity: 0.9; }
            100% { transform: translateY(108vh); opacity: 0; }
        }
        @keyframes s_sway {
            from { transform: translateX(-16px) rotate(-5deg); }
            to   { transform: translateX( 16px) rotate(  5deg); }
        }
        @keyframes s_acc_drop {
            0%   { transform: translateY(-10vh) scale(1); opacity: 0; }
            6%   { opacity: 1; }
            50%  { transform: translateY(50vh) scale(1.3); }
            92%  { opacity: 1; }
            100% { transform: translateY(110vh) scale(0.7); opacity: 0; }
        }
    `,
};

// ── Season persistent badge ───────────────────────────────────────────────────

const SeasonBadge: React.FC<{ season: Season }> = ({ season }) => {
    const meta = SEASON_META[season];
    const isAnniversary = season === 'anniversary';
    return (
        <div
            style={{
                position: 'fixed',
                bottom: 20,
                right: 20,
                zIndex: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: isAnniversary ? '7px 18px 7px 13px' : '5px 14px 5px 10px',
                borderRadius: 20,
                background: isAnniversary
                    ? 'linear-gradient(135deg, rgba(40,0,20,0.75), rgba(20,0,10,0.75))'
                    : 'rgba(0,0,0,0.35)',
                border: isAnniversary
                    ? `1px solid #FFD70080`
                    : `1px solid ${meta.color}50`,
                boxShadow: isAnniversary
                    ? `0 0 22px #FF69B450, 0 0 40px #FFD70030, inset 0 0 12px #FF69B410`
                    : `0 0 14px ${meta.color}30, inset 0 0 10px ${meta.color}0A`,
                backdropFilter: 'blur(8px)',
                pointerEvents: 'none',
                userSelect: 'none',
                animation: isAnniversary
                    ? 'badge_in 0.8s cubic-bezier(0.34,1.56,0.64,1) forwards, anniv_pulse 2.4s ease-in-out 1s infinite'
                    : 'badge_in 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards',
            }}
        >
            <span style={{ fontSize: isAnniversary ? 18 : 15 }}>{meta.icon}</span>
            <span style={{
                fontSize: isAnniversary ? 11 : 10,
                fontWeight: isAnniversary ? 600 : 500,
                color: isAnniversary ? '#FFD700' : meta.color,
                letterSpacing: '0.22em',
                textShadow: isAnniversary
                    ? `0 0 12px #FFD700, 0 0 6px #FF69B4`
                    : `0 0 10px ${meta.color}`,
            }}>
                {meta.label.toUpperCase()}
            </span>
            <style>{`
                @keyframes badge_in {
                    from { opacity:0; transform:translateX(16px); }
                    to   { opacity:1; transform:translateX(0); }
                }
                @keyframes anniv_pulse {
                    0%,100% { box-shadow: 0 0 22px #FF69B450, 0 0 40px #FFD70030, inset 0 0 12px #FF69B410; }
                    50%     { box-shadow: 0 0 32px #FF69B470, 0 0 55px #FFD70050, inset 0 0 18px #FF69B420; }
                }
            `}</style>
        </div>
    );
};

// ── Main component ────────────────────────────────────────────────────────────

interface SeasonalOverlayProps {
    currentMonth: number;
}

export const SeasonalOverlay: React.FC<SeasonalOverlayProps> = ({ currentMonth }) => {
    const season = SEASON_MAP[currentMonth] ?? 'summer';
    const meta = SEASON_META[season];
    const particles = useMemo(() => buildParticles(season), [season]);

    return (
        <>
            {/* Persistent season badge — bottom-right corner */}
            <SeasonBadge key={`badge-${season}`} season={season} />

            {/* Atmospheric tint — subtle seasonal colour wash on screen edges */}
            <div
                key={`atmo-${season}`}
                style={{
                    position: 'fixed',
                    inset: 0,
                    pointerEvents: 'none',
                    zIndex: 4,
                    background: meta.atmosphere,
                    transition: 'opacity 1.5s ease',
                    animation: 'atmo_in 1.5s ease forwards',
                }}
            />

            {/* Particle canvas */}
            <div
                style={{
                    position: 'fixed',
                    inset: 0,
                    pointerEvents: 'none',
                    userSelect: 'none',
                    zIndex: 5,
                    overflow: 'hidden',
                }}
            >
                <style>{CSS_KEYFRAMES[season]}{`
                    @keyframes atmo_in { from{opacity:0} to{opacity:1} }
                `}</style>

                {particles.map((p, i) => (
                    /*
                     * Two-layer approach:
                     *   Outer div  → horizontal sway (s_sway)
                     *   Inner span → vertical drop / rise (s_drop or s_acc_drop)
                     */
                    <div
                        key={`${season}-${i}`}
                        style={{
                            position: 'absolute',
                            left: `${p.left}%`,
                            top: 0,
                            animation: `s_sway ${p.swayDuration}s ease-in-out ${p.delay}s infinite alternate`,
                        }}
                    >
                        <span
                            style={{
                                display: 'block',
                                fontSize: p.size,
                                filter: meta.glow,
                                animation: `${p.isAccent ? 's_acc_drop' : 's_drop'} ${p.duration}s linear ${p.delay}s infinite`,
                                opacity: 0,
                            }}
                        >
                            {p.emoji}
                        </span>
                    </div>
                ))}
            </div>
        </>
    );
};
