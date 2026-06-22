import React, { useEffect, useState } from 'react';

interface GestureConfirmPopupProps {
  gestureType: 'thumbsup' | 'heart';
  progress: number; // 0 to 5 (number of lights lit)
  onComplete: () => void;
  onCancel: () => void;
}

export const GestureConfirmPopup: React.FC<GestureConfirmPopupProps> = ({
  gestureType,
  progress,
  onComplete,
  onCancel
}) => {
  const [fireworks, setFireworks] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const [lastProgressTime, setLastProgressTime] = useState(Date.now());

  // Track progress changes
  useEffect(() => {
    if (progress > 0) {
      setLastProgressTime(Date.now());
    }
  }, [progress]);

  // Auto-close after 5s of no progress
  useEffect(() => {
    if (progress === 0) return;

    const checkTimeout = setInterval(() => {
      const timeSinceLastProgress = Date.now() - lastProgressTime;
      if (timeSinceLastProgress > 5000) {
        onCancel();
      }
    }, 100);

    return () => clearInterval(checkTimeout);
  }, [progress, lastProgressTime, onCancel]);

  useEffect(() => {
    if (progress >= 5) {
      // Trigger fireworks
      const newFireworks = Array.from({ length: 20 }, (_, i) => ({
        id: Date.now() + i,
        x: Math.random() * 100,
        y: Math.random() * 60 + 20
      }));
      setFireworks(newFireworks);

      // Complete after fireworks animation
      setTimeout(() => {
        onComplete();
      }, 1500);
    }
  }, [progress, onComplete]);

  const getGestureEmoji = () => {
    return gestureType === 'thumbsup' ? '👍' : '✌️';
  };

  const getGestureText = () => {
    return gestureType === 'thumbsup'
      ? 'Uiii, có gì xảy ra nè!'
      : 'Ôi, dấu peace kìa!';
  };

  const lights = Array.from({ length: 5 }, (_, i) => i < progress);

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/20 backdrop-blur-sm"
      onClick={onCancel}
    >
      {/* Popup card */}
      <div
        className="relative bg-gradient-to-br from-yellow-100 via-orange-100 to-red-100 border-4 border-yellow-400 rounded-2xl shadow-2xl p-4 sm:p-8 animate-scale-in max-w-[90vw] sm:max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gesture emoji */}
        <div className="text-center mb-3 sm:mb-4">
          <span className="text-6xl sm:text-8xl animate-bounce-gentle inline-block">
            {getGestureEmoji()}
          </span>
        </div>

        {/* Message */}
        <h2 className="text-xl sm:text-2xl font-bold text-center text-orange-800 mb-2">
          {getGestureText()}
        </h2>
        <p className="text-center text-gray-700 mb-4 sm:mb-6 text-sm sm:text-base">
          Giữ nguyên hiện trạng xem nào...
        </p>

        {/* 5 Progress Lights */}
        <div className="flex justify-center gap-2 sm:gap-4 mb-3 sm:mb-4">
          {lights.map((isLit, index) => (
            <div
              key={index}
              className={`w-8 h-8 sm:w-12 sm:h-12 rounded-full border-2 sm:border-4 transition-all duration-300 ${isLit
                ? 'bg-gradient-to-br from-yellow-300 to-orange-400 border-yellow-500 shadow-lg shadow-yellow-500/50 animate-pulse-light'
                : 'bg-gray-300 border-gray-400'
                }`}
              style={{
                animationDelay: `${index * 0.1}s`
              }}
            >
              {isLit && (
                <div className="w-full h-full rounded-full bg-yellow-200 animate-ping opacity-75"></div>
              )}
            </div>
          ))}
        </div>

        {/* Progress text */}
        <p className="text-center text-orange-600 font-bold text-sm sm:text-base">
          {progress}/5 ✨
        </p>

        {/* Fireworks */}
        {fireworks.map((fw) => (
          <div
            key={fw.id}
            className="absolute pointer-events-none"
            style={{
              left: `${fw.x}%`,
              top: `${fw.y}%`,
            }}
          >
            {/* 12 rays per firework */}
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-8 bg-gradient-to-t from-yellow-400 via-orange-400 to-transparent animate-firework-ray"
                style={{
                  transform: `rotate(${i * 30}deg)`,
                  animationDelay: `${i * 0.05}s`
                }}
              />
            ))}
            {/* Sparkles */}
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={`spark-${i}`}
                className="absolute w-2 h-2 bg-yellow-300 rounded-full animate-sparkle"
                style={{
                  transform: `translate(${Math.cos(i * 45) * 20}px, ${Math.sin(i * 45) * 20}px)`,
                  animationDelay: `${i * 0.1}s`
                }}
              />
            ))}
          </div>
        ))}
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes bounce-gentle {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes pulse-light {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.05);
          }
        }

        @keyframes firework-ray {
          0% {
            height: 0;
            opacity: 1;
          }
          100% {
            height: 60px;
            opacity: 0;
          }
        }

        @keyframes sparkle {
          0% {
            opacity: 1;
            transform: scale(1);
          }
          100% {
            opacity: 0;
            transform: scale(0);
          }
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-bounce-gentle {
          animation: bounce-gentle 2s ease-in-out infinite;
        }

        .animate-pulse-light {
          animation: pulse-light 1.5s ease-in-out infinite;
        }

        .animate-firework-ray {
          animation: firework-ray 0.8s ease-out forwards;
        }

        .animate-sparkle {
          animation: sparkle 1s ease-out forwards;
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};
