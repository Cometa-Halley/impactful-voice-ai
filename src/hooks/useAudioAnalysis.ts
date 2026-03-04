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

    let quality: AudioQuality['quality'] = 'silent';
    if (level > 5 && level < 70 && !clipping) quality = 'good';
    else if (level >= 70 || clipping) quality = 'fair';
    else if (level > 2) quality = 'poor';

    setAudioQuality({ level, noiseFloor, quality, clipping });
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

    rafRef.current = requestAnimationFrame(analyze);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ctx.close();
    };
  }, [stream, analyze]);

  return audioQuality;
}
