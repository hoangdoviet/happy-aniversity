import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Music } from 'lucide-react';

interface MusicPlayerProps {
  playlist: string[]; // relative paths or filenames, e.g. ["song1.mp3", "song2.mp3"]
  currentTrackIndex: number;
  onTrackChange: (index: number) => void;
  overrideMusic: string | null; // filename relative to /public/music/ (or null if none)
}

export const MusicPlayer: React.FC<MusicPlayerProps> = ({
  playlist,
  currentTrackIndex,
  onTrackChange,
  overrideMusic,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  // Determine active track src
  // File paths are served at /music/<filename>
  const activeSrc = overrideMusic 
    ? `/music/${overrideMusic}` 
    : playlist.length > 0 
      ? `/music/${playlist[currentTrackIndex]}` 
      : null;

  // Clean filename for display (remove path & extension)
  const displayTitle = overrideMusic
    ? overrideMusic.replace(/\.[^/.]+$/, "")
    : playlist.length > 0 && playlist[currentTrackIndex]
      ? playlist[currentTrackIndex].replace(/\.[^/.]+$/, "")
      : "Không có nhạc";

  const displaySubtitle = overrideMusic
    ? "🎵 Nhạc chủ đề tháng"
    : playlist.length > 0
      ? `🎵 Nhạc phát chung (${currentTrackIndex + 1}/${playlist.length})`
      : "Chưa thiết lập playlist";

  const togglePlay = () => {
    if (!audioRef.current || !activeSrc) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.warn("Autoplay blocked or play interrupted:", err);
          setIsPlaying(false);
        });
    }
  };

  const nextSong = () => {
    if (overrideMusic || playlist.length <= 1) return;
    onTrackChange((currentTrackIndex + 1) % playlist.length);
  };

  const prevSong = () => {
    if (overrideMusic || playlist.length <= 1) return;
    onTrackChange((currentTrackIndex - 1 + playlist.length) % playlist.length);
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const { currentTime, duration } = audioRef.current;
    setProgress(duration ? (currentTime / duration) * 100 : 0);
  };

  const handleEnded = () => {
    if (overrideMusic) {
      // Month-specific music loops automatically
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => setIsPlaying(false));
      }
    } else {
      // Global playlist advances to next track
      nextSong();
    }
  };

  // When source changes, load and play if we were playing or if it is a new source
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.load();
    audioRef.current.volume = 0.35; // moderate romantic volume

    if (activeSrc) {
      // Auto-play when month/track changes
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          // Keep isPlaying false if autoplay was blocked
          setIsPlaying(false);
        });
    } else {
      setIsPlaying(false);
    }
  }, [activeSrc]);

  return (
    <div className="fixed bottom-4 left-4 z-50 pointer-events-auto">
      <div className="flex items-center gap-3 bg-[#120020]/90 backdrop-blur-md 
                      border border-pink-500/30 rounded-2xl 
                      px-4 py-2.5 shadow-[0_0_15px_rgba(255,105,180,0.2)]">

        {/* Rotating Music Disc Icon */}
        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-tr from-pink-600 to-purple-800 
                         flex items-center justify-center border border-pink-400/40 shadow-inner
                         ${isPlaying ? 'animate-spin' : ''}`}
             style={{ animationDuration: '6s' }}>
          <Music className="text-pink-200" size={20} />
        </div>

        {/* Info + progress */}
        <div className="flex flex-col min-w-[150px] max-w-[200px] sm:min-w-[180px]">
          <span className="text-white text-xs sm:text-sm font-semibold truncate" title={displayTitle}>
            {displayTitle}
          </span>
          <span className="text-pink-300/70 text-[10px] sm:text-xs truncate">
            {displaySubtitle}
          </span>

          {activeSrc && (
            <div className="w-full h-[3px] bg-pink-950 rounded-full mt-1.5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-pink-500 to-rose-400 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>

        {/* Controls */}
        {activeSrc && (
          <div className="flex items-center gap-1.5 ml-2">
            {!overrideMusic && playlist.length > 1 && (
              <button
                onClick={prevSong}
                className="text-pink-400/70 hover:text-pink-200 hover:scale-115 active:scale-95 transition p-1"
                title="Bài trước"
              >
                <SkipBack size={16} />
              </button>
            )}

            <button
              onClick={togglePlay}
              className="w-8 h-8 flex items-center justify-center rounded-full 
                         bg-gradient-to-r from-pink-500 to-rose-500 text-white 
                         hover:scale-110 hover:shadow-[0_0_8px_#FF69B4] active:scale-95 transition"
              title={isPlaying ? "Tạm dừng" : "Phát"}
            >
              {isPlaying ? <Pause size={15} fill="white" /> : <Play size={15} fill="white" className="ml-0.5" />}
            </button>

            {!overrideMusic && playlist.length > 1 && (
              <button
                onClick={nextSong}
                className="text-pink-400/70 hover:text-pink-200 hover:scale-115 active:scale-95 transition p-1"
                title="Bài tiếp theo"
              >
                <SkipForward size={16} />
              </button>
            )}
          </div>
        )}

        {/* Audio Element */}
        {activeSrc && (
          <audio
            ref={audioRef}
            src={activeSrc}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
            preload="auto"
            loop={!!overrideMusic || playlist.length === 1}
          />
        )}
      </div>
    </div>
  );
};

export default MusicPlayer;