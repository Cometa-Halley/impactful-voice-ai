import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  script: string;
  currentWordIndex: number;
  isActive: boolean;
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
    <div className="absolute top-0 left-0 right-0 z-20 flex flex-col items-center pt-2 sm:pt-3 px-2 sm:px-4 pointer-events-none">
      {/* Pill container */}
      <div className="relative max-w-[92%] sm:max-w-[80%] md:max-w-[70%]">
        {/* Dark pill background */}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-lg rounded-xl border border-white/[0.06]" />

        <div className="relative z-[1] px-4 sm:px-6 py-2.5 sm:py-3 flex flex-col items-center gap-1.5">
          {/* Active line — karaoke */}
          <AnimatePresence mode="wait">
            <motion.p
              key={activeLineIndex}
              initial={{ opacity: 0, y: 8, filter: 'blur(3px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -6, filter: 'blur(2px)' }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="text-center leading-snug whitespace-normal"
            >
              {activeLine.map((word, i) => {
                const globalIdx = lineStartIndex + i;
                const isPast = globalIdx < currentWordIndex;
                const isCurrent = globalIdx === currentWordIndex;

                return (
                  <motion.span
                    key={`${activeLineIndex}-${i}`}
                    animate={{
                      opacity: isPast ? 0.18 : 1,
                      scale: isCurrent ? 1.06 : 1,
                      y: isPast ? -1 : 0,
                    }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                    className={`inline-block mx-[2px] sm:mx-[3px] text-sm sm:text-base md:text-lg font-bold tracking-wide ${
                      isCurrent
                        ? 'text-primary drop-shadow-[0_0_12px_hsl(var(--primary)/0.85)]'
                        : isPast
                          ? 'text-primary/20'
                          : 'text-white/90'
                    }`}
                  >
                    {word}
                  </motion.span>
                );
              })}
            </motion.p>
          </AnimatePresence>

          {/* Line progress bar */}
          {isActive && (
            <div className="w-full max-w-[12rem] h-[2px] bg-white/[0.08] rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                animate={{ width: `${Math.min(lineProgress * 100, 100)}%` }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Overall progress — very subtle, below the pill */}
      {isActive && (
        <div className="mt-1 w-1/3 max-w-[8rem] h-[1px] bg-white/[0.04] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary/30 rounded-full"
            animate={{ width: `${(currentWordIndex / Math.max(totalWords, 1)) * 100}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      )}
    </div>
  );
}
