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

const SEARCH_WINDOW = 10;

export function useSpeechRecognition(words: string[]): SpeechRecognitionHook {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const wordIndexRef = useRef(0);

  const isSupported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const normalizeWord = (w: string) =>
    w.toLowerCase().replace(/[^a-záéíóúüñ\w]/gi, '');

  const fuzzyMatch = (spoken: string, script: string): boolean => {
    if (!spoken || !script) return false;
    if (spoken === script) return true;
    if (script.startsWith(spoken) || spoken.startsWith(script)) return true;
    // Tolerant inclusion for words > 3 chars
    if (script.length > 3 && spoken.includes(script)) return true;
    if (spoken.length > 3 && script.includes(spoken)) return true;
    return false;
  };

  const matchWord = useCallback((spokenTranscript: string) => {
    const spokenWords = spokenTranscript.trim().split(/\s+/).map(normalizeWord).filter(Boolean);
    if (!spokenWords.length) return;

    let idx = wordIndexRef.current;

    // Process spoken words in REVERSE so we jump to the furthest match
    for (let s = spokenWords.length - 1; s >= 0; s--) {
      const sw = spokenWords[s];
      const limit = Math.min(idx + SEARCH_WINDOW, words.length);
      let found = false;
      for (let offset = 0; idx + offset < limit; offset++) {
        const scriptWord = normalizeWord(words[idx + offset]);
        if (fuzzyMatch(sw, scriptWord)) {
          idx = idx + offset + 1;
          found = true;
          break;
        }
      }
      if (found) break; // We matched the latest spoken word, stop
    }

    if (idx !== wordIndexRef.current) {
      wordIndexRef.current = idx;
      setCurrentWordIndex(idx);
    }
  }, [words]);

  const start = useCallback(() => {
    if (!isSupported) return;
    setError(null);
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'es-ES';

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const text = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          matchWord(text);
        } else {
          interim = text;
        }
      }
      if (interim) {
        setTranscript(interim);
        matchWord(interim);
      }
    };

    recognition.onend = () => {
      if (recognitionRef.current) {
        try { recognition.start(); } catch {}
      }
    };

    recognition.onerror = (e: any) => {
      if (e.error === 'not-allowed') {
        setError('microphone-blocked');
        stop();
      } else if (e.error !== 'no-speech' && e.error !== 'aborted') {
        console.error('Speech recognition error:', e.error);
      }
    };

    recognitionRef.current = recognition;

    // Resume: only reset index if we've reached the end
    if (wordIndexRef.current >= words.length) {
      wordIndexRef.current = 0;
      setCurrentWordIndex(0);
    }

    setTranscript('');
    recognition.start();
    setIsListening(true);
  }, [isSupported, matchWord, words.length]);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      const r = recognitionRef.current;
      recognitionRef.current = null;
      r.stop();
      setIsListening(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, []);

  return { isListening, transcript, currentWordIndex, error, start, stop, isSupported };
}
