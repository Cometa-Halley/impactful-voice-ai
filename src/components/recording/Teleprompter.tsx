import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  script: string;
  currentWordIndex: number;
  isActive: boolean;
}

/**
 * Language-agnostic breath-aware splitter.
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

    if (endsWithPause && buf.length >= minWords) {
      flush();
      continue;
    }

    if (endsWithPause && nextIsUpper && buf.length >= 2) {
      flush();
      continue;
    }

    if (buf.length >= maxWords) {
      flush();
    }
  }

  flush();
  return lines;
}

export default function Teleprompter({ script, currentWordIndex, isActive }: Props) {
  const totalWords = useMemo(() => script.split(/\s+/).filter(Boolean).length, [script]);
  const lines = useMemo(() => splitIntoBreathLines(script), [script]);

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
      lineStartIndex: Math.max(0, totalWords - (lines[lines.length - 1]?.length ?? 0)),
    };
  }, [lines, currentWordIndex, totalWords]);

  const activeLine = lines[activeLineIndex] || [];
  const wordsReadInLine = Math.max(0, currentWordIndex - lineStartIndex);
  const lineProgress = activeLine.length > 0 ? wordsReadInLine / activeLine.length : 0;

  return (
    <div className="relative w-full">
      {/* Frosted backdrop */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-transparent backdrop-blur-md pointer-events-none" />

      <div className="relative z-[5] px-3 sm:px-6 py-3 sm:py-4 flex flex-col items-center gap-2">
        {/* Single breath-line with karaoke effect */}
        <AnimatePresence mode="wait">
          <motion.p
            key={activeLineIndex}
            initial={{ opacity: 0, y: 14, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -10, filter: 'blur(3px)' }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="text-center leading-relaxed"
          >
            {activeLine.map((word, i) => {
              const globalIdx = lineStartIndex + i;
              const isPast = globalIdx < currentWordIndex;
              const isCurrent = globalIdx === currentWordIndex;

              return (
                <motion.span
                  key={`${activeLineIndex}-${i}`}
                  animate={{
                    opacity: isPast ? 0.2 : 1,
                    scale: isCurrent ? 1.08 : 1,
                    y: isPast ? -2 : 0,
                  }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className={`inline-block mx-[3px] text-base sm:text-lg md:text-xl font-bold ${
                    isCurrent
                      ? 'text-primary drop-shadow-[0_0_16px_hsl(var(--primary)/0.9)]'
                      : isPast
                        ? 'text-primary/20'
                        : 'text-white/80'
                  }`}
                >
                  {word}
                </motion.span>
              );
            })}
          </motion.p>
        </AnimatePresence>

        {/* Line progress + overall progress */}
        {isActive && (
          <div className="w-full max-w-xs flex flex-col gap-1 items-center">
            {/* Line progress bar */}
            <div className="w-full h-[3px] bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-primary via-primary to-accent"
                animate={{ width: `${Math.min(lineProgress * 100, 100)}%` }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              />
            </div>
            {/* Overall progress (subtle) */}
            <div className="w-2/3 h-[1.5px] bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary/40 rounded-full"
                animate={{ width: `${(currentWordIndex / Math.max(totalWords, 1)) * 100}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
