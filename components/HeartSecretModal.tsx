import React, { useState, useEffect, useRef } from 'react';

interface SecretMedia {
    filename: string;
    url: string;
    type: 'image' | 'video';
}

interface HeartSecretModalProps {
    onClose: () => void;
    handPosition?: { x: number; y: number; detected: boolean };
    isFistDetected?: boolean;
}

// Hardcoded secret files from public/secret2 and public/photos and public/secret
const SECRET_FILES: SecretMedia[] = [
    { filename: '1.MOV', url: '/secret2/1.MOV', type: 'video' },
    { filename: '2.MOV', url: '/secret2/2.MOV', type: 'video' },
    { filename: '1.jpg', url: '/secret/1.jpg', type: 'image' },
    { filename: '2.MOV', url: '/secret/2.MOV', type: 'video' },
    { filename: '1.mp4', url: '/photos/1.mp4', type: 'video' },
    { filename: '2.mp4', url: '/photos/2.mp4', type: 'video' },
    { filename: '3.png', url: '/photos/3.png', type: 'image' },
    { filename: '4.png', url: '/photos/4.png', type: 'image' },
    { filename: '5.mp4', url: '/photos/5.mp4', type: 'video' },
    { filename: '19.MOV', url: '/photos/19.MOV', type: 'video' },
    { filename: '20.jpg', url: '/photos/20.jpg', type: 'image' },
    { filename: '21.jpg', url: '/photos/21.jpg', type: 'image' },
    { filename: 'image.png', url: '/photos/image.png', type: 'image' },
];

