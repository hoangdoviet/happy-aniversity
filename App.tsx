import React, { useState, Suspense, useEffect, useCallback, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Loader } from '@react-three/drei';
import { AnniversaryScene } from './components/AnniversaryScene';
import { MonthOverlay } from './components/MonthOverlay';
import { AdminPanel } from './components/AdminPanel';
import { GestureController } from './components/GestureController';
import { HandCursor } from './components/HandCursor';
import { MediaModal } from './components/MediaModal';
import { GestureConfirmPopup } from './components/GestureConfirmPopup';
import { GestureGuide } from './components/GestureGuide';
import { SeasonalOverlay } from './components/SeasonalOverlay';
import { SceneState, TreeMode } from './types';
import { OrbitMediaFile } from './components/MediaOrbit';
import { getMonthMedia, getHeartMedia, fetchConfig, defaultAnniversaryConfig } from './utils/anniversaryConfig';
import { AnniversaryConfig } from './types';

// Simple Error Boundary to catch 3D resource loading errors (like textures)
// ── Simple routing ─────────────────────────────────────────────────────────
function isAdminRoute() {
  return (
    window.location.pathname === '/admin' ||
    window.location.hash === '#admin' ||
    window.location.search.includes('admin=1')
  );
}

// ── Error boundary ─────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message?: string }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, message: error?.message };
  }
  componentDidCatch(error: any, info: any) {
    console.error('3D scene error:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 text-pink-300 p-8 text-center">
          <div>
            <h2 className="text-2xl mb-3">Lỗi tải cảnh 3D</h2>
            <p className="opacity-70 mb-4">{this.state.message}</p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="px-4 py-2 border border-pink-500 rounded-lg hover:bg-pink-500/20 transition"
            >
              Thử lại
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Main anniversary experience ───────────────────────────────────────────────

function AnniversaryApp() {
  // Config — loaded from /config.json (shared across all devices) on mount
  const [config, setConfig] = useState<AnniversaryConfig>(defaultAnniversaryConfig);

  // currentMonth: 1–12 during months, 0 for heart
  const [currentMonth, setCurrentMonth] = useState(1);
  const [mode, setMode] = useState<SceneState>(SceneState.FORMED);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<OrbitMediaFile[]>([]);

  // Media navigation: index-based (null = modal closed)
  const [selectedMediaIndex, setSelectedMediaIndex] = useState<number | null>(null);
  const currentMedia = selectedMediaIndex !== null ? mediaFiles[selectedMediaIndex] ?? null : null;

  // Hand / gesture state
  const [handPosition, setHandPosition] = useState({ x: 0.5, y: 0.5, detected: false });
  const [cursor, setCursor] = useState({ x: 0.5, y: 0.5, detected: false });
  const [cursorPressed, setCursorPressed] = useState(false);
  // Always-current cursor ref — prevents stale closures in pointer-press effect
  const cursorRef = useRef(cursor);
  useEffect(() => { cursorRef.current = cursor; });

  // Touch swipe tracking (mobile)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Gesture swipe tracking for modal (velocity-based)
  const swipeTrackRef = useRef<{ x: number; time: number } | null>(null);
  const swipeLockRef = useRef(0);
  const swipeYTrackRef = useRef<{ y: number; time: number } | null>(null);
  const swipeYLockRef = useRef(0);

  // Gesture confirm popups
  const [showThumbsUpConfirm, setShowThumbsUpConfirm] = useState(false);
  const [thumbsUpProgress, setThumbsUpProgress] = useState(0);
  const [showHeartConfirm, setShowHeartConfirm] = useState(false);
  const [heartProgress, setHeartProgress] = useState(0);

  // Music
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ── Load media for current month ──────────────────────────────────────────

  // On mount: fetch config from /config.json so all devices see the same setup
  useEffect(() => {
    fetchConfig().then(setConfig);
  }, []);

  // Reload when window regains focus (e.g. after saving in another tab / admin panel)
  useEffect(() => {
    const onFocus = () => { fetchConfig().then(setConfig); };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  useEffect(() => {
    const isHeart = currentMonth === 0;
    const raw = isHeart ? getHeartMedia(config) : getMonthMedia(config, currentMonth);

    const files: OrbitMediaFile[] = [
      ...raw.photos.map((url) => ({ url, type: 'image' as const, filename: url.split('/').pop()! })),
      ...raw.videos.map((url) => ({ url, type: 'video' as const, filename: url.split('/').pop()! })),
    ];
    setMediaFiles(files);
    setSelectedMediaIndex(null); // close any open modal on month change

    // Update music
    if (!audioRef.current) audioRef.current = new Audio();
    const audio = audioRef.current;
    if (raw.music) {
      audio.src = raw.music;
      audio.loop = true;
      audio.volume = 0.45;
      audio.play().catch(() => { /* autoplay blocked */ });
    } else {
      audio.pause();
    }
  }, [currentMonth, config]);

  // ── Month transitions ──────────────────────────────────────────────────────

  const handleNextMonth = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setMode(SceneState.CHAOS);

    setTimeout(() => {
      const next = currentMonth === 0
        ? 1                       // heart → restart
        : currentMonth === 12
          ? 0                     // month 12 → heart
          : currentMonth + 1;
      setCurrentMonth(next);
      setMode(SceneState.FORMED);
      setIsTransitioning(false);
    }, 1800);
  }, [currentMonth, isTransitioning]);

  const handleToggleMode = () =>
    setMode((prev) => prev === SceneState.FORMED ? SceneState.CHAOS : SceneState.FORMED);

  // ── Gesture callbacks ──────────────────────────────────────────────────────

  const handleModeChange = useCallback((treeMode: TreeMode) => {
    setMode(treeMode === TreeMode.FORMED ? SceneState.FORMED : SceneState.CHAOS);
  }, []);

  const handleThumbsUpProgress = (progress: number) => {
    setThumbsUpProgress(progress);
    setShowThumbsUpConfirm(progress > 0);
  };
  const handleThumbsUpComplete = useCallback(() => {
    setShowThumbsUpConfirm(false);
    setThumbsUpProgress(0);
    handleNextMonth();
  }, [handleNextMonth]);

  const handleHeartProgress = (progress: number) => {
    setHeartProgress(progress);
    setShowHeartConfirm(progress > 0);
  };
  const handleHeartComplete = () => {
    setShowHeartConfirm(false);
    setHeartProgress(0);
  };
  const handleCancelGesture = () => {
    setShowThumbsUpConfirm(false);
    setShowHeartConfirm(false);
    setThumbsUpProgress(0);
    setHeartProgress(0);
  };

  // ── Media navigation ───────────────────────────────────────────────────────

  const handleMediaClick = useCallback((file: OrbitMediaFile) => {
    const idx = mediaFiles.findIndex((f) => f.url === file.url);
    setSelectedMediaIndex(idx >= 0 ? idx : 0);
  }, [mediaFiles]);

  const handlePrevMedia = useCallback(() => {
    if (mediaFiles.length === 0) return;
    setSelectedMediaIndex((prev) =>
      prev === null ? 0 : (prev - 1 + mediaFiles.length) % mediaFiles.length,
    );
  }, [mediaFiles.length]);

  const handleNextMedia = useCallback(() => {
    if (mediaFiles.length === 0) return;
    setSelectedMediaIndex((prev) =>
      prev === null ? 0 : (prev + 1) % mediaFiles.length,
    );
  }, [mediaFiles.length]);

  // ── Gesture cursor → synthetic pointer events on the 3D canvas ────────────
  // NOTE: webcam x is mirrored — use (1 - cursor.x) for correct screen position

  useEffect(() => {
    if (!cursor.detected) return;
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    // Mirror-correct: (1 - cursor.x) maps camera-left → screen-right
    canvas.dispatchEvent(new PointerEvent('pointermove', {
      clientX: (1 - cursor.x) * rect.width + rect.left,
      clientY: cursor.y * rect.height + rect.top,
      bubbles: true, pointerType: 'mouse', isPrimary: true,
    }));
  }, [cursor.x, cursor.y, cursor.detected]);

  // ── Gesture swipe detection for modal navigation (no button needed) ────────
  useEffect(() => {
    if (!cursor.detected || selectedMediaIndex === null) {
      swipeTrackRef.current = null;
      return;
    }
    const now = Date.now();
    const track = swipeTrackRef.current;
    if (!track) {
      swipeTrackRef.current = { x: cursor.x, time: now };
      return;
    }
    const dx = cursor.x - track.x;
    const dt = now - track.time;
    if (Math.abs(dx) > 0.22 && dt < 600 && now > swipeLockRef.current) {
      // camera space: +dx = hand moves right = screen LEFT swipe = NEXT
      // camera space: -dx = hand moves left  = screen RIGHT swipe = PREV
      swipeLockRef.current = now + 1400;
      swipeTrackRef.current = null;
      if (dx > 0) handleNextMedia();
      else handlePrevMedia();
    } else if (dt > 600) {
      swipeTrackRef.current = { x: cursor.x, time: now };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor.x, cursor.detected, selectedMediaIndex]);

  // ── Gesture swipe-up to close modal ──────────────────────────────────────
  useEffect(() => {
    if (!cursor.detected || selectedMediaIndex === null) {
      swipeYTrackRef.current = null;
      return;
    }
    const now = Date.now();
    const track = swipeYTrackRef.current;
    if (!track) {
      swipeYTrackRef.current = { y: cursor.y, time: now };
      return;
    }
    const dy = cursor.y - track.y;
    const dt = now - track.time;
    // dy < -0.28: cursor.y decreased quickly = hand moved UP = swipe-up to close
    if (dy < -0.28 && dt < 700 && now > swipeYLockRef.current) {
      swipeYLockRef.current = now + 1500;
      swipeYTrackRef.current = null;
      setSelectedMediaIndex(null);
    } else if (dt > 600) {
      swipeYTrackRef.current = { y: cursor.y, time: now };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor.y, cursor.detected, selectedMediaIndex]);

  // Cursor press → click on canvas OR navigate modal
  const prevPressedRef = useRef(false);
  useEffect(() => {
    if (!cursorPressed || prevPressedRef.current) {
      prevPressedRef.current = cursorPressed;
      return;
    }
    prevPressedRef.current = cursorPressed;

    // If modal is open, use cursor X position for navigation
    if (selectedMediaIndex !== null && mediaFiles.length > 0) {
      if (cursor.x < 0.25) { handlePrevMedia(); return; }
      if (cursor.x > 0.75) { handleNextMedia(); return; }
      if (cursor.x > 0.35 && cursor.x < 0.65) { setSelectedMediaIndex(null); return; }
      return;
    }

    // Otherwise fire a canvas click so polaroids respond
    // Use cursorRef for always-current coordinates (avoid stale closure)
    const cur = cursorRef.current;
    if (!cur.detected) return;
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    // Mirror-correct: (1 - cursor.x)
    canvas.dispatchEvent(new PointerEvent('click', {
      clientX: (1 - cur.x) * rect.width + rect.left,
      clientY: cur.y * rect.height + rect.top,
      bubbles: true, pointerType: 'mouse', isPrimary: true,
    } as PointerEventInit));
  }, [cursorPressed]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedMediaIndex !== null) setSelectedMediaIndex(null);
        else handleCancelGesture();
      }
      if (e.key === 'ArrowLeft' && selectedMediaIndex !== null) handlePrevMedia();
      if (e.key === 'ArrowRight' && selectedMediaIndex !== null) handleNextMedia();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedMediaIndex, handlePrevMedia, handleNextMedia]);

  // ── Render ─────────────────────────────────────────────────────────────────

  const monthCfg = currentMonth > 0
    ? config.months.find((m) => m.month === currentMonth)
    : null;

  // ── Mobile touch swipe handlers ──────────────────────────────────────────
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartRef.current.x;
    const dy = t.clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    if (selectedMediaIndex !== null) {
      // Modal: horizontal swipe → prev/next, vertical up → close
      if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        if (dx < 0) handleNextMedia();
        else handlePrevMedia();
      } else if (dy < -70 && Math.abs(dy) > Math.abs(dx) * 1.2) {
        setSelectedMediaIndex(null);
      }
    }
    // Scene swipe-up to change month is intentionally disabled
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMediaIndex, handleNextMedia, handlePrevMedia, handleNextMonth]);

  return (
    <div
      className="w-full relative overflow-hidden"
      style={{
        height: '100dvh',   // dynamic viewport height: excludes iOS address bar
        background: 'radial-gradient(ellipse at center, #130020 0%, #050008 100%)'
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <ErrorBoundary>
        <Canvas
          camera={{ position: [0, 4, 20], fov: 50 }}
          gl={{ antialias: true, alpha: false }}
          dpr={[1, 2]}
        >
          <Suspense fallback={null}>
            <AnniversaryScene
              currentMonth={currentMonth}
              mode={mode}
              handPosition={handPosition}
              mediaFiles={mediaFiles}
              onMediaClick={handleMediaClick}
            />
          </Suspense>
        </Canvas>
      </ErrorBoundary>

      <Loader
        containerStyles={{ background: 'transparent' }}
        innerStyles={{ width: '280px', height: '4px', background: '#330033' }}
        barStyles={{ background: '#FF69B4', height: '4px' }}
        dataStyles={{ color: '#FFB6C1', fontFamily: 'serif' }}
      />

      {/* Seasonal particle effects (Spring/Summer/Autumn/Winter) */}
      <SeasonalOverlay currentMonth={currentMonth} />

      <MonthOverlay
        currentMonth={currentMonth}
        monthTitle={monthCfg?.title ?? (currentMonth === 0 ? '❤️ 1 Năm Yêu Nhau' : `Tháng ${currentMonth}`)}
        monthDescription={monthCfg?.description ?? ''}
        mode={mode}
        onNextMonth={handleNextMonth}
        onToggleMode={handleToggleMode}
        coupleNames={config.coupleNames}
        isTransitioning={isTransitioning}
      />

      <GestureController
        currentMode={mode === SceneState.FORMED ? TreeMode.FORMED : TreeMode.CHAOS}
        onModeChange={handleModeChange}
        onHandPosition={(x, y, d) => setHandPosition({ x, y, detected: d })}
        onThumbsUpDetected={handleThumbsUpComplete}
        onThumbsUpProgress={handleThumbsUpProgress}
        onHeartDetected={handleHeartComplete}
        onHeartProgress={handleHeartProgress}
        onFistDetected={() => { }}
        onCursorMove={(x, y, d) => setCursor({ x, y, detected: d })}
        onPointerDown={() => setCursorPressed(true)}
        onPointerUp={() => setCursorPressed(false)}
        isModalOpen={selectedMediaIndex !== null}
      />

      {showThumbsUpConfirm && (
        <GestureConfirmPopup
          gestureType="thumbsup"
          progress={thumbsUpProgress}
          onComplete={handleThumbsUpComplete}
          onCancel={handleCancelGesture}
        />
      )}
      {showHeartConfirm && (
        <GestureConfirmPopup
          gestureType="heart"
          progress={heartProgress}
          onComplete={handleHeartComplete}
          onCancel={handleCancelGesture}
        />
      )}

      {currentMedia && !showThumbsUpConfirm && !showHeartConfirm && (
        <MediaModal
          media={currentMedia}
          allMedia={mediaFiles}
          currentIndex={selectedMediaIndex!}
          onClose={() => setSelectedMediaIndex(null)}
          onPrev={handlePrevMedia}
          onNext={handleNextMedia}
        />
      )}

      <GestureGuide />
      <HandCursor x={cursor.x} y={cursor.y} detected={cursor.detected} pointerDown={cursorPressed} />

      {/* Tiny admin link */}
      <a
        href="/admin"
        className="fixed top-3 right-3 text-xs text-pink-900/30 hover:text-pink-500 transition z-50"
      >
        ⚙
      </a>
    </div>
  );
}

// ── Root with simple routing ───────────────────────────────────────────────────

export default function App() {
  const [page, setPage] = useState<'main' | 'admin'>(() =>
    isAdminRoute() ? 'admin' : 'main'
  );

  useEffect(() => {
    const onPop = () => setPage(isAdminRoute() ? 'admin' : 'main');
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a[href="/admin"]');
      if (anchor) {
        e.preventDefault();
        window.history.pushState({}, '', '/admin');
        setPage('admin');
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  if (page === 'admin') return <AdminPanel />;
  return <AnniversaryApp />;
}
