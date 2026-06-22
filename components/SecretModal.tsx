import React, { useState, useEffect } from 'react';

interface SecretMedia {
    filename: string;
    url: string;
    type: 'image' | 'video';
}

interface SecretModalProps {
    onClose: () => void;
}

// Hardcoded secret files
const SECRET_FILES: SecretMedia[] = [
    { filename: '1.jpg', url: '/secret/1.jpg', type: 'image' },
    { filename: '2.MOV', url: '/secret/2.MOV', type: 'video' }
];

export const SecretModal: React.FC<SecretModalProps> = ({ onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);

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
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isTransitioning]);

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-br from-pink-900 via-red-900 to-rose-900 animate-fade-in"
            onClick={onClose}
            onTouchStart={onClose}
        >
            {/* Animated floating hearts background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(30)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute text-4xl animate-float-heart opacity-60"
                        style={{
                            left: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 5}s`,
                            animationDuration: `${8 + Math.random() * 4}s`
                        }}
                    >
                        {['❤️', '💕', '💖', '💝', '💗'][Math.floor(Math.random() * 5)]}
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
                    <h1 className="text-[clamp(1.75rem,4.5vw,4.5rem)] font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-200 via-red-200 to-rose-200 font-serif mb-1 sm:mb-2">
                        💝 Secret Love 💝
                    </h1>
                    <p className="text-[clamp(1rem,2.5vw,1.75rem)] text-pink-200 font-script tracking-wider">
                        ANHISP & QANH
                    </p>
                    <div className="flex justify-center gap-2 sm:gap-4 mt-1 sm:mt-2 text-lg sm:text-2xl">
                        <span className="animate-bounce" style={{ animationDelay: '0s' }}>❤️</span>
                        <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>💕</span>
                        <span className="animate-bounce" style={{ animationDelay: '0.4s' }}>💖</span>
                    </div>
                </div>

                {/* Media Container with Love Frame */}
                <div className="relative bg-gradient-to-br from-pink-100 via-white to-rose-100 p-3 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl shadow-2xl border-4 sm:border-6 md:border-8 border-pink-400">
                    {/* Decorative corners */}
                    <div className="absolute -top-3 -left-3 sm:-top-6 sm:-left-6 text-3xl sm:text-5xl md:text-6xl animate-spin-slow">💝</div>
                    <div className="absolute -top-3 -right-3 sm:-top-6 sm:-right-6 text-3xl sm:text-5xl md:text-6xl animate-spin-slow" style={{ animationDelay: '1s' }}>💖</div>
                    <div className="absolute -bottom-3 -left-3 sm:-bottom-6 sm:-left-6 text-3xl sm:text-5xl md:text-6xl animate-spin-slow" style={{ animationDelay: '2s' }}>💗</div>
                    <div className="absolute -bottom-3 -right-3 sm:-bottom-6 sm:-right-6 text-3xl sm:text-5xl md:text-6xl animate-spin-slow" style={{ animationDelay: '3s' }}>💕</div>

                    {/* Media Display - Optimized for Vertical Content */}
                    <div
                        className={`relative w-full flex justify-center items-center rounded-xl sm:rounded-2xl overflow-hidden shadow-inner transition-all duration-300 ${isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                            } flex-shrink-0`}
                        style={{
                            height: 'min(calc(var(--vh, 1vh) * 100 - 200px), 700px)',
                            maxHeight: '80vh',
                            minHeight: '220px'
                        }}
                    >
                        <div className="w-full h-full flex justify-center items-center bg-gradient-to-br from-black/5 to-pink-50/10">
                            {currentMedia.type === 'image' ? (
                                <img
                                    src={currentMedia.url}
                                    alt="Secret memory"
                                    className="max-w-full max-h-full object-contain"
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
                                    className="max-w-full max-h-full object-contain"
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

                    {/* Navigation Controls */}
                    <div className="flex justify-between items-center mt-3 sm:mt-4 md:mt-6">
                        {/* Previous Button */}
                        <button
                            onClick={handlePrev}
                            disabled={isTransitioning}
                            className="group flex items-center gap-1 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2.5 md:px-6 md:py-3 bg-gradient-to-r from-pink-400 to-red-400 text-white rounded-full font-bold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                        >
                            <span className="text-lg sm:text-xl md:text-2xl">⬅️</span>
                            <span className="hidden sm:inline">Previous</span>
                        </button>

                        {/* Counter */}
                        <div className="flex items-center gap-2 sm:gap-3">
                            {SECRET_FILES.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => !isTransitioning && setCurrentIndex(idx)}
                                    className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full transition-all duration-300 ${idx === currentIndex
                                        ? 'bg-pink-500 scale-125 shadow-lg'
                                        : 'bg-pink-300 hover:bg-pink-400 hover:scale-110'
                                        }`}
                                />
                            ))}
                        </div>

                        {/* Next Button */}
                        <button
                            onClick={handleNext}
                            disabled={isTransitioning}
                            className="group flex items-center gap-1 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2.5 md:px-6 md:py-3 bg-gradient-to-r from-red-400 to-pink-400 text-white rounded-full font-bold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                        >
                            <span className="hidden sm:inline">Next</span>
                            <span className="text-lg sm:text-xl md:text-2xl">➡️</span>
                        </button>
                    </div>
                </div>

                {/* Close Button */}
                {/* Close button: fixed on small screens, absolute inside modal on md+ */}
                <button
                    onClick={onClose}
                    onTouchStart={onClose}
                    aria-label="Close modal"
                    className="fixed md:absolute top-4 right-4 md:top-3 md:right-3 z-50 w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-pink-500 to-red-500 text-white rounded-full font-bold text-2xl sm:text-3xl shadow-2xl hover:shadow-pink-500/50 hover:scale-110 hover:rotate-90 active:scale-95 transition-all duration-300 flex items-center justify-center"
                >
                    ×
                </button>

                {/* Bottom Decorative Text */}
                <div className="text-center mt-3 sm:mt-4 md:mt-6">
                    <p className="text-pink-200 text-lg sm:text-xl md:text-2xl font-script animate-pulse-slow">
                        ❤️ Our Secret Love ❤️
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
                        opacity: 0.6;
                    }
                    90% {
                        opacity: 0.6;
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

                .animate-float-heart {
                    animation: float-heart linear infinite;
                }

                .animate-pulse-slow {
                    animation: pulse-slow 3s ease-in-out infinite;
                }

                .animate-spin-slow {
                    animation: spin-slow 8s linear infinite;
                }

                .font-script {
                    font-family: 'Brush Script MT', cursive;
                }
            `}</style>
        </div>
    );
};
