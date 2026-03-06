import { useMemo, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface Props {
  script: string;
  currentWordIndex: number;
  isActive: boolean;
}

export default function Teleprompter({ script, currentWordIndex, isActive }: Props) {
  const words = useMemo(() => script.split(/\s+/).filter(Boolean), [script]);
  const currentWordRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to keep current word centered
  useEffect(() => {
    if (currentWordRef.current && containerRef.current) {
      const container = containerRef.current;
      const word = currentWordRef.current;
      const containerRect = container.getBoundingClientRect();
      const wordRect = word.getBoundingClientRect();
      const offset = wordRect.top - containerRect.top - containerRect.height / 2 + wordRect.height / 2;
      container.scrollBy({ top: offset, behavior: 'smooth' });
    }
  }, [currentWordIndex]);

  return (
    <div className="relative w-full overflow-hidden rounded-xl bg-black/90 backdrop-blur-lg border border-border">
      {/* Gradient overlays for fade effect */}
      <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-black/90 to-transparent z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-black/90 to-transparent z-10 pointer-events-none" />

      <div
        ref={containerRef}
        className="px-6 py-12 overflow-y-auto max-h-[30vh] scrollbar-hide"
        style={{ scrollbarWidth: 'none' }}
      >
        <div className="flex flex-wrap justify-center gap-x-2 gap-y-2 leading-relaxed">
          {words.map((word, i) => {
            const isPast = i < currentWordIndex;
            const isCurrent = i === currentWordIndex;

            return (
              <span
                key={i}
                ref={isCurrent ? currentWordRef : undefined}
                className={`text-xl md:text-2xl font-semibold transition-all duration-200 ${
                  isCurrent
                    ? 'text-primary scale-110 drop-shadow-[0_0_12px_hsl(var(--primary)/0.6)]'
                    : isPast
                      ? 'text-foreground/30'
                      : 'text-foreground/80'
                }`}
              >
                {word}
              </span>
            );
          })}
        </div>
      </div>

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
