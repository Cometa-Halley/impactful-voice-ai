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
    <div className="relative w-full overflow-hidden">
      {/* Blurred gradient background — fades into camera */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-transparent backdrop-blur-sm pointer-events-none" />

      {/* Bottom fade edge */}
      <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-transparent to-transparent pointer-events-none z-10" />

      <div
        ref={containerRef}
        className="relative z-[5] px-4 py-6 overflow-y-auto max-h-[18vh] scrollbar-hide"
        style={{ scrollbarWidth: 'none' }}
      >
        <div className="flex flex-wrap justify-center gap-x-1.5 gap-y-1 leading-relaxed">
          {words.map((word, i) => {
            const isPast = i < currentWordIndex;
            const isCurrent = i === currentWordIndex;

            return (
              <span
                key={i}
                ref={isCurrent ? currentWordRef : undefined}
                className={`text-lg md:text-xl font-bold transition-all duration-200 ${
                  isCurrent
                    ? 'text-primary scale-110 drop-shadow-[0_0_12px_hsl(var(--primary)/0.7)]'
                    : isPast
                      ? 'text-primary/30'
                      : 'text-white/70'
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
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10 z-20">
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
