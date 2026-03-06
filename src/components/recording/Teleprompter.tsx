import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  script: string;
  currentWordIndex: number;
  isActive: boolean;
}

const SYLLABLES_PER_2S = 9; // 9 syllables every 2 seconds

function countSyllables(text: string): number {
  const clean = text.toLowerCase().replace(/[^a-záéíóúüàèìòùâêîôûäëïöü]/g, ' ');
  const matches = clean.match(/[aeiouyáéíóúüàèìòùâêîôûäëïöü]+/gi);
  return matches ? matches.length : 1;
}

function lineDurationMs(words: string[]): number {
  const syllables = words.reduce((sum, w) => sum + countSyllables(w), 0);
  const ms = (syllables / SYLLABLES_PER_2S) * 2000;
  return Math.max(2000, Math.round(ms));
}

function splitIntoBreathLines(text: string, maxWords = 8, minWords = 3): string[][] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const lines: string[][] = [];
  let buf: string[] = [];

  const flush = () => {
    if (buf.length > 0) {
      lines.push([...buf]);
      buf = [];
    }
  };

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    buf.push(word);

    const endsWithPause = /[.!?;:,\u2014\u2013–—]$/.test(word);
    const nextIsUpper =
      i + 1 < words.length && /^[A-ZÁÉÍÓÚÑ¿¡]/.test(words[i + 1]);

    if (endsWithPause && buf.length >= minWords) { flush(); continue; }
    if (endsWithPause && nextIsUpper && buf.length >= 2) { flush(); continue; }
    if (buf.length >= maxWords) { flush(); }
  }

  flush();
  return lines;
}

export default function Teleprompter({ script, currentWordIndex, isActive }: Props) {
  const lines = useMemo(() => splitIntoBreathLines(script), [script]);
  const [timedLineIndex, setTimedLineIndex] = useState(0);

  const currentDuration = useMemo(
    () => lines[timedLineIndex] ? lineDurationMs(lines[timedLineIndex]) : 2000,
    [lines, timedLineIndex]
  );

  // Auto-advance based on syllable-calculated duration
  useEffect(() => {
    if (!isActive || lines.length === 0) return;
    setTimedLineIndex(0);
  }, [isActive, lines.length]);

  useEffect(() => {
    if (!isActive || lines.length === 0) return;
    if (timedLineIndex >= lines.length) return;

    const timeout = setTimeout(() => {
      setTimedLineIndex(prev => (prev >= lines.length - 1 ? prev : prev + 1));
    }, lineDurationMs(lines[timedLineIndex]));

    return () => clearTimeout(timeout);
  }, [isActive, lines, timedLineIndex]);

  // Reset when not active
  useEffect(() => {
    if (!isActive) setTimedLineIndex(0);
  }, [isActive]);

  const activeLineIndex = isActive ? timedLineIndex : 0;
  const activeLine = lines[activeLineIndex] || [];
  const nextLine = lines[activeLineIndex + 1] || [];

  return (
    <div className="absolute top-0 left-0 right-0 z-20 flex flex-col items-center pt-2 sm:pt-3 px-2 sm:px-4 pointer-events-none">
      {/* Pill container */}
      <div className="relative max-w-[92%] sm:max-w-[80%] md:max-w-[70%]">
        {/* Dark pill background */}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-lg rounded-xl border border-white/[0.06]" />

        <div className="relative z-[1] px-4 sm:px-6 py-2.5 sm:py-3 flex flex-col items-center gap-1.5">
          {/* Active line */}
          <AnimatePresence mode="wait">
            <motion.p
              key={activeLineIndex}
              initial={{ opacity: 0, y: 8, filter: 'blur(3px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -6, filter: 'blur(2px)' }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="text-center leading-snug whitespace-normal"
            >
              {activeLine.map((word, i) => (
                <span
                  key={`${activeLineIndex}-${i}`}
                  className="inline-block mx-[2px] sm:mx-[3px] text-sm sm:text-base md:text-lg font-bold tracking-wide text-white"
                >
                  {word}
                </span>
              ))}
            </motion.p>
          </AnimatePresence>

          {/* Line progress bar — fills over 3s */}
          {isActive && (
            <div className="w-full max-w-[12rem] h-[2px] bg-white/[0.08] rounded-full overflow-hidden">
              <motion.div
                key={activeLineIndex}
                className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: currentDuration / 1000, ease: 'linear' }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Overall progress */}
      {isActive && lines.length > 1 && (
        <div className="mt-1 w-1/3 max-w-[8rem] h-[1px] bg-white/[0.04] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary/30 rounded-full"
            animate={{ width: `${((activeLineIndex + 1) / lines.length) * 100}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      )}
    </div>
  );
}
