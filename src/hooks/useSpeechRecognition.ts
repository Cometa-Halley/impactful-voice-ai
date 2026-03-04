import { useState, useEffect, useRef, useCallback } from 'react';

interface SpeechRecognitionHook {
  isListening: boolean;
  transcript: string;
  currentWordIndex: number;
  start: () => void;
  stop: () => void;
  isSupported: boolean;
}

// Extend Window for SpeechRecognition
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

export function useSpeechRecognition(words: string[]): SpeechRecognitionHook {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const recognitionRef = useRef<any>(null);
  const wordIndexRef = useRef(0);

  const isSupported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const normalizeWord = (w: string) =>
    w.toLowerCase().replace(/[^a-záéíóúüñ\w]/gi, '');

  const matchWord = useCallback((spoken: string) => {
    const spokenWords = spoken.trim().split(/\s+/).map(normalizeWord).filter(Boolean);
    if (!spokenWords.length) return;

    // Try to match spoken words against script words starting from current index
    let idx = wordIndexRef.current;
    for (const sw of spokenWords) {
      // Look ahead up to 3 words for fuzzy matching
      for (let offset = 0; offset < 4 && idx + offset < words.length; offset++) {
        const scriptWord = normalizeWord(words[idx + offset]);
        if (scriptWord === sw || scriptWord.startsWith(sw) || sw.startsWith(scriptWord)) {
          idx = idx + offset + 1;
          break;
        }
      }
    }
    if (idx !== wordIndexRef.current) {
      wordIndexRef.current = idx;
      setCurrentWordIndex(idx);
    }
  }, [words]);

  const start = useCallback(() => {
    if (!isSupported) return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'es-ES'; // Default to Spanish, can be made configurable

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
      // Auto-restart if still listening
      if (recognitionRef.current) {
        try { recognition.start(); } catch {}
      }
    };

    recognition.onerror = (e: any) => {
      if (e.error !== 'no-speech' && e.error !== 'aborted') {
        console.error('Speech recognition error:', e.error);
      }
    };

    recognitionRef.current = recognition;
    wordIndexRef.current = 0;
    setCurrentWordIndex(0);
    setTranscript('');
    recognition.start();
    setIsListening(true);
  }, [isSupported, matchWord]);

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

  return { isListening, transcript, currentWordIndex, start, stop, isSupported };
}
