import { useState, useEffect, useRef, useCallback } from 'react';

export interface LightingQuality {
  brightness: number; // 0-255
  contrast: number; // 0-100
  visualNoise: number; // 0-100
  quality: 'good' | 'fair' | 'poor';
}

export function useLightingDetection(videoRef: React.RefObject<HTMLVideoElement>, active: boolean) {
  const [lighting, setLighting] = useState<LightingQuality>({
    brightness: 0, contrast: 0, visualNoise: 0, quality: 'poor',
  });
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const prevFrameRef = useRef<Uint8ClampedArray | null>(null);
  const rafRef = useRef<number>(0);

  const analyzeFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(analyzeFrame);
      return;
    }

    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Downsample for performance
    const w = 160;
    const h = 120;
    canvas.width = w;
    canvas.height = h;
    ctx.drawImage(video, 0, 0, w, h);
    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;

    // Calculate brightness (luminance) and contrast
    let totalBrightness = 0;
    const brightnesses: number[] = [];
    for (let i = 0; i < data.length; i += 4) {
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      totalBrightness += lum;
      brightnesses.push(lum);
    }
    const pixelCount = brightnesses.length;
    const avgBrightness = totalBrightness / pixelCount;

    // Standard deviation for contrast
    let sumSq = 0;
    for (const b of brightnesses) {
      sumSq += (b - avgBrightness) ** 2;
    }
    const stdDev = Math.sqrt(sumSq / pixelCount);
    const contrast = Math.min(100, Math.round((stdDev / 128) * 100));

    // Visual noise: compare to previous frame
    let visualNoise = 0;
    if (prevFrameRef.current && prevFrameRef.current.length === data.length) {
      let diff = 0;
      for (let i = 0; i < data.length; i += 4) {
        diff += Math.abs(data[i] - prevFrameRef.current[i]);
        diff += Math.abs(data[i + 1] - prevFrameRef.current[i + 1]);
        diff += Math.abs(data[i + 2] - prevFrameRef.current[i + 2]);
      }
      visualNoise = Math.min(100, Math.round((diff / (pixelCount * 3)) * 5));
    }
    prevFrameRef.current = new Uint8ClampedArray(data);

    // Determine quality
    let quality: LightingQuality['quality'] = 'poor';
    if (avgBrightness > 80 && avgBrightness < 200 && contrast > 15 && visualNoise < 30) {
      quality = 'good';
    } else if (avgBrightness > 50 && avgBrightness < 220 && visualNoise < 50) {
      quality = 'fair';
    }

    setLighting({
      brightness: Math.round(avgBrightness),
      contrast,
      visualNoise,
      quality,
    });

    rafRef.current = requestAnimationFrame(analyzeFrame);
  }, [videoRef]);

  useEffect(() => {
    if (!active) return;
    rafRef.current = requestAnimationFrame(analyzeFrame);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active, analyzeFrame]);

  return lighting;
}
