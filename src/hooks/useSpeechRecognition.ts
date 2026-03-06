import { useState, useEffect, useRef, useCallback } from 'react';

interface SpeechRecognitionHook {
  isListening: boolean;
  transcript: string;
  currentWordIndex: number;
  error: string | null;
  start: () => void;
  stop: () => void;
  isSupported: boolean;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

const SEARCH_WINDOW = 6;
/** Seconds of silence before fallback auto-advances one word */
const SILENCE_TIMEOUT_S = 4;
/** Seconds for initial grace period (user may need time to start reading) */
const INITIAL_GRACE_S = 6;

export function useSpeechRecognition(words: string[]): SpeechRecognitionHook {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const wordIndexRef = useRef(0);
  const lastAdvanceTime = useRef(0);
  const fallbackTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const speechAvailable = useRef(true); // tracks whether speech recognition is working

  const isSupported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const normalizeWord = (w: string) =>
    w.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/gi, '');

  const fuzzyMatch = (spoken: string, script: string): boolean => {
    if (!spoken || !script) return false;
    if (spoken === script) return true;
    // Only prefix match for longer words to avoid false positives
    if (spoken.length >= 4 && script.startsWith(spoken)) return true;
    if (script.length >= 4 && spoken.startsWith(script)) return true;
    // Allow 1 character mismatch for words >= 5 chars
    if (spoken.length >= 5 && script.length >= 5 && Math.abs(spoken.length - script.length) <= 1) {
      let mismatches = 0;
      const minLen = Math.min(spoken.length, script.length);
      for (let i = 0; i < minLen; i++) {
        if (spoken[i] !== script[i]) mismatches++;
        if (mismatches > 1) return false;
      }
      return mismatches <= 1;
    }
    return false;
  };

  const advanceTo = useCallback((idx: number) => {
    if (idx > wordIndexRef.current && idx <= words.length) {
      wordIndexRef.current = idx;
      lastAdvanceTime.current = Date.now();
      setCurrentWordIndex(idx);
    }
  }, [words.length]);

  const matchWord = useCallback((spokenTranscript: string) => {
    const spokenWords = spokenTranscript.trim().split(/\s+/).map(normalizeWord).filter(Boolean);
    if (!spokenWords.length) return;

    let bestIdx = wordIndexRef.current;

    for (const sw of spokenWords) {
      if (sw.length < 2) continue;
      const searchStart = bestIdx;
      const limit = Math.min(searchStart + SEARCH_WINDOW, words.length);
      for (let j = searchStart; j < limit; j++) {
        const scriptWord = normalizeWord(words[j]);
        if (fuzzyMatch(sw, scriptWord)) {
          // Cap advance to max 2 words at a time to prevent skipping
          bestIdx = Math.min(j + 1, bestIdx + 2);
          break;
        }
      }
    }

    if (bestIdx > wordIndexRef.current) {
      console.log(`[Karaoke] Voice → ${wordIndexRef.current} → ${bestIdx}`);
      advanceTo(bestIdx);
    }
  }, [words, advanceTo]);

  // ---------- Fallback timer ----------
  const startFallback = useCallback(() => {
    stopFallback();
    lastAdvanceTime.current = Date.now() + (INITIAL_GRACE_S * 1000); // grace period

    fallbackTimerRef.current = setInterval(() => {
      const now = Date.now();
      const elapsed = (now - lastAdvanceTime.current) / 1000;

      // Only advance on silence if enough time has passed
      if (elapsed >= SILENCE_TIMEOUT_S && wordIndexRef.current < words.length) {
        const next = wordIndexRef.current + 1;
        console.log(`[Karaoke] Fallback → advancing to ${next} (silence ${elapsed.toFixed(1)}s)`);
        advanceTo(next);
      }
    }, 1200);
  }, [words.length, advanceTo]);

  const stopFallback = useCallback(() => {
    if (fallbackTimerRef.current) {
      clearInterval(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
  }, []);

  // ---------- Start / Stop ----------
  const start = useCallback(() => {
    setError(null);

    // Reset index only if we've reached the end
    if (wordIndexRef.current >= words.length) {
      wordIndexRef.current = 0;
      setCurrentWordIndex(0);
    }

    setTranscript('');
    lastAdvanceTime.current = Date.now();

    // Always start the fallback timer
    startFallback();

    if (!isSupported) {
      speechAvailable.current = false;
      setIsListening(true);
      console.log('[Karaoke] No speech API — using fallback timer only');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'es-ES';
    recognition.maxAlternatives = 3;

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        for (let alt = 0; alt < e.results[i].length; alt++) {
          const text = e.results[i][alt].transcript;
          if (text.trim()) matchWord(text);
        }
        if (!e.results[i].isFinal) {
          setTranscript(e.results[i][0].transcript);
        }
      }
    };

    recognition.onend = () => {
      // Auto-restart if still active
      if (recognitionRef.current) {
        try { recognition.start(); } catch {}
      }
    };

    recognition.onerror = (e: any) => {
      if (e.error === 'not-allowed') {
        setError('microphone-blocked');
        speechAvailable.current = false;
        // Keep fallback running
        console.log('[Karaoke] Mic blocked — fallback timer active');
      } else if (e.error === 'not-allowed' || e.error === 'service-not-available') {
        speechAvailable.current = false;
      } else if (e.error !== 'no-speech' && e.error !== 'aborted') {
        console.error('[Karaoke] Speech error:', e.error);
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      speechAvailable.current = false;
      console.log('[Karaoke] Speech start failed — fallback only');
    }
    setIsListening(true);
    console.log('[Karaoke] Started. Words:', words.length);
  }, [isSupported, matchWord, words.length, startFallback]);

  const stop = useCallback(() => {
    stopFallback();
    if (recognitionRef.current) {
      const r = recognitionRef.current;
      recognitionRef.current = null;
      try { r.stop(); } catch {}
    }
    setIsListening(false);
    console.log('[Karaoke] Stopped at word:', wordIndexRef.current);
  }, [stopFallback]);

  useEffect(() => {
    return () => {
      stopFallback();
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
        recognitionRef.current = null;
      }
    };
  }, [stopFallback]);

  return { isListening, transcript, currentWordIndex, error, start, stop, isSupported };
}
