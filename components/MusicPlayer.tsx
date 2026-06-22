import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';

interface Song {
  title: string;
  artist: string;
  src: string;
  cover: string;
}

const playlist: Song[] = [
  {
    title: 'First snow',
    artist: 'MayDoDo',
    src: '/music/audio00.mp3',
    cover: '/photos/image.png',
  },
  {
    title: 'Last Christmas',
    artist: 'MayDoDo',
    src: '/music/audio6.mp3',
    cover: '/photos/image.png',
  },
  {
    title: 'Last Christmas',
    artist: 'MayDoDo',
    src: '/music/audio.mp3',
    cover: '/photos/image.png',
  },
];

export const MusicPlayer: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement>(null);

  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const song = playlist[index];

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play().catch(() => setIsPlaying(false));

    setIsPlaying(!isPlaying);
  };

  const nextSong = () => {
    setIndex((prev) => (prev + 1) % playlist.length);
    setIsPlaying(true);
  };

  const prevSong = () => {
    setIndex((prev) => (prev - 1 + playlist.length) % playlist.length);
    setIsPlaying(true);
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const { currentTime, duration } = audioRef.current;
    setProgress(duration ? (currentTime / duration) * 100 : 0);
  };

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.load();
    // Set volume to 15% (0.15)
    audioRef.current.volume = 0.15;
    if (isPlaying) {
      audioRef.current.play().catch(() => setIsPlaying(false));
    }
  }, [index]);

  // Set initial volume on mount
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.15;
    }
  }, []);

  return (
    <div className="fixed bottom-4 left-4 z-50 pointer-events-auto">
      <div className="flex items-center gap-3 bg-silver/80 backdrop-blur-md 
                      border border-white/20 rounded-full 
                      px-3 py-2 shadow-lg">

        {/* Cover */}
        <img
          src={song.cover}
          alt="cover"
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover"
        />

        {/* Info + progress (ẨN TRÊN MOBILE) */}
        <div className="hidden sm:flex flex-col min-w-[180px]">
          <span className="text-white text-sm font-semibold truncate">
            {song.title}
          </span>
          <span className="text-white/60 text-xs truncate">
            {song.artist}
          </span>

          <div className="w-full h-[2px] bg-white/20 mt-1">
            <div
              className="h-full bg-white transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Controls desktop */}
        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={prevSong}
            className="text-white/70 hover:text-white transition"
          >
            <SkipBack size={18} />
          </button>

          <button
            onClick={togglePlay}
            className="w-9 h-9 flex items-center justify-center rounded-full 
                       bg-silver text-white hover:scale-110 transition"
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </button>

          <button
            onClick={nextSong}
            className="text-white/70 hover:text-white transition"
          >
            <SkipForward size={18} />
          </button>
        </div>

        {/* Play/Pause MOBILE ONLY */}
        <button
          onClick={togglePlay}
          className="flex sm:hidden w-9 h-9 items-center justify-center 
                     rounded-full bg-silver text-black"
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
        </button>

        {/* Audio */}
        <audio
          ref={audioRef}
          onTimeUpdate={handleTimeUpdate}
          onEnded={nextSong}
          preload="auto"
        >
          <source src={song.src} type="audio/mpeg" />
        </audio>
      </div>
    </div>
  );
};
export default MusicPlayer;