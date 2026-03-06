import { useState, useEffect, useRef, useCallback } from 'react';

export interface AudioQuality {
  level: number; // 0-100 current volume
  noiseFloor: number; // 0-100 ambient noise
  quality: 'good' | 'fair' | 'poor' | 'silent';
  clipping: boolean;
}

export function useAudioAnalysis(stream: MediaStream | null) {
  const [audioQuality, setAudioQuality] = useState<AudioQuality>({
    level: 0, noiseFloor: 0, quality: 'silent', clipping: false,
  });
  const contextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number>(0);
  const noiseHistoryRef = useRef<number[]>([]);
  // Debounce: hold the "displayed" quality to avoid flickering
  const debouncedQualityRef = useRef<AudioQuality['quality']>('silent');
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const analyze = useCallback(() => {
    if (!analyserRef.current) return;
    const analyser = analyserRef.current;
    const data = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(data);

    let sum = 0;
    let peak = 0;
    for (let i = 0; i < data.length; i++) {
      const v = Math.abs(data[i] - 128);
      sum += v;
      if (v > peak) peak = v;
    }
    const avg = sum / data.length;
    const level = Math.min(100, Math.round((avg / 128) * 300));
    const clipping = peak > 120;

    // Track noise floor (rolling average of quiet moments)
    const history = noiseHistoryRef.current;
    history.push(level);
    if (history.length > 60) history.shift();
    const noiseFloor = Math.round(history.reduce((a, b) => a + b, 0) / history.length);

    // Compute raw quality
    let rawQuality: AudioQuality['quality'] = 'silent';
    if (level > 5 && level < 70 && !clipping) rawQuality = 'good';
    else if (level >= 70 || clipping) rawQuality = 'fair';
    else if (level > 2) rawQuality = 'poor';

    // Debounce logic: upgrade immediately, downgrade after 2s
    const isOptimal = rawQuality === 'good' || rawQuality === 'fair';
    const wasOptimal = debouncedQualityRef.current === 'good' || debouncedQualityRef.current === 'fair';

    if (isOptimal) {
      // Immediately show good state & clear any pending downgrade
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      debouncedQualityRef.current = rawQuality;
      setAudioQuality({ level, noiseFloor, quality: rawQuality, clipping });
    } else if (wasOptimal) {
      // Was optimal, now dropped — start 2s timer before downgrading
      if (!silenceTimerRef.current) {
        silenceTimerRef.current = setTimeout(() => {
          debouncedQualityRef.current = rawQuality;
          silenceTimerRef.current = null;
        }, 2000);
      }
      // Keep showing the old optimal quality while timer is pending
      setAudioQuality({ level, noiseFloor, quality: debouncedQualityRef.current, clipping });
    } else {
      // Was already non-optimal — update freely
      debouncedQualityRef.current = rawQuality;
      setAudioQuality({ level, noiseFloor, quality: rawQuality, clipping });
    }

    rafRef.current = requestAnimationFrame(analyze);
  }, []);

  useEffect(() => {
    if (!stream) return;
    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) return;

    const ctx = new AudioContext();
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser);

    contextRef.current = ctx;
    analyserRef.current = analyser;
    noiseHistoryRef.current = [];
    debouncedQualityRef.current = 'silent';

    rafRef.current = requestAnimationFrame(analyze);

    return () => {
      cancelAnimationFrame(rafRef.current);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      ctx.close();
    };
  }, [stream, analyze]);

  return audioQuality;
}
