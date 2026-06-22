import React, { useMemo } from 'react';
import { MediaFile } from '../utils/mediaLoader';

interface MediaModalProps {
    media: MediaFile;
    onClose: () => void;
}

// 5 different modal styles with Christmas & Love themes
const modalStyles = [
    // Style 1: Classic Christmas with snowflakes
    {
        name: 'christmas-snowflake',
        containerClass: 'bg-gradient-to-br from-red-900 via-red-800 to-green-900',
        frameClass: 'bg-white border-8 border-red-600 shadow-2xl',
        decorTop: (
            <>
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-6xl">🎄</div>
                <div className="absolute -top-4 left-10 text-4xl animate-pulse">❄️</div>
                <div className="absolute -top-4 right-10 text-4xl animate-pulse" style={{ animationDelay: '0.5s' }}>❄️</div>
            </>
        ),
        decorCorners: (
            <>
                <div className="absolute -top-3 -left-3 text-3xl">🎁</div>
                <div className="absolute -top-3 -right-3 text-3xl">🎁</div>
                <div className="absolute -bottom-3 -left-3 text-3xl">🔔</div>
                <div className="absolute -bottom-3 -right-3 text-3xl">🔔</div>
            </>
        ),
        label: '🎅 Merry Christmas 🎄',
        labelClass: 'text-red-600 font-bold text-xl'
    },

    // Style 2: Love & Hearts
    {
        name: 'love-hearts',
        containerClass: 'bg-gradient-to-br from-pink-900 via-red-900 to-purple-900',
        frameClass: 'bg-gradient-to-b from-pink-50 to-white border-8 border-pink-400 shadow-2xl',
        decorTop: (
            <>
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-7xl animate-bounce">💝</div>
                <div className="absolute -top-5 left-16 text-4xl animate-pulse">💕</div>
                <div className="absolute -top-5 right-16 text-4xl animate-pulse" style={{ animationDelay: '0.3s' }}>💕</div>
            </>
        ),
        decorCorners: (
            <>
                <div className="absolute -top-3 -left-3 text-3xl animate-pulse">❤️</div>
                <div className="absolute -top-3 -right-3 text-3xl animate-pulse" style={{ animationDelay: '0.2s' }}>❤️</div>
                <div className="absolute -bottom-3 -left-3 text-3xl animate-pulse" style={{ animationDelay: '0.4s' }}>💖</div>
                <div className="absolute -bottom-3 -right-3 text-3xl animate-pulse" style={{ animationDelay: '0.6s' }}>💖</div>
            </>
        ),
        label: '❤️ Love & Memories 💕',
        labelClass: 'text-pink-600 font-bold text-xl'
    },

    // Style 3: Gold & Elegant Christmas
    {
        name: 'gold-elegant',
        containerClass: 'bg-gradient-to-br from-yellow-900 via-amber-900 to-yellow-800',
        frameClass: 'bg-gradient-to-b from-amber-50 to-yellow-50 border-8 border-amber-400 shadow-2xl',
        decorTop: (
            <>
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-16 bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-3xl shadow-lg">⭐</div>
                <div className="absolute -top-4 left-8 text-4xl">✨</div>
                <div className="absolute -top-4 right-8 text-4xl">✨</div>
            </>
        ),
        decorCorners: (
            <>
                <div className="absolute top-0 left-0 w-12 h-12 border-t-8 border-l-8 border-yellow-400"></div>
                <div className="absolute top-0 right-0 w-12 h-12 border-t-8 border-r-8 border-yellow-400"></div>
                <div className="absolute bottom-0 left-0 w-12 h-12 border-b-8 border-l-8 border-yellow-400"></div>
                <div className="absolute bottom-0 right-0 w-12 h-12 border-b-8 border-r-8 border-yellow-400"></div>
            </>
        ),
        label: '✨ Precious Moments ✨',
        labelClass: 'text-amber-700 font-serif text-2xl font-bold'
    },

    // Style 4: Winter Wonderland
    {
        name: 'winter-wonderland',
        containerClass: 'bg-gradient-to-br from-blue-900 via-cyan-900 to-blue-800',
        frameClass: 'bg-gradient-to-b from-blue-50 to-cyan-50 border-8 border-cyan-300 shadow-2xl',
        decorTop: (
            <>
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-6xl">⛄</div>
                <div className="absolute -top-3 left-12 text-3xl animate-spin-slow">❄️</div>
                <div className="absolute -top-3 right-12 text-3xl animate-spin-slow" style={{ animationDelay: '1s' }}>❄️</div>
                <div className="absolute top-2 left-24 text-2xl animate-spin-slow" style={{ animationDelay: '2s' }}>❄️</div>
                <div className="absolute top-2 right-24 text-2xl animate-spin-slow" style={{ animationDelay: '3s' }}>❄️</div>
            </>
        ),
        decorCorners: (
            <>
                <div className="absolute -top-3 -left-3 text-3xl">🎿</div>
                <div className="absolute -top-3 -right-3 text-3xl">⛷️</div>
                <div className="absolute -bottom-3 -left-3 text-3xl">🏂</div>
                <div className="absolute -bottom-3 -right-3 text-3xl">⛸️</div>
            </>
        ),
        label: '❄️ Winter Memories ⛄',
        labelClass: 'text-cyan-700 font-bold text-xl'
    },

    // Style 5: Romantic Christmas
    {
        name: 'romantic-christmas',
        containerClass: 'bg-gradient-to-br from-rose-900 via-red-800 to-pink-900',
        frameClass: 'bg-gradient-to-b from-rose-50 via-white to-red-50 border-8 border-rose-400 shadow-2xl',
        decorTop: (
            <>
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex items-center gap-2">
                    <span className="text-5xl">🎄</span>
                    <span className="text-5xl">❤️</span>
                    <span className="text-5xl">🎄</span>
                </div>
            </>
        ),
        decorCorners: (
            <>
                <div className="absolute -top-4 -left-4 text-4xl animate-pulse">💑</div>
                <div className="absolute -top-4 -right-4 text-4xl animate-pulse" style={{ animationDelay: '0.5s' }}>💏</div>
                <div className="absolute -bottom-4 -left-4 text-4xl">🎅</div>
                <div className="absolute -bottom-4 -right-4 text-4xl">🤶</div>
            </>
        ),
        label: '🎄 Love & Christmas 💝',
        labelClass: 'text-rose-600 font-bold text-xl'
    }
];

