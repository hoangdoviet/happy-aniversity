import React, { useState, Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Loader } from '@react-three/drei';
import { Experience } from './components/Experience';
import { UIOverlay } from './components/UIOverlay';
import { GestureController } from './components/GestureController';
import { TreeMode } from './types';
import { MusicPlayer } from './components/MusicPlayer';
import { loadMediaFilesFromManifest, MediaFile } from './utils/mediaLoader';
import { MediaModal } from './components/MediaModal';
import { SecretModal } from './components/SecretModal';
import { HeartSecretModal } from './components/HeartSecretModal';
import { GestureConfirmPopup } from './components/GestureConfirmPopup';
import { GestureGuide } from './components/GestureGuide';
import { HandCursor } from './components/HandCursor';

// Simple Error Boundary to catch 3D resource loading errors (like textures)
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; message?: string; stack?: string }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, message: error?.message };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Error loading 3D scene:", error, errorInfo);
    this.setState({ message: error?.message, stack: errorInfo?.componentStack });
  }

  render() {
    if (this.state.hasError) {
      // You can customize this fallback UI
      return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 text-[#D4AF37] font-serif p-6 text-center">
          <div className="max-w-2xl">
            <h2 className="text-2xl mb-2">Something went wrong</h2>
            <p className="opacity-70 mb-4">A resource failed to load (likely a missing image or texture). Check the console for details.</p>
            {this.state.message && (
              <details className="text-left bg-black/30 p-3 rounded mb-3">
                <summary className="cursor-pointer font-semibold">Error details (click to expand)</summary>
                <pre className="text-xs text-left mt-2 whitespace-pre-wrap">{this.state.message}</pre>
                {this.state.stack && <pre className="text-xs mt-2 whitespace-pre-wrap">{this.state.stack}</pre>}
              </details>
            )}
            <div className="flex justify-center gap-3">
              <button
                onClick={() => this.setState({ hasError: false, message: undefined, stack: undefined })}
                className="px-4 py-2 border border-[#D4AF37] hover:bg-[#D4AF37] hover:text-black transition-colors rounded"
              >
                Try Again
              </button>
              <button
                onClick={() => window.open('https://github.com/hoangdoviet/Chrismas/issues/new', '_blank')}
                className="px-4 py-2 bg-red-600 text-white rounded hover:opacity-90"
              >
                Report Issue
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  const [mode, setMode] = useState<TreeMode>(TreeMode.FORMED);
  const [handPosition, setHandPosition] = useState<{ x: number; y: number; detected: boolean }>({ x: 0.5, y: 0.5, detected: false });
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [twoHandsDetected, setTwoHandsDetected] = useState(false);
  const [closestMedia, setClosestMedia] = useState<MediaFile | null>(null);
  const [showThumbsUpSecret, setShowThumbsUpSecret] = useState(false);
  const [showHeartSecret, setShowHeartSecret] = useState(false);
  const [isFistDetected, setIsFistDetected] = useState(false);
  const [hoveredMedia, setHoveredMedia] = useState<MediaFile | null>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number; detected: boolean }>({ x: 0.5, y: 0.5, detected: false });
  const [cursorPressed, setCursorPressed] = useState(false);

  // Gesture confirmation states
  const [showThumbsUpConfirm, setShowThumbsUpConfirm] = useState(false);
  const [thumbsUpProgress, setThumbsUpProgress] = useState(0);
  const [showHeartConfirm, setShowHeartConfirm] = useState(false);
  const [heartProgress, setHeartProgress] = useState(0);

  // Load media files from public/photos on mount
  useEffect(() => {
    loadMediaFilesFromManifest().then(files => {
      console.log('Loaded media files:', files);
      setMediaFiles(files);
    });
  }, []);

  const toggleMode = () => {
    setMode((prev) => (prev === TreeMode.FORMED ? TreeMode.CHAOS : TreeMode.FORMED));
  };

  const handleHandPosition = (x: number, y: number, detected: boolean) => {
    setHandPosition({ x, y, detected });
  };

  const handleTwoHandsDetected = (detected: boolean) => {
    setTwoHandsDetected(detected);
  };

  const handleClosestMediaChange = (media: MediaFile | null) => {
    // Only set closestMedia when triggered by click, not by two-hand detection
    if (media) {
      setClosestMedia(media);
    }
  };

  const handleQuickThumbsUp = () => {
    // When user does quick thumbs up (1s), open the first/random photo
    // In Chaos mode, we can open a random photo or the first one
    if (mediaFiles.length > 0 && mode === TreeMode.CHAOS) {
      // Pick a random photo to show
      const randomIndex = Math.floor(Math.random() * mediaFiles.length);
      setClosestMedia(mediaFiles[randomIndex]);
    }
  };

  const handlePointing = () => {
    // When user points (index finger), open the hovered photo
    if (hoveredMedia && mode === TreeMode.CHAOS) {
      setClosestMedia(hoveredMedia);
    }
  };

  const handleHoveredMediaChange = (media: MediaFile | null) => {
    setHoveredMedia(media);
  };

  const handleCursorMove = (x: number, y: number, detected: boolean) => {
    setCursor({ x, y, detected });
  };

  const handlePointerDown = () => setCursorPressed(true);
  const handlePointerUp = () => setCursorPressed(false);

  const handleThumbsUpProgress = (progress: number) => {
    setThumbsUpProgress(progress);
    if (progress > 0 && !showThumbsUpConfirm) {
      setShowThumbsUpConfirm(true);
    } else if (progress === 0 && showThumbsUpConfirm) {
      setShowThumbsUpConfirm(false);
    }
  };

  const handleThumbsUpComplete = () => {
    setShowThumbsUpConfirm(false);
    setThumbsUpProgress(0);
    setShowThumbsUpSecret(true);
  };

  const handleHeartProgress = (progress: number) => {
    setHeartProgress(progress);
    if (progress > 0 && !showHeartConfirm) {
      setShowHeartConfirm(true);
    } else if (progress === 0 && showHeartConfirm) {
      setShowHeartConfirm(false);
    }
  };

  const handleHeartComplete = () => {
    setShowHeartConfirm(false);
    setHeartProgress(0);
    setShowHeartSecret(true);
  };

  const handleCancelGesture = () => {
    setShowThumbsUpConfirm(false);
    setShowHeartConfirm(false);
    setThumbsUpProgress(0);
    setHeartProgress(0);
  };

  // Handle ESC key to close modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showThumbsUpSecret) {
          setShowThumbsUpSecret(false);
        } else if (showHeartSecret) {
          setShowHeartSecret(false);
        } else if (showThumbsUpConfirm || showHeartConfirm) {
          handleCancelGesture();
        } else if (closestMedia) {
          setClosestMedia(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closestMedia, showThumbsUpSecret, showHeartSecret, showThumbsUpConfirm, showHeartConfirm]);

  return (
    <div className="w-full h-screen relative overflow-hidden">
      <ErrorBoundary>
        <Canvas
          camera={{ position: [0, 5, 15], fov: 50 }}
          gl={{ antialias: true, alpha: false }}
          dpr={[1, 2]}
        >
          <Suspense fallback={null}>
            <Experience
              mode={mode}
              handPosition={handPosition}
              mediaFiles={mediaFiles}
              twoHandsDetected={twoHandsDetected}
              onClosestMediaChange={handleClosestMediaChange}
              cursorPosition={cursor}
              isFistDetected={isFistDetected}
              onHoveredMediaChange={handleHoveredMediaChange}
            />
          </Suspense>
        </Canvas>
      </ErrorBoundary>

      <Loader
        containerStyles={{ background: '#000' }}
        innerStyles={{ width: '300px', height: '10px', background: '#333' }}
        barStyles={{ background: '#D4AF37', height: '10px' }}
        dataStyles={{ color: '#D4AF37', fontFamily: 'Cinzel' }}
      />

      <UIOverlay
        mode={mode}
        onToggle={toggleMode}
      />

      {/* Gesture Control Module */}
      <GestureController
        currentMode={mode}
        onModeChange={setMode}
        onHandPosition={handleHandPosition}
        onTwoHandsDetected={handleTwoHandsDetected}
        onThumbsUpDetected={handleThumbsUpComplete}
        onThumbsUpProgress={handleThumbsUpProgress}
        onHeartDetected={handleHeartComplete}
        onHeartProgress={handleHeartProgress}
        onFistDetected={setIsFistDetected}
        onQuickThumbsUp={handleQuickThumbsUp}
        onPointingDetected={handlePointing}
        onCursorMove={handleCursorMove}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      />

      {/* Gesture Confirmation Popups */}
      {showThumbsUpConfirm && !showThumbsUpSecret && !showHeartSecret && (
        <GestureConfirmPopup
          gestureType="thumbsup"
          progress={thumbsUpProgress}
          onComplete={handleThumbsUpComplete}
          onCancel={handleCancelGesture}
        />
      )}

      {showHeartConfirm && !showThumbsUpSecret && !showHeartSecret && (
        <GestureConfirmPopup
          gestureType="heart"
          progress={heartProgress}
          onComplete={handleHeartComplete}
          onCancel={handleCancelGesture}
        />
      )}

      {/* Media Preview Modal - Shows when user clicks on polaroid */}
      {closestMedia && !showThumbsUpSecret && !showHeartSecret && !showThumbsUpConfirm && !showHeartConfirm && (
        <MediaModal
          media={closestMedia}
          onClose={() => setClosestMedia(null)}
        />
      )}

      {/* Thumbs Up Secret Modal */}
      {showThumbsUpSecret && (
        <SecretModal
          onClose={() => setShowThumbsUpSecret(false)}
        />
      )}

      {/* Heart Secret Modal */}
      {showHeartSecret && (
        <HeartSecretModal
          onClose={() => setShowHeartSecret(false)}
          handPosition={handPosition}
          isFistDetected={isFistDetected}
        />
      )}

      {/* 🎵 Music Player */}
      <MusicPlayer />

      {/* Gesture Guide */}
      <GestureGuide />

      {/* Hand-following cursor for pointer interactions */}
      <HandCursor x={cursor.x} y={cursor.y} detected={cursor.detected} pointerDown={cursorPressed} />

    </div>
  );
}
