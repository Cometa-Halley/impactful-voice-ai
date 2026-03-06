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

/** How many script words ahead we search for a match */
const SEARCH_WINDOW = 8;
/** Seconds of silence before fallback auto-advances one word */
const SILENCE_TIMEOUT_S = 4;
/** Seconds for initial grace period */
const INITIAL_GRACE_S = 6;
/** Levenshtein threshold relative to word length */
const LEVENSHTEIN_MAX_DIST = 2;
/** Delay before restarting recognition after it stops (ms) */
const RESTART_DELAY_MS = 150;

// ---- Utilities ----

function normalizeWord(w: string): string {
  return w
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .replace(/[^a-z0-9]/g, '');      // strip all punctuation
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  // Optimisation: if length difference alone exceeds threshold, skip
  if (Math.abs(a.length - b.length) > LEVENSHTEIN_MAX_DIST) return LEVENSHTEIN_MAX_DIST + 1;

  const matrix: number[][] = [];
  for (let i = 0; i <= a.length; i++) matrix[i] = [i];
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[a.length][b.length];
}

function fuzzyMatch(spoken: string, script: string): boolean {
  if (!spoken || !script) return false;
  if (spoken === script) return true;

  // Prefix / contains for longer words
  if (spoken.length >= 3 && script.startsWith(spoken)) return true;
  if (script.length >= 3 && spoken.startsWith(script)) return true;

  // Levenshtein for words >= 3 chars
  if (spoken.length >= 3 && script.length >= 3) {
    const maxDist = Math.min(LEVENSHTEIN_MAX_DIST, Math.floor(Math.max(spoken.length, script.length) / 3));
    return levenshtein(spoken, script) <= Math.max(1, maxDist);
  }

  return false;
}

// ---- Hook ----

export function useSpeechRecognition(words: string[]): SpeechRecognitionHook {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const wordIndexRef = useRef(0);
  const lastAdvanceTime = useRef(0);
  const fallbackTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const speechAvailable = useRef(true);
  const restartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pre-normalize all script words once
  const normalizedWords = useRef<string[]>([]);
  useEffect(() => {
    normalizedWords.current = words.map(normalizeWord);
  }, [words]);

  const isSupported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const advanceTo = useCallback((idx: number) => {
    if (idx > wordIndexRef.current && idx <= words.length) {
      wordIndexRef.current = idx;
      lastAdvanceTime.current = Date.now();
      setCurrentWordIndex(idx);
    }
  }, [words.length]);

  const matchWord = useCallback((spokenTranscript: string) => {
    const spokenWords = spokenTranscript.trim().split(/\s+/).map(normalizeWord).filter(w => w.length >= 2);
    if (!spokenWords.length) return;

    let bestIdx = wordIndexRef.current;
    const nw = normalizedWords.current;

    for (const sw of spokenWords) {
      const searchStart = bestIdx;
      const limit = Math.min(searchStart + SEARCH_WINDOW, nw.length);

      for (let j = searchStart; j < limit; j++) {
        if (fuzzyMatch(sw, nw[j])) {
          // Advance to after the matched word — allow jumping the full window
          bestIdx = j + 1;
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
  const stopFallback = useCallback(() => {
    if (fallbackTimerRef.current) {
      clearInterval(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
  }, []);

  const startFallback = useCallback(() => {
    stopFallback();
    lastAdvanceTime.current = Date.now() + (INITIAL_GRACE_S * 1000);

    fallbackTimerRef.current = setInterval(() => {
      const elapsed = (Date.now() - lastAdvanceTime.current) / 1000;
      if (elapsed >= SILENCE_TIMEOUT_S && wordIndexRef.current < words.length) {
        const next = wordIndexRef.current + 1;
        console.log(`[Karaoke] Fallback → advancing to ${next} (silence ${elapsed.toFixed(1)}s)`);
        advanceTo(next);
      }
    }, 1200);
  }, [words.length, advanceTo, stopFallback]);

  // ---------- Auto-restart helper ----------
  const scheduleRestart = useCallback((recognition: any) => {
    if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
    restartTimeoutRef.current = setTimeout(() => {
      if (recognitionRef.current === recognition) {
        try {
          recognition.start();
          console.log('[Karaoke] Auto-restarted recognition');
        } catch {
          // Will retry on next onend
        }
      }
    }, RESTART_DELAY_MS);
  }, []);

  // ---------- Start / Stop ----------
  const start = useCallback(() => {
    setError(null);

    if (wordIndexRef.current >= words.length) {
      wordIndexRef.current = 0;
      setCurrentWordIndex(0);
    }

    setTranscript('');
    lastAdvanceTime.current = Date.now();
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
        // Check all alternatives for best match
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
      // Auto-restart with a small delay to avoid rapid restart loops
      if (recognitionRef.current === recognition) {
        scheduleRestart(recognition);
      }
    };

    recognition.onerror = (e: any) => {
      if (e.error === 'not-allowed') {
        setError('microphone-blocked');
        speechAvailable.current = false;
        console.log('[Karaoke] Mic blocked — fallback timer active');
      } else if (e.error === 'service-not-available') {
        speechAvailable.current = false;
      } else if (e.error === 'no-speech' || e.error === 'aborted') {
        // These are normal — recognition will auto-restart via onend
        console.log(`[Karaoke] ${e.error} — will auto-restart`);
      } else {
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
  }, [isSupported, matchWord, words.length, startFallback, scheduleRestart]);

  const stop = useCallback(() => {
    stopFallback();
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
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
      if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
        recognitionRef.current = null;
      }
    };
  }, [stopFallback]);

  return { isListening, transcript, currentWordIndex, error, start, stop, isSupported };
}
