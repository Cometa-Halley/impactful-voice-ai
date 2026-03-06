import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  script: string;
  currentWordIndex: number;
  isActive: boolean;
}

/**
 * Language-agnostic breath-aware splitter.
 * Splits on punctuation boundaries first, then enforces a max word limit
 * so every line stays comfortable to read aloud in one breath.
 */
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

    // Break after punctuation if we have enough words
    if (endsWithPause && buf.length >= minWords) {
      flush();
      continue;
    }

    // Break before a new sentence (uppercase after non-comma punctuation)
    if (endsWithPause && nextIsUpper && buf.length >= 2) {
      flush();
      continue;
    }

    // Hard limit: force break at maxWords
    if (buf.length >= maxWords) {
      flush();
    }
  }

  flush();
  return lines;
}

export default function Teleprompter({ script, currentWordIndex, isActive }: Props) {
  const words = useMemo(() => script.split(/\s+/).filter(Boolean), [script]);
  const lines = useMemo(() => splitIntoBreathLines(script), [script]);

  // Which line contains the current word?
  const { activeLineIndex, lineStartIndex } = useMemo(() => {
    let count = 0;
    for (let i = 0; i < lines.length; i++) {
      if (currentWordIndex < count + lines[i].length) {
        return { activeLineIndex: i, lineStartIndex: count };
      }
      count += lines[i].length;
    }
    return {
      activeLineIndex: lines.length - 1,
      lineStartIndex: Math.max(0, words.length - (lines[lines.length - 1]?.length ?? 0)),
    };
  }, [lines, currentWordIndex, words.length]);

  const activeLine = lines[activeLineIndex] || [];

  return (
    <div className="relative w-full">
      {/* Frosted backdrop */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-transparent backdrop-blur-md pointer-events-none" />

      <div className="relative z-[5] px-3 sm:px-6 py-3 sm:py-4 flex flex-col items-center gap-2">
        {/* Single breath-line */}
        <AnimatePresence mode="wait">
          <motion.p
            key={activeLineIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="text-center leading-snug"
          >
            {activeLine.map((word, i) => {
              const globalIdx = lineStartIndex + i;
              const isPast = globalIdx < currentWordIndex;
              const isCurrent = globalIdx === currentWordIndex;

              return (
                <span
                  key={`${activeLineIndex}-${i}`}
                  className={`inline-block mx-[2px] text-base sm:text-lg md:text-xl font-bold transition-all duration-200 ${
                    isCurrent
                      ? 'text-primary scale-110 drop-shadow-[0_0_14px_hsl(var(--primary)/0.8)]'
                      : isPast
                        ? 'text-primary/30'
                        : 'text-white/80'
                  }`}
                >
                  {word}
                </span>
              );
            })}
          </motion.p>
        </AnimatePresence>

        {/* Progress */}
        {isActive && (
          <div className="w-full max-w-xs h-0.5 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              animate={{ width: `${(currentWordIndex / Math.max(words.length, 1)) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
