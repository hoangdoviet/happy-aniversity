import React from 'react';
import { SceneState } from '../types';

interface MonthOverlayProps {
    currentMonth: number; // 1–12, or 0 for heart
    monthTitle: string;
    monthDescription: string;
    mode: SceneState;
    onNextMonth: () => void;
    onToggleMode: () => void;
    coupleNames: string;
    isTransitioning: boolean;
}

const MONTH_NAMES = [
    '', // placeholder so index 1 = January
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4',
    'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8',
    'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
];

export const MonthOverlay: React.FC<MonthOverlayProps> = ({
    currentMonth,
    monthTitle,
    monthDescription,
    mode,
    onNextMonth,
    onToggleMode,
    coupleNames,
    isTransitioning,
}) => {
    const isHeart = currentMonth === 0;
    const isFormed = mode === SceneState.FORMED;

    const displayTitle = isHeart
        ? '❤️ 1 Năm Yêu Nhau'
        : (monthTitle || MONTH_NAMES[currentMonth] || `Tháng ${currentMonth}`);

    return (
        <div className="absolute inset-0 pointer-events-none z-10 flex flex-col">
            {/* ── Top header ── */}
            <header className="flex flex-col items-center pt-7 gap-1">
                <p className="text-sm tracking-[0.3em] uppercase text-pink-300 opacity-70 font-light">
                    {coupleNames}
                </p>
                <h1
                    className="text-4xl md:text-6xl font-bold font-serif text-transparent bg-clip-text
            bg-gradient-to-r from-[#D4AF37] via-[#FFB6C1] to-[#D4AF37] drop-shadow-lg
            transition-all duration-700"
                >
                    {displayTitle}
                </h1>
                {monthDescription && (
                    <p className="text-sm md:text-base text-pink-200 opacity-80 max-w-md text-center px-4 mt-1">
                        {monthDescription}
                    </p>
                )}
            </header>

            {/* ── Month progress dots ── */}
            {!isHeart && (
                <div className="flex justify-center gap-2 mt-3">
                    {Array.from({ length: 12 }, (_, i) => {
                        const m = i + 1;
                        const isPast = m < currentMonth;
                        const isCurrent = m === currentMonth;
                        return (
                            <div
                                key={m}
                                className={`rounded-full transition-all duration-500 ${isCurrent
                                    ? 'w-3 h-3 bg-pink-400 shadow-[0_0_8px_#FF69B4]'
                                    : isPast
                                        ? 'w-2 h-2 bg-[#D4AF37] opacity-70'
                                        : 'w-2 h-2 bg-white opacity-20'
                                    }`}
                            />
                        );
                    })}
                </div>
            )}

            {/* ── Spacer ── */}
            <div className="flex-1" />

            {/* ── Bottom controls ── */}
            <div className="flex flex-col items-center gap-3 pb-8 pointer-events-auto">
                {/* Gesture mode toggle */}
                <button
                    onClick={onToggleMode}
                    className={`px-5 py-2 rounded-full text-sm font-semibold border transition-all duration-300
            ${isFormed
                            ? 'border-pink-400 text-pink-300 hover:bg-pink-400/20'
                            : 'border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/10 hover:bg-[#D4AF37]/25'
                        }`}
                >
                    {isFormed ? '✋ Giải phóng hỗn loạn' : '✊ Hội tụ lại'}
                </button>

                {/* Next month / Finish button */}
                {!isTransitioning && (
                    <button
                        onClick={onNextMonth}
                        className="px-8 py-3 rounded-full font-bold text-base
              bg-gradient-to-r from-pink-500 to-rose-500
              text-white shadow-lg hover:shadow-pink-500/50
              hover:scale-105 active:scale-95 transition-all duration-200
              border border-pink-300/30"
                    >
                        {isHeart
                            ? '🔁 Xem lại từ đầu'
                            : currentMonth === 12
                                ? '❤️ Kỉ niệm 1 năm →'
                                : `Tháng ${currentMonth + 1} →`}
                    </button>
                )}

                {isTransitioning && (
                    <div className="flex gap-1 items-center text-pink-300 text-sm">
                        <span className="animate-pulse">✦</span>
                        <span>Đang chuyển...</span>
                        <span className="animate-pulse">✦</span>
                    </div>
                )}

                {/* Mobile swipe hint — only shown on touch screens */}
                <p className="sm:hidden text-[10px] text-pink-500/50 tracking-widest mt-1 select-none">
                    vuốt lên để chuyển tháng
                </p>
            </div>
        </div>
    );
};
