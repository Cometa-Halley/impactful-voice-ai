import { useMemo, useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  script: string;
  currentWordIndex: number;
  isActive: boolean;
}

/**
 * Splits script into short phrases (~6-8 words each) for single-line display.
 */
function splitIntoPhrases(text: string, maxWords = 7): string[][] {
  const words = text.split(/\s+/).filter(Boolean);
  const phrases: string[][] = [];
  for (let i = 0; i < words.length; i += maxWords) {
    phrases.push(words.slice(i, i + maxWords));
  }
  return phrases;
}

export default function Teleprompter({ script, currentWordIndex, isActive }: Props) {
  const words = useMemo(() => script.split(/\s+/).filter(Boolean), [script]);
  const phrases = useMemo(() => splitIntoPhrases(script, 7), [script]);

  // Find which phrase contains the current word
  const activePhraseIndex = useMemo(() => {
    let count = 0;
    for (let i = 0; i < phrases.length; i++) {
      count += phrases[i].length;
      if (currentWordIndex < count) return i;
    }
    return phrases.length - 1;
  }, [phrases, currentWordIndex]);

  // Word offset for the active phrase
  const phraseStartIndex = useMemo(() => {
    let count = 0;
    for (let i = 0; i < activePhraseIndex; i++) {
      count += phrases[i].length;
    }
    return count;
  }, [phrases, activePhraseIndex]);

  const activePhrase = phrases[activePhraseIndex] || [];

  return (
    <div className="relative w-full">
      {/* Blurred backdrop */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/50 to-transparent backdrop-blur-md pointer-events-none" />

      <div className="relative z-[5] px-4 py-4 sm:py-5 flex flex-col items-center gap-2">
        {/* Single active line */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activePhraseIndex}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="flex flex-wrap justify-center gap-x-1.5 gap-y-0.5"
          >
            {activePhrase.map((word, i) => {
              const globalIndex = phraseStartIndex + i;
              const isPast = globalIndex < currentWordIndex;
              const isCurrent = globalIndex === currentWordIndex;

              return (
                <span
                  key={`${activePhraseIndex}-${i}`}
                  className={`text-base sm:text-lg md:text-xl font-bold transition-all duration-200 ${
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
          </motion.div>
        </AnimatePresence>

        {/* Progress bar */}
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
