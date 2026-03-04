import { useMemo } from 'react';
import { motion } from 'framer-motion';

interface Props {
  script: string;
  currentWordIndex: number;
  isActive: boolean;
}

export default function Teleprompter({ script, currentWordIndex, isActive }: Props) {
  const words = useMemo(() => script.split(/\s+/).filter(Boolean), [script]);

  // Calculate which "line" we're on to auto-scroll
  const wordsPerLine = 8;
  const currentLine = Math.floor(currentWordIndex / wordsPerLine);

  return (
    <div className="relative h-full overflow-hidden rounded-xl bg-black/90 backdrop-blur-lg border border-border">
      {/* Gradient overlays for fade effect */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/90 to-transparent z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/90 to-transparent z-10 pointer-events-none" />

      {/* Center highlight bar */}
      <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-12 bg-primary/10 border-y border-primary/20 z-5 pointer-events-none" />

      <motion.div
        className="px-6 py-20 text-center"
        animate={{ y: -currentLine * 48 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      >
        <div className="flex flex-wrap justify-center gap-x-2 gap-y-3 leading-relaxed">
          {words.map((word, i) => {
            const isPast = i < currentWordIndex;
            const isCurrent = i === currentWordIndex;
            const isStageDirection = word.startsWith('[') || word.endsWith(']');

            return (
              <span
                key={i}
                className={`text-2xl md:text-3xl font-semibold transition-all duration-200 ${
                  isStageDirection
                    ? 'text-accent/60 italic text-lg md:text-xl'
                    : isCurrent
                      ? 'text-primary scale-110 drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)]'
                      : isPast
                        ? 'text-foreground/40'
                        : 'text-foreground/90'
                }`}
              >
                {word}
              </span>
            );
          })}
        </div>
      </motion.div>

      {/* Progress bar */}
      {isActive && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted z-20">
          <motion.div
            className="h-full bg-primary"
            animate={{ width: `${(currentWordIndex / Math.max(words.length, 1)) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      )}
    </div>
  );
}
