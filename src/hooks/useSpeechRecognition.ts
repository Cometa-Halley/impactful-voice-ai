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

const SEARCH_WINDOW = 15;

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
    w.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // strip accents for comparison
      .replace(/[^a-z0-9]/gi, '');

  const fuzzyMatch = (spoken: string, script: string): boolean => {
    if (!spoken || !script) return false;
    if (spoken === script) return true;
    if (script.startsWith(spoken) || spoken.startsWith(script)) return true;
    if (script.length > 2 && spoken.includes(script)) return true;
    if (spoken.length > 2 && script.includes(spoken)) return true;
    // Levenshtein-lite: allow 1 char difference for words > 4 chars
    if (spoken.length > 4 && script.length > 4 && Math.abs(spoken.length - script.length) <= 2) {
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

  const matchWord = useCallback((spokenTranscript: string) => {
    const spokenWords = spokenTranscript.trim().split(/\s+/).map(normalizeWord).filter(Boolean);
    if (!spokenWords.length) return;

    let bestIdx = wordIndexRef.current;

    // Try each spoken word (forward) to advance the cursor as far as possible
    for (const sw of spokenWords) {
      if (sw.length < 2) continue; // skip tiny filler words
      const searchStart = bestIdx;
      const limit = Math.min(searchStart + SEARCH_WINDOW, words.length);
      for (let j = searchStart; j < limit; j++) {
        const scriptWord = normalizeWord(words[j]);
        if (fuzzyMatch(sw, scriptWord)) {
          bestIdx = j + 1;
          break;
        }
      }
    }

    if (bestIdx > wordIndexRef.current) {
      console.log(`[Karaoke] Advanced ${wordIndexRef.current} → ${bestIdx} (spoken: "${spokenTranscript.slice(-40)}")`);
      wordIndexRef.current = bestIdx;
      setCurrentWordIndex(bestIdx);
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
    recognition.maxAlternatives = 3;

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        // Try all alternatives for better matching
        for (let alt = 0; alt < e.results[i].length; alt++) {
          const text = e.results[i][alt].transcript;
          if (text.trim()) {
            matchWord(text);
          }
        }
        if (!e.results[i].isFinal) {
          setTranscript(e.results[i][0].transcript);
        }
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
    console.log('[Karaoke] Speech recognition started. Words to track:', words.length);
  }, [isSupported, matchWord, words.length]);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      const r = recognitionRef.current;
      recognitionRef.current = null;
      r.stop();
      setIsListening(false);
      console.log('[Karaoke] Speech recognition stopped at word index:', wordIndexRef.current);
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