export const MediaModal: React.FC<MediaModalProps> = ({ media, onClose }) => {
    // Randomly select a modal style each time the modal is opened for this media
    // Using media.filename as dependency ensures a new random choice when opening a different media
    const selectedStyle = useMemo(() => {
        const idx = Math.floor(Math.random() * modalStyles.length);
        return modalStyles[idx];
    }, [media.filename]);

    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center pointer-events-auto cursor-pointer animate-fade-in ${selectedStyle.containerClass}`}
            onClick={onClose}
        >
            {/* Animated snowflakes/hearts background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute text-2xl animate-fall opacity-70"
                        style={{
                            left: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 5}s`,
                            animationDuration: `${5 + Math.random() * 5}s`
                        }}
                    >
                        {selectedStyle.name.includes('love') ? '❤️' : '❄️'}
                    </div>
                ))}
            </div>

            {/* Modal content */}
            <div
                className="relative z-50 transform transition-all duration-500 ease-out animate-scale-in px-2 sm:px-0"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Frame with decorations */}
                <div className={`relative ${selectedStyle.frameClass} p-3 pb-6 sm:p-6 sm:pb-10`} style={{ width: '95vmin', maxWidth: '900px' }}>

                    {/* Top decorations */}
                    <div className="hidden sm:block">
                        {selectedStyle.decorTop}
                    </div>

                    {/* Corner decorations */}
                    <div className="hidden sm:block">
                        {selectedStyle.decorCorners}
                    </div>

                    {/* Media Content */}
                    <div className="w-full bg-gray-100 flex items-center justify-center overflow-hidden rounded-lg shadow-inner" style={{ aspectRatio: '1' }}>
                        {media.type === 'image' ? (
                            <img
                                src={media.url}
                                alt="Memory"
                                className="w-full h-full object-contain"
                            />
                        ) : (
                            <video
                                src={media.url}
                                controls
                                autoPlay
                                loop
                                playsInline
                                className="w-full h-full object-contain bg-black"
                                preload="auto"
                                style={{
                                    imageRendering: 'auto',
                                    willChange: 'transform'
                                }}
                                // Optimize for faster loading
                                controlsList="nodownload"
                            >
                                Your browser does not support video playback.
                            </video>
                        )}
                    </div>

                    {/* Text label */}
                    <div className={`text-center mt-3 sm:mt-6 font-serif ${selectedStyle.labelClass} text-base sm:text-xl`}>
                        {selectedStyle.label}
                    </div>

                    {/* Filename */}
                    <div className="text-center mt-1 sm:mt-2 text-xs sm:text-sm text-gray-500 font-mono">
                        {media.filename}
                    </div>

                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="absolute -top-2 -right-2 sm:-top-4 sm:-right-4 w-10 h-10 sm:w-12 sm:h-12 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xl sm:text-2xl font-bold transition-all hover:scale-110 shadow-lg z-10"
                    >
                        ✕
                    </button>
                </div>

                {/* Close hint */}
                <div className="text-center mt-4 text-sm text-white/80 font-serif">
                    Click outside or press ESC to close
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        @keyframes fall {
          0% {
            transform: translateY(-10vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(110vh) rotate(360deg);
            opacity: 0.3;
          }
        }
        .animate-fall {
          animation: fall linear infinite;
        }
        .animate-spin-slow {
          animation: spin 10s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}} />
        </div>
    );
};
