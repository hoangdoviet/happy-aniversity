
import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { TreeMode } from '../types';

interface GestureControllerProps {
  onModeChange: (mode: TreeMode) => void;
  currentMode: TreeMode;
  onHandPosition?: (x: number, y: number, detected: boolean) => void;
  onTwoHandsDetected?: (detected: boolean) => void;
  onThumbsUpDetected?: () => void;
  onThumbsUpProgress?: (progress: number) => void; // 0 to 5
  onHeartDetected?: () => void;
  onHeartProgress?: (progress: number) => void; // 0 to 5
  onFistDetected?: (isFist: boolean) => void; // For detecting closed fist
  onQuickThumbsUp?: () => void; // Quick thumbs up (1 second) to select photo
  onCursorMove?: (x: number, y: number, detected: boolean) => void; // index tip cursor
  onPointerDown?: () => void; // pointer (index click) down
  onPointerUp?: () => void; // pointer up
  onPointingDetected?: () => void; // Index finger pointing to select
  /** When true, raise camera preview above modal (z-[60]) */
  isModalOpen?: boolean;
}

export const GestureController: React.FC<GestureControllerProps> = ({
  onModeChange,
  currentMode,
  onHandPosition,
  onTwoHandsDetected,
  onThumbsUpDetected,
  onThumbsUpProgress,
  onHeartDetected,
  onHeartProgress,
  onFistDetected,
  onQuickThumbsUp,
  onPointingDetected,
  onCursorMove,
  onPointerDown,
  onPointerUp,
  isModalOpen = false,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [gestureStatus, setGestureStatus] = useState<string>("Initializing...");
  const [handPos, setHandPos] = useState<{ x: number; y: number } | null>(null);
  const lastModeRef = useRef<TreeMode>(currentMode);

  // Debounce logic refs
  const openFrames = useRef(0);
  const closedFrames = useRef(0);
  const thumbsUpFrames = useRef(0);
  const heartFrames = useRef(0);
  const quickThumbsUpFrames = useRef(0);
  const pointingFrames = useRef(0);
  const CONFIDENCE_THRESHOLD = 5; // Number of consecutive frames to confirm gesture
  const SPECIAL_GESTURE_THRESHOLD = 150; // 5 seconds at 30fps = 150 frames
  const QUICK_THUMBS_UP_THRESHOLD = 30; // 1 second at 30fps = 30 frames
  const POINTING_THRESHOLD = 15; // 0.5 seconds to confirm pointing
  const lastThumbsUpTime = useRef(0);
  const lastHeartTime = useRef(0);
  const lastQuickThumbsUpTime = useRef(0);
  // lastPointingTime removed — pointing no longer fires pointer events (PINCH does instead)
  const SPECIAL_GESTURE_COOLDOWN = 5000; // 5 seconds cooldown
  const QUICK_GESTURE_COOLDOWN = 1000; // 1 second cooldown for quick thumbs up
  // POINTING_COOLDOWN removed — pointing no longer fires pointer events (PINCH does instead)
  const thumbsUpStartTime = useRef<number>(0);
  const heartStartTime = useRef<number>(0);
  const pointerDownRef = useRef(false);

  // Always-current callbacks ref — avoids stale closures inside the RAF loop
  const cbRef = useRef({
    onModeChange, onHandPosition, onTwoHandsDetected, onThumbsUpDetected,
    onThumbsUpProgress, onHeartDetected, onHeartProgress, onFistDetected,
    onQuickThumbsUp, onPointingDetected, onCursorMove, onPointerDown, onPointerUp,
  });
  useEffect(() => {
    cbRef.current = {
      onModeChange, onHandPosition, onTwoHandsDetected, onThumbsUpDetected,
      onThumbsUpProgress, onHeartDetected, onHeartProgress, onFistDetected,
      onQuickThumbsUp, onPointingDetected, onCursorMove, onPointerDown, onPointerUp,
    };
  });  // runs after every render to stay in sync

  useEffect(() => {
    let handLandmarker: HandLandmarker | null = null;
    let animationFrameId: number;

    const setupMediaPipe = async () => {
      try {
        // Use jsDelivr CDN (accessible in China)
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        );

        // Use local model file to avoid loading from Google Storage (blocked in China)
        // Model file should be downloaded using: npm run download-model or download-model.bat/.sh
        handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `/models/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 2
        });

        startWebcam();
      } catch (error) {
        console.error("Error initializing MediaPipe:", error);
        console.warn("Gesture control is unavailable. The app will still work without it.");
        setGestureStatus("Gesture control unavailable");
        // Don't block the app if gesture control fails
      }
    };

    const startWebcam = async () => {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 320, height: 240, facingMode: "user" }
          });

          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.addEventListener("loadeddata", predictWebcam);
            setIsLoaded(true);
            setGestureStatus("Waiting for hand...");
          }
        } catch (err) {
          console.error("Error accessing webcam:", err);
          setGestureStatus("Permission Denied");
        }
      }
    };

    // Draw a single hand without clearing canvas
    const drawSingleHandSkeleton = (landmarks: any[], ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
      // Hand connections (MediaPipe hand model)
      const connections = [
        // Thumb
        [0, 1], [1, 2], [2, 3], [3, 4],
        // Index finger
        [0, 5], [5, 6], [6, 7], [7, 8],
        // Middle finger
        [0, 9], [9, 10], [10, 11], [11, 12],
        // Ring finger
        [0, 13], [13, 14], [14, 15], [15, 16],
        // Pinky
        [0, 17], [17, 18], [18, 19], [19, 20],
        // Palm
        [5, 9], [9, 13], [13, 17]
      ];

      // Draw connections (lines)
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#D4AF37'; // Gold color
      connections.forEach(([start, end]) => {
        const startPoint = landmarks[start];
        const endPoint = landmarks[end];

        ctx.beginPath();
        ctx.moveTo(startPoint.x * canvas.width, startPoint.y * canvas.height);
        ctx.lineTo(endPoint.x * canvas.width, endPoint.y * canvas.height);
        ctx.stroke();
      });

      // Draw landmarks (points)
      landmarks.forEach((landmark, index) => {
        const x = landmark.x * canvas.width;
        const y = landmark.y * canvas.height;

        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);

        // Use green for all points
        ctx.fillStyle = '#228B22'; // Forest green color
        ctx.fill();

        // Add outline
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      });
    };

    // Draw all detected hands
    const drawAllHands = (allLandmarks: any[][]) => {
      if (!canvasRef.current || !videoRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas size to match video
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;

      // Clear canvas once
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw each hand
      allLandmarks.forEach(landmarks => {
        drawSingleHandSkeleton(landmarks, ctx, canvas);
      });
    };

    // Throttle: limit ML inference to ~20 fps to free GPU/CPU for Three.js + video
    const INFERENCE_INTERVAL_MS = 50;
    let lastInferenceMs = 0;
    // EMA-smoothed cursor position (local to this setup closure — survives RAF loop)
    const smoothCursor = { x: 0.5, y: 0.5 };
    const CURSOR_ALPHA = 0.32; // 0 = frozen, 1 = instant; ~0.3 = smooth yet responsive

    const predictWebcam = () => {
      if (!handLandmarker || !videoRef.current) return;

      const nowMs = performance.now();

      // Skip inference this frame if called too soon — still reschedule
      if (nowMs - lastInferenceMs < INFERENCE_INTERVAL_MS) {
        animationFrameId = requestAnimationFrame(predictWebcam);
        return;
      }
      lastInferenceMs = nowMs;

      const startTimeMs = nowMs;
      if (videoRef.current.videoWidth > 0) { // Ensure video is ready
        const result = handLandmarker.detectForVideo(videoRef.current, startTimeMs);

        if (result.landmarks && result.landmarks.length > 0) {
          // Check if two hands are detected
          const twoHandsDetected = result.landmarks.length >= 2;
          if (cbRef.current.onTwoHandsDetected) {
            cbRef.current.onTwoHandsDetected(twoHandsDetected);
          }

          // Draw all detected hands at once
          drawAllHands(result.landmarks);

          // Use first hand for gesture detection
          const landmarks = result.landmarks[0];
          // Emit a smoothed cursor position using index tip (landmark 8)
          if (landmarks[8] && cbRef.current.onCursorMove) {
            // EMA low-pass filter: blend toward raw position each frame
            smoothCursor.x += (landmarks[8].x - smoothCursor.x) * CURSOR_ALPHA;
            smoothCursor.y += (landmarks[8].y - smoothCursor.y) * CURSOR_ALPHA;
            cbRef.current.onCursorMove(smoothCursor.x, smoothCursor.y, true);
          }
          detectGesture(landmarks);
        } else {
          setGestureStatus("No hand detected");
          setHandPos(null); // Clear hand position when no hand detected
          if (cbRef.current.onHandPosition) {
            cbRef.current.onHandPosition(0.5, 0.5, false); // No hand detected
          }
          if (cbRef.current.onTwoHandsDetected) {
            cbRef.current.onTwoHandsDetected(false);
          }
          // Clear canvas when no hand detected
          if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
              ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            }
          }
          // Reset counters if hand is lost? 
          // Better to keep them to prevent flickering if hand blips out for 1 frame
          openFrames.current = Math.max(0, openFrames.current - 1);
          closedFrames.current = Math.max(0, closedFrames.current - 1);
          thumbsUpFrames.current = 0;
          heartFrames.current = 0;
          if (cbRef.current.onThumbsUpProgress) cbRef.current.onThumbsUpProgress(0);
          if (cbRef.current.onHeartProgress) cbRef.current.onHeartProgress(0);
        }
      }

      animationFrameId = requestAnimationFrame(predictWebcam);
    };

    const detectGesture = (landmarks: any[]) => {
      // 0 is Wrist
      // Tips: 8 (Index), 12 (Middle), 16 (Ring), 20 (Pinky)
      // Bases (MCP): 5, 9, 13, 17

      const wrist = landmarks[0];

      // Calculate palm center (average of wrist and finger bases)
      // Finger bases (MCP joints): 5, 9, 13, 17
      const palmCenterX = (landmarks[0].x + landmarks[5].x + landmarks[9].x + landmarks[13].x + landmarks[17].x) / 5;
      const palmCenterY = (landmarks[0].y + landmarks[5].y + landmarks[9].y + landmarks[13].y + landmarks[17].y) / 5;

      // Send hand position for camera control
      setHandPos({ x: palmCenterX, y: palmCenterY });
      if (cbRef.current.onHandPosition) {
        cbRef.current.onHandPosition(palmCenterX, palmCenterY, true);
      }

      const fingerTips = [8, 12, 16, 20];
      const fingerBases = [5, 9, 13, 17];

      let extendedFingers = 0;

      for (let i = 0; i < 4; i++) {
        const tip = landmarks[fingerTips[i]];
        const base = landmarks[fingerBases[i]];

        // Calculate distance from wrist to tip vs wrist to base
        const distTip = Math.hypot(tip.x - wrist.x, tip.y - wrist.y);
        const distBase = Math.hypot(base.x - wrist.x, base.y - wrist.y);

        // Heuristic: If tip is significantly further from wrist than base, it's extended
        if (distTip > distBase * 1.5) { // 1.5 multiplier is a safe heuristic for extension
          extendedFingers++;
        }
      }

      // Thumb check (Tip 4 vs Base 2)
      const thumbTip = landmarks[4];
      const thumbBase = landmarks[2];
      const distThumbTip = Math.hypot(thumbTip.x - wrist.x, thumbTip.y - wrist.y);
      const distThumbBase = Math.hypot(thumbBase.x - wrist.x, thumbBase.y - wrist.y);
      if (distThumbTip > distThumbBase * 1.2) extendedFingers++;

      // === THUMBS UP DETECTION (Two modes: Quick 1s for photo select, Hold 5s for secret) ===
      // Thumbs up: thumb extended upward, all other fingers curled
      const isThumbUp = thumbTip.y < wrist.y - 0.1 && // Thumb is significantly above wrist
        extendedFingers === 1 && // Only thumb extended
        distThumbTip > distThumbBase * 1.3; // Thumb clearly extended

      if (isThumbUp) {
        const now = Date.now();

        // Count frames
        thumbsUpFrames.current++;
        quickThumbsUpFrames.current++;

        // QUICK THUMBS UP (1 second) - For selecting photos in Chaos mode
        if (quickThumbsUpFrames.current >= QUICK_THUMBS_UP_THRESHOLD &&
          quickThumbsUpFrames.current < SPECIAL_GESTURE_THRESHOLD &&
          now - lastQuickThumbsUpTime.current > QUICK_GESTURE_COOLDOWN) {
          // Trigger quick thumbs up only once when threshold is reached
          if (quickThumbsUpFrames.current === QUICK_THUMBS_UP_THRESHOLD) {
            setGestureStatus("👍 Photo Selected!");
            lastQuickThumbsUpTime.current = now;
            if (cbRef.current.onQuickThumbsUp) {
              cbRef.current.onQuickThumbsUp();
            }
          }
          setGestureStatus(`👍 Giữ thêm để mở bí mật...`);
        }

        // LONG THUMBS UP (5 seconds) - For secret unlock
        if (now - lastThumbsUpTime.current < SPECIAL_GESTURE_COOLDOWN) {
          setGestureStatus("👍 Cooldown bí mật... Chờ một chút");
          if (cbRef.current.onThumbsUpProgress) cbRef.current.onThumbsUpProgress(0);
        } else {
          // Start counting for secret
          if (thumbsUpFrames.current === 0) {
            thumbsUpStartTime.current = now;
          }

          // Calculate progress (0-5 based on frames)
          const progressRatio = thumbsUpFrames.current / SPECIAL_GESTURE_THRESHOLD;
          const lightProgress = Math.min(5, Math.floor(progressRatio * 5));

          if (cbRef.current.onThumbsUpProgress) {
            cbRef.current.onThumbsUpProgress(lightProgress);
          }

          if (thumbsUpFrames.current >= SPECIAL_GESTURE_THRESHOLD) {
            setGestureStatus("👍 THUMBS UP - Secret Unlocked!");
            lastThumbsUpTime.current = now;
            thumbsUpFrames.current = 0;
            quickThumbsUpFrames.current = 0;
            if (cbRef.current.onThumbsUpDetected) {
              cbRef.current.onThumbsUpDetected();
            }
            if (cbRef.current.onThumbsUpProgress) cbRef.current.onThumbsUpProgress(5);
            return;
          } else if (thumbsUpFrames.current > QUICK_THUMBS_UP_THRESHOLD) {
            setGestureStatus(`👍 Giữ lại... (${lightProgress}/5) - Bí mật!`);
            return;
          }
        }
      } else {
        if (thumbsUpFrames.current > 0) {
          // Reset if gesture is broken
          thumbsUpFrames.current = 0;
          quickThumbsUpFrames.current = 0;
          if (cbRef.current.onThumbsUpProgress) cbRef.current.onThumbsUpProgress(0);
        }
      }

      // === PEACE SIGN GESTURE DETECTION (5 seconds hold) ===
      // Peace sign: index and middle finger extended upward, other fingers curled
      // Check index (8) and middle (12) finger tips
      const indexTip = landmarks[8];
      const middleTip = landmarks[12];
      const indexBase = landmarks[5];
      const middleBase = landmarks[9];

      // Check if index and middle are extended upward
      const indexExtended = indexTip.y < indexBase.y - 0.05 && Math.hypot(indexTip.x - wrist.x, indexTip.y - wrist.y) > Math.hypot(indexBase.x - wrist.x, indexBase.y - wrist.y) * 1.3;
      const middleExtended = middleTip.y < middleBase.y - 0.05 && Math.hypot(middleTip.x - wrist.x, middleTip.y - wrist.y) > Math.hypot(middleBase.x - wrist.x, middleBase.y - wrist.y) * 1.3;

      // Peace sign: only index and middle extended, other fingers curled
      const isHeart = indexExtended && middleExtended && extendedFingers >= 2 && extendedFingers <= 3;

      if (isHeart) {
        const now = Date.now();

        // Check cooldown
        if (now - lastHeartTime.current < SPECIAL_GESTURE_COOLDOWN) {
          setGestureStatus("✌️ Cooldown... Chờ một chút");
          heartFrames.current = 0;
          if (cbRef.current.onHeartProgress) cbRef.current.onHeartProgress(0);
        } else {
          // Start counting
          if (heartFrames.current === 0) {
            heartStartTime.current = now;
          }

          heartFrames.current++;

          // Calculate progress (0-5 based on frames)
          const progressRatio = heartFrames.current / SPECIAL_GESTURE_THRESHOLD;
          const lightProgress = Math.min(5, Math.floor(progressRatio * 5));

          if (cbRef.current.onHeartProgress) {
            cbRef.current.onHeartProgress(lightProgress);
          }

          if (heartFrames.current >= SPECIAL_GESTURE_THRESHOLD) {
            setGestureStatus("✌️ PEACE SIGN - Secret Unlocked!");
            lastHeartTime.current = now;
            heartFrames.current = 0;
            if (cbRef.current.onHeartDetected) {
              cbRef.current.onHeartDetected();
            }
            if (cbRef.current.onHeartProgress) cbRef.current.onHeartProgress(5);
            return;
          } else {
            setGestureStatus(`✌️ Giữ lại dấu V... (${lightProgress}/5)`);
            return;
          }
        }
      } else {
        if (heartFrames.current > 0) {
          // Reset if gesture is broken
          heartFrames.current = 0;
          if (cbRef.current.onHeartProgress) cbRef.current.onHeartProgress(0);
        }
      }

      // === PINCH DETECTION (index tip close to thumb tip → select/click) ===
      // This keeps the cursor on the polaroid while the user "pinches" to select.
      // Much more reliable than pointing-up, which shifts cursor position upward.
      const pinchDist = Math.hypot(indexTip.x - thumbTip.x, indexTip.y - thumbTip.y);
      const PINCH_THRESHOLD = 0.07; // ~7% of frame width
      const isPinching = pinchDist < PINCH_THRESHOLD;

      if (isPinching) {
        if (!pointerDownRef.current) {
          pointerDownRef.current = true;
          setGestureStatus('🤏 Chọn ảnh!');
          if (cbRef.current.onPointerDown) cbRef.current.onPointerDown();
        }
      } else {
        if (pointerDownRef.current) {
          pointerDownRef.current = false;
          if (cbRef.current.onPointerUp) cbRef.current.onPointerUp();
        }
      }

      // === POINTING GESTURE — status display only, no pointer events ===
      // (pointer events are handled by PINCH above)
      const idxDx = indexTip.x - indexBase.x;
      const idxDy = indexTip.y - indexBase.y;
      const thumbExtended = distThumbTip > distThumbBase * 1.2;
      const isIndexUp = idxDy < -0.02 && Math.abs(idxDx) < Math.abs(idxDy) * 0.7;
      const isPointing = indexExtended && extendedFingers === 1 && !thumbExtended && isIndexUp;
      if (isPointing) {
        pointingFrames.current++;
        if (pointingFrames.current >= POINTING_THRESHOLD) {
          setGestureStatus('👆 Đang trỏ — kẹp ngón cái để chọn');
          if (cbRef.current.onPointingDetected) cbRef.current.onPointingDetected();
        }
      } else {
        pointingFrames.current = 0;
      }

      // DECISION (existing open/closed hand logic)
      if (extendedFingers >= 4) {
        // OPEN HAND -> UNLEASH (CHAOS)
        openFrames.current++;
        closedFrames.current = 0;

        setGestureStatus("Detected: OPEN (Unleash)");

        // Notify fist detection
        if (cbRef.current.onFistDetected) cbRef.current.onFistDetected(false);

        if (openFrames.current > CONFIDENCE_THRESHOLD) {
          if (lastModeRef.current !== TreeMode.CHAOS) {
            lastModeRef.current = TreeMode.CHAOS;
            cbRef.current.onModeChange(TreeMode.CHAOS);
          }
        }

      } else if (extendedFingers <= 1) {
        // CLOSED FIST -> RESTORE (FORMED)
        closedFrames.current++;
        openFrames.current = 0;

        setGestureStatus("Detected: CLOSED (Restore)");

        // Notify fist detection
        if (cbRef.current.onFistDetected) cbRef.current.onFistDetected(true);

        if (closedFrames.current > CONFIDENCE_THRESHOLD) {
          if (lastModeRef.current !== TreeMode.FORMED) {
            lastModeRef.current = TreeMode.FORMED;
            cbRef.current.onModeChange(TreeMode.FORMED);
          }
        }
      } else {
        // Ambiguous
        setGestureStatus("Detected: ...");
        openFrames.current = 0;
        closedFrames.current = 0;
        if (cbRef.current.onFistDetected) cbRef.current.onFistDetected(false);
      }
    };

    setupMediaPipe();

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (handLandmarker) handLandmarker.close();
    };
  }, [onModeChange]);

  // Sync ref with prop updates to prevent overriding in closure
  useEffect(() => {
    lastModeRef.current = currentMode;
  }, [currentMode]);

  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`fixed bottom-4 right-3 md:bottom-auto md:top-6 md:right-[8%] flex flex-col-reverse md:flex-col items-end ${isModalOpen ? 'z-[60]' : 'z-50'}`}>
      {/* Collapse toggle — always clickable */}
      <button
        className="mt-1 md:mt-0 md:mb-1 w-7 h-7 rounded-full bg-black/70 border border-[#D4AF37]/50 text-[#D4AF37] text-xs flex items-center justify-center hover:bg-black/90 transition pointer-events-auto"
        onClick={() => setCollapsed((v) => !v)}
        aria-label={collapsed ? 'Hiện camera cử chỉ' : 'Ẩn camera cử chỉ'}
        title={collapsed ? 'Bật camera nhận cử chỉ' : 'Tắt camera'}
        style={{ lineHeight: 1 }}
      >
        {collapsed ? '📷' : '×'}
      </button>

      {/* Camera Preview Frame — kept in DOM (CSS hidden) so stream is never lost */}
      <div className={`relative w-[22vw] h-[16.5vw] md:w-[18.75vw] md:h-[14.0625vw] max-w-[140px] max-h-[105px] border-2 border-[#D4AF37] rounded-lg overflow-hidden shadow-[0_0_20px_rgba(212,175,55,0.3)] bg-black pointer-events-none${collapsed ? ' hidden' : ''}`}>
        {/* Decorative Lines */}
        <div className="absolute inset-0 border border-[#F5E6BF]/20 m-1 rounded-sm z-10" />

        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transform -scale-x-100 transition-opacity duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        />

        {/* Canvas for hand skeleton overlay */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover transform -scale-x-100 pointer-events-none z-20"
        />

        {/* Hand Position Indicator */}
        {handPos && (
          <div
            className="absolute w-2 h-2 bg-[#D4AF37] rounded-full border border-white"
            style={{
              left: `${(1 - handPos.x) * 100}%`,
              top: `${handPos.y * 100}%`,
              transform: 'translate(-50%, -50%)'
            }}
          />
        )}
      </div>
    </div>
  );
};
