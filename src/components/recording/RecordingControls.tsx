import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Circle, Square, Pause, Play, Hand, Timer } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  isRecording: boolean;
  isPaused: boolean;
  gestureReady: boolean;
  onStart: () => void;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
  duration: number; // seconds elapsed
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

export default function RecordingControls({
  isRecording, isPaused, gestureReady, onStart, onStop, onPause, onResume, duration,
}: Props) {
  const { t } = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-center gap-4"
    >
      {!isRecording ? (
        <div className="flex flex-col items-center gap-3">
          <Button
            size="lg"
            onClick={onStart}
            className="h-16 w-16 rounded-full bg-destructive hover:bg-destructive/90 glow-gold"
          >
            <Circle className="h-6 w-6 fill-current" />
          </Button>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {gestureReady && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full"
              >
                <Hand className="h-3 w-3" />
                <span>{t('recording.waveToStart')}</span>
              </motion.div>
            )}
            <span>{t('recording.orPress')}</span>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          {/* Timer */}
          <div className="flex items-center gap-2 bg-secondary/80 backdrop-blur px-4 py-2 rounded-full">
            <motion.div
              className="h-2 w-2 rounded-full bg-destructive"
              animate={{ opacity: isPaused ? 0.3 : [1, 0.3, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
            />
            <Timer className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-mono font-medium text-foreground">{formatTime(duration)}</span>
          </div>

          {/* Pause/Resume */}
          <Button
            size="icon"
            variant="outline"
            onClick={isPaused ? onResume : onPause}
            className="h-12 w-12 rounded-full"
          >
            {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
          </Button>

          {/* Stop */}
          <Button
            size="icon"
            onClick={onStop}
            className="h-14 w-14 rounded-full bg-destructive hover:bg-destructive/90"
          >
            <Square className="h-5 w-5 fill-current" />
          </Button>
        </div>
      )}
    </motion.div>
  );
}