export const HeartSecretModal: React.FC<HeartSecretModalProps> = ({ onClose, handPosition, isFistDetected }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [isZoomed, setIsZoomed] = useState(false);
    const [gestureHint, setGestureHint] = useState<string>('');

    // Gesture detection refs
    const fistHoldFrames = useRef(0);
    const swipeStartX = useRef<number | null>(null);
    const lastSwipeTime = useRef(0);
    const FIST_HOLD_THRESHOLD = 30; // 1 second at 30fps
    const SWIPE_THRESHOLD = 0.15; // 15% of screen width
    const SWIPE_COOLDOWN = 800; // ms between swipes

    const currentMedia = SECRET_FILES[currentIndex];

    // Set CSS --vh to handle mobile browser chrome and prevent background scroll while modal is open
    useEffect(() => {
        const setVh = () => document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
        setVh();
        window.addEventListener('resize', setVh);
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            window.removeEventListener('resize', setVh);
            document.body.style.overflow = prevOverflow;
        };
    }, []);

    const handleNext = () => {
        if (isTransitioning) return;
        setIsTransitioning(true);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev + 1) % SECRET_FILES.length);
            setIsTransitioning(false);
        }, 300);
    };

    const handlePrev = () => {
        if (isTransitioning) return;
        setIsTransitioning(true);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev - 1 + SECRET_FILES.length) % SECRET_FILES.length);
            setIsTransitioning(false);
        }, 300);
    };

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') handlePrev();
            if (e.key === 'ArrowRight') handleNext();
            if (e.key === 'Escape') onClose();
            if (e.key === 'Enter' || e.key === ' ') {
                if (isZoomed) {
                    setIsZoomed(false);
                } else {
                    setIsZoomed(true);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isTransitioning, isZoomed]);

    // Gesture control for HeartSecretModal
    useEffect(() => {
        if (!handPosition || !handPosition.detected) {
            fistHoldFrames.current = 0;
            swipeStartX.current = null;
            setGestureHint('');
            return;
        }

        const { x } = handPosition;
        const now = Date.now();

        // FIST DETECTION for zoom toggle
        if (isFistDetected) {
            fistHoldFrames.current++;

            if (fistHoldFrames.current >= FIST_HOLD_THRESHOLD) {
                if (!isZoomed) {
                    setIsZoomed(true);
                    setGestureHint('🔍 Zoom In');
                    fistHoldFrames.current = 0;
                    setTimeout(() => setGestureHint(''), 1000);
                }
            } else if (fistHoldFrames.current > 5) {
                // Show progress hint
                setGestureHint(`✊ Giữ lại... ${Math.floor((fistHoldFrames.current / FIST_HOLD_THRESHOLD) * 100)}%`);
            }
        } else {
            // Hand is open - potential swipe or zoom out
            if (isZoomed && fistHoldFrames.current > 0) {
                // User opened hand after fist - zoom out
                setIsZoomed(false);
                setGestureHint('👁️ Zoom Out');
                setTimeout(() => setGestureHint(''), 1000);
            }
            fistHoldFrames.current = 0;

            // SWIPE DETECTION for next/prev (only when not zoomed)
            if (!isZoomed && now - lastSwipeTime.current > SWIPE_COOLDOWN) {
                if (swipeStartX.current === null) {
                    swipeStartX.current = x;
                } else {
                    const deltaX = x - swipeStartX.current;

                    if (Math.abs(deltaX) > SWIPE_THRESHOLD) {
                        if (deltaX > 0) {
                            // Swipe right -> Previous
                            handlePrev();
                            setGestureHint('⬅️ Previous');
                            lastSwipeTime.current = now;
                        } else {
                            // Swipe left -> Next
                            handleNext();
                            setGestureHint('➡️ Next');
                            lastSwipeTime.current = now;
                        }
                        swipeStartX.current = null;
                        setTimeout(() => setGestureHint(''), 1000);
                    }
                }
            }
        }

    }, [handPosition, isFistDetected, isZoomed, isTransitioning]);

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-br from-purple-900 via-fuchsia-900 to-pink-900 animate-fade-in"
            onClick={onClose}
            onTouchStart={onClose}
        >
            {/* Animated floating sparkles background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(40)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute animate-float-heart opacity-70"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 5}s`,
                            animationDuration: `${6 + Math.random() * 4}s`,
                            fontSize: `${20 + Math.random() * 20}px`
                        }}
                    >
                        {['✨', '💫', '⭐', '🌟', '💖', '💕', '💝'][Math.floor(Math.random() * 7)]}
                    </div>
                ))}
            </div>

            {/* Secret Content */}
            <div
                className="relative z-50 w-[95vw] sm:w-[85vw] md:w-[75vw] lg:w-[60vw] max-w-2xl px-2 sm:px-0 py-4 sm:py-6 max-h-[calc(var(--vh,1vh)*100-80px)] overflow-auto"
                onClick={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
            >
                {/* Top Title */}
                <div className="text-center mb-3 sm:mb-6 animate-pulse-slow">
                    <h1 className="text-[clamp(1.75rem,4.5vw,5rem)] font-bold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-200 via-pink-200 to-purple-200 font-serif mb-2 sm:mb-3 drop-shadow-2xl">
                        💖 Forever & Always 💖
                    </h1>
                    <p className="text-[clamp(1rem,2.5vw,1.9rem)] text-fuchsia-200 font-script tracking-widest animate-shimmer">
                        Love Beyond Time
                    </p>
                    <div className="flex justify-center gap-2 sm:gap-3 md:gap-5 mt-2 sm:mt-3 text-xl sm:text-2xl md:text-3xl">
                        <span className="animate-bounce" style={{ animationDelay: '0s' }}>💕</span>
                        <span className="animate-bounce" style={{ animationDelay: '0.15s' }}>💖</span>
                        <span className="animate-bounce" style={{ animationDelay: '0.3s' }}>💝</span>
                        <span className="animate-bounce" style={{ animationDelay: '0.45s' }}>💗</span>
                        <span className="animate-bounce" style={{ animationDelay: '0.6s' }}>💓</span>
                    </div>
                </div>

                {/* Media Container with Purple/Pink Gradient Frame */}
                <div className="relative bg-gradient-to-br from-purple-100 via-pink-50 to-fuchsia-100 p-4 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl shadow-2xl border-4 sm:border-6 md:border-8 border-fuchsia-400">
                    {/* Decorative corners */}
                    <div className="absolute -top-2 -left-2 sm:-top-4 sm:-left-4 text-3xl sm:text-4xl md:text-5xl animate-spin-slow">💝</div>
                    <div className="absolute -top-2 -right-2 sm:-top-4 sm:-right-4 text-3xl sm:text-4xl md:text-5xl animate-spin-slow" style={{ animationDelay: '1s' }}>💖</div>
                    <div className="absolute -bottom-2 -left-2 sm:-bottom-4 sm:-left-4 text-3xl sm:text-4xl md:text-5xl animate-spin-slow" style={{ animationDelay: '2s' }}>💗</div>
                    <div className="absolute -bottom-2 -right-2 sm:-bottom-4 sm:-right-4 text-3xl sm:text-4xl md:text-5xl animate-spin-slow" style={{ animationDelay: '3s' }}>💕</div>

                    {/* Media Display - Optimized for Vertical Content */}
                    <div
                        className={`relative w-full flex justify-center items-center rounded-xl sm:rounded-2xl overflow-hidden shadow-inner transition-all duration-500 ${isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                            } ${isZoomed ? 'scale-150 z-50' : 'scale-100'} flex-shrink-0`}
                        onClick={() => setIsZoomed(!isZoomed)}
                        style={{
                            height: 'min(calc(var(--vh, 1vh) * 100 - 200px), 700px)',
                            maxHeight: '80vh',
                            minHeight: '220px'
                        }}
                    >
                        <div className="w-full h-full flex justify-center items-center bg-gradient-to-br from-black/5 to-fuchsia-50/10">
                            {currentMedia.type === 'image' ? (
                                <img
                                    src={currentMedia.url}
                                    alt="Secret memory"
                                    className={`max-w-full max-h-full transition-all duration-500 ${isZoomed ? 'object-cover cursor-zoom-out' : 'object-contain cursor-zoom-in'
                                        }`}
                                    style={{
                                        width: 'auto',
                                        height: 'auto',
                                        maxWidth: '100%',
                                        maxHeight: '100%'
                                    }}
                                />
                            ) : (
                                <video
                                    src={currentMedia.url}
                                    controls
                                    autoPlay
                                    loop
                                    className={`max-w-full max-h-full transition-all duration-500 ${isZoomed ? 'object-cover' : 'object-contain'
                                        }`}
                                    style={{
                                        width: 'auto',
                                        height: 'auto',
                                        maxWidth: '100%',
                                        maxHeight: '100%'
                                    }}
                                    preload="auto"
                                />
                            )}
                        </div>
                    </div>

                    {/* Gesture Hint Overlay */}
                    {gestureHint && (
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/80 text-white px-6 py-3 rounded-full text-2xl font-bold animate-pulse-slow pointer-events-none z-50">
                            {gestureHint}
                        </div>
                    )}

                    {/* Gesture Instructions */}
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-fuchsia-500/90 text-white px-4 py-2 rounded-full text-xs sm:text-sm font-semibold shadow-lg pointer-events-none z-30">
                        ✊ Nắm tay: Zoom | ✋ Mở tay: Zoom out | 👆 Vuốt: Chuyển ảnh
                    </div>

                    {/* Navigation Controls */}
                    <div className="flex justify-between items-center mt-3 sm:mt-4 md:mt-6">
                        {/* Previous Button */}
                        <button
                            onClick={handlePrev}
                            disabled={isTransitioning}
                            className="group flex items-center gap-1 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2.5 md:px-6 md:py-3 bg-gradient-to-r from-fuchsia-400 to-pink-400 text-white rounded-full font-bold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                        >
                            <span className="text-lg sm:text-xl md:text-2xl group-hover:animate-bounce-horizontal">⬅️</span>
                            <span className="hidden sm:inline">Previous</span>
                        </button>

                        {/* Counter */}
                        <div className="flex items-center gap-2 sm:gap-3">
                            {SECRET_FILES.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => !isTransitioning && setCurrentIndex(idx)}
                                    className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full transition-all duration-300 ${idx === currentIndex
                                        ? 'bg-fuchsia-500 scale-125 shadow-lg'
                                        : 'bg-fuchsia-300 hover:bg-fuchsia-400 hover:scale-110'
                                        }`}
                                />
                            ))}
                        </div>

                        {/* Next Button */}
                        <button
                            onClick={handleNext}
                            disabled={isTransitioning}
                            className="group flex items-center gap-1 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2.5 md:px-6 md:py-3 bg-gradient-to-r from-pink-400 to-fuchsia-400 text-white rounded-full font-bold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                        >
                            <span className="hidden sm:inline">Next</span>
                            <span className="text-lg sm:text-xl md:text-2xl group-hover:animate-bounce-horizontal">➡️</span>
                        </button>
                    </div>
                </div>

                {/* Close Button: fixed on small screens, absolute inside modal on md+ */}
                <button
                    onClick={onClose}
                    onTouchStart={onClose}
                    aria-label="Close modal"
                    className="fixed md:absolute top-4 right-4 md:top-3 md:right-3 z-50 w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-fuchsia-500 to-pink-500 text-white rounded-full font-bold text-2xl sm:text-3xl shadow-2xl hover:shadow-fuchsia-500/50 hover:scale-110 hover:rotate-90 active:scale-95 transition-all duration-300 flex items-center justify-center"
                >
                    ×
                </button>

                {/* Bottom Decorative Text */}
                <div className="text-center mt-3 sm:mt-4 md:mt-6">
                    <p className="text-fuchsia-200 text-lg sm:text-xl md:text-2xl font-script animate-pulse-slow">
                        ✨ Our Eternal Love Story ✨
                    </p>
                </div>
            </div>

            {/* Custom CSS Animations */}
            <style>{`
                @keyframes float-heart {
                    0%, 100% {
                        transform: translateY(100vh) rotate(0deg);
                        opacity: 0;
                    }
                    10% {
                        opacity: 0.7;
                    }
                    90% {
                        opacity: 0.7;
                    }
                    100% {
                        transform: translateY(-20vh) rotate(360deg);
                        opacity: 0;
                    }
                }

                @keyframes pulse-slow {
                    0%, 100% {
                        opacity: 1;
                        transform: scale(1);
                    }
                    50% {
                        opacity: 0.9;
                        transform: scale(1.02);
                    }
                }

                @keyframes spin-slow {
                    from {
                        transform: rotate(0deg);
                    }
                    to {
                        transform: rotate(360deg);
                    }
                }

                @keyframes bounce-horizontal {
                    0%, 100% {
                        transform: translateX(0);
                    }
                    50% {
                        transform: translateX(-5px);
                    }
                }

                @keyframes shimmer {
                    0%, 100% {
                        text-shadow: 0 0 10px rgba(236, 72, 153, 0.5);
                    }
                    50% {
                        text-shadow: 0 0 20px rgba(236, 72, 153, 0.8), 0 0 30px rgba(236, 72, 153, 0.6);
                    }
                }

                .animate-float-heart {
                    animation: float-heart linear infinite;
                }

                .animate-pulse-slow {
                    animation: pulse-slow 3s ease-in-out infinite;
                }

                .animate-spin-slow {
                    animation: spin-slow 8s linear infinite;
                }

                .group:hover .group-hover\\:animate-bounce-horizontal {
                    animation: bounce-horizontal 0.5s ease-in-out infinite;
                }

                .animate-shimmer {
                    animation: shimmer 2s ease-in-out infinite;
                }

                .animate-fade-in {
                    animation: fadeIn 0.3s ease-out;
                }

                @keyframes fadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }
            `}</style>
        </div>
    );
};
