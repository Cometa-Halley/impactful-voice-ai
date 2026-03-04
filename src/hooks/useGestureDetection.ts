import { useState, useEffect, useRef, useCallback } from 'react';

interface GestureDetection {
  isWaving: boolean;
  motionLevel: number; // 0-100
  gestureDetected: boolean; // true when a wave gesture is confirmed
}

/**
 * Detects waving gesture by analyzing motion in a specific region of the video frame.
 * Uses frame differencing — no external ML library needed.
 */
export function useGestureDetection(
  videoRef: React.RefObject<HTMLVideoElement>,
  active: boolean,
  onGestureDetected?: () => void
): GestureDetection {
  const [isWaving, setIsWaving] = useState(false);
  const [motionLevel, setMotionLevel] = useState(0);
  const [gestureDetected, setGestureDetected] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const prevFrameRef = useRef<Uint8ClampedArray | null>(null);
  const rafRef = useRef<number>(0);
  const motionHistoryRef = useRef<number[]>([]);
  const cooldownRef = useRef(false);

  const analyzeMotion = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(analyzeMotion);
      return;
    }

    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const w = 80;
    const h = 60;
    canvas.width = w;
    canvas.height = h;
    ctx.drawImage(video, 0, 0, w, h);

    // Analyze upper region (where hands wave)
    const upperRegion = ctx.getImageData(0, 0, w, Math.round(h * 0.6));
    const data = upperRegion.data;

    let motion = 0;
    if (prevFrameRef.current && prevFrameRef.current.length === data.length) {
      for (let i = 0; i < data.length; i += 4) {
        motion += Math.abs(data[i] - prevFrameRef.current[i]);
        motion += Math.abs(data[i + 1] - prevFrameRef.current[i + 1]);
        motion += Math.abs(data[i + 2] - prevFrameRef.current[i + 2]);
      }
      const pixelCount = data.length / 4;
      motion = Math.min(100, Math.round((motion / (pixelCount * 3)) * 8));
    }
    prevFrameRef.current = new Uint8ClampedArray(data);

    setMotionLevel(motion);

    // Detect waving pattern: alternating high/low motion
    const history = motionHistoryRef.current;
    history.push(motion);
    if (history.length > 30) history.shift();

    // Wave detection: count direction changes in motion level
    if (history.length >= 15 && !cooldownRef.current) {
      let directionChanges = 0;
      let increasing = true;
      for (let i = 1; i < history.length; i++) {
        const diff = history[i] - history[i - 1];
        if (increasing && diff < -5) { directionChanges++; increasing = false; }
        else if (!increasing && diff > 5) { directionChanges++; increasing = true; }
      }

      const avgMotion = history.reduce((a, b) => a + b, 0) / history.length;
      const isWave = directionChanges >= 3 && avgMotion > 15;

      setIsWaving(isWave);
      if (isWave) {
        setGestureDetected(true);
        cooldownRef.current = true;
        onGestureDetected?.();
        setTimeout(() => {
          cooldownRef.current = false;
          setGestureDetected(false);
          motionHistoryRef.current = [];
        }, 3000);
      }
    }

    rafRef.current = requestAnimationFrame(analyzeMotion);
  }, [videoRef, onGestureDetected]);

  useEffect(() => {
    if (!active) {
      cancelAnimationFrame(rafRef.current);
      return;
    }
    prevFrameRef.current = null;
    motionHistoryRef.current = [];
    rafRef.current = requestAnimationFrame(analyzeMotion);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active, analyzeMotion]);

  return { isWaving, motionLevel, gestureDetected };
}
