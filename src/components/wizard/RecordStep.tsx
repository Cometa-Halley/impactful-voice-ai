import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Hand, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVideoFlowStore } from '@/stores/videoFlowStore';
import { useMediaDevices } from '@/hooks/useMediaDevices';
import { useAudioAnalysis } from '@/hooks/useAudioAnalysis';
import { useLightingDetection } from '@/hooks/useLightingDetection';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useGestureDetection } from '@/hooks/useGestureDetection';
import { cleanScriptForTeleprompter } from '@/lib/clean-script';
import PreRecordingChecks from '@/components/recording/PreRecordingChecks';
import RecordingControls from '@/components/recording/RecordingControls';
import Teleprompter from '@/components/recording/Teleprompter';

const COUNTDOWN_SECONDS = 5;

type RecordPhase = 'checks' | 'ready' | 'countdown' | 'recording';

interface Props {
  onRecordingComplete: (blob: Blob) => void;
  mediaDevices: ReturnType<typeof useMediaDevices>;
}

export default function RecordStep({ onRecordingComplete, mediaDevices }: Props) {
  const { t } = useTranslation();
  const { script, videoFormat } = useVideoFlowStore();
  const { stream, videoRef, hasCamera, hasMicrophone, error, isLoading, startDevices } = mediaDevices;

  const [recordPhase, setRecordPhase] = useState<RecordPhase>('checks');
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const audioQuality = useAudioAnalysis(stream);
  const lightingQuality = useLightingDetection(videoRef, hasCamera && recordPhase === 'checks');
  const cleanedScript = useMemo(() => cleanScriptForTeleprompter(script), [script]);
  const words = useMemo(() => cleanedScript.split(/\s+/).filter(Boolean), [cleanedScript]);
  const speechRecognition = useSpeechRecognition(words);

  const aspectClass = videoFormat === 'horizontal' ? 'aspect-video' : 'aspect-[9/16]';

  const actuallyStartRecording = useCallback(() => {
    if (!stream) return;
    const mimeTypes = [
      'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm',
      'video/mp4;codecs=h264,aac', 'video/mp4',
    ];
    const mimeType = mimeTypes.find(t => MediaRecorder.isTypeSupported(t)) || '';
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    chunksRef.current = [];
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType || 'video/webm' });
      onRecordingComplete(blob);
    };
    recorder.start(1000);
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
    setIsPaused(false);
    setDuration(0);
    setRecordPhase('recording');
    speechRecognition.start();
  }, [stream, speechRecognition, onRecordingComplete]);

  const startCountdown = useCallback(() => {
    setRecordPhase('countdown');
    setCountdown(COUNTDOWN_SECONDS);
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          countdownRef.current = null;
          requestAnimationFrame(() => actuallyStartRecording());
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [actuallyStartRecording]);

  const handleGesture = useCallback(() => {
    if (recordPhase === 'ready' && !isRecording) startCountdown();
  }, [recordPhase, isRecording, startCountdown]);

  const gestureDetection = useGestureDetection(videoRef, recordPhase === 'ready' && !isRecording, handleGesture);

  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRecording, isPaused]);

  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const handleStartRecording = useCallback(() => startCountdown(), [startCountdown]);
  const handleStopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    setIsPaused(false);
    speechRecognition.stop();
  }, [speechRecognition]);
  const handlePause = useCallback(() => { mediaRecorderRef.current?.pause(); setIsPaused(true); }, []);
  const handleResume = useCallback(() => { mediaRecorderRef.current?.resume(); setIsPaused(false); }, []);

  if (recordPhase === 'checks') {
    return (
      <PreRecordingChecks
        hasCamera={hasCamera}
        hasMicrophone={hasMicrophone}
        audioQuality={audioQuality}
        lightingQuality={lightingQuality}
        isLoading={isLoading}
        onStartDevices={startDevices}
        onContinue={() => setRecordPhase('ready')}
        videoRef={videoRef}
      />
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-2 relative">
          <div className={`${aspectClass} max-h-[60vh] w-full max-w-full bg-black rounded-xl overflow-hidden relative`}>
            <video ref={videoRef} autoPlay muted playsInline className="absolute inset-0 w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />

            {/* Gesture detection overlay */}
            {recordPhase === 'ready' && (
              <AnimatePresence>
                {gestureDetection.gestureDetected && (
                  <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} className="absolute inset-0 flex items-center justify-center bg-primary/20 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-2">
                      <Hand className="h-12 w-12 text-primary" />
                      <span className="text-primary font-bold text-lg">{t('recording.waveDetected')}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}

            {/* Countdown overlay */}
            {recordPhase === 'countdown' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-10">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={countdown}
                    initial={{ scale: 0.3, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 1.8, opacity: 0 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="flex flex-col items-center gap-4"
                  >
                    <span className="text-8xl sm:text-9xl font-bold text-primary drop-shadow-[0_0_40px_hsl(var(--primary)/0.5)]">
                      {countdown}
                    </span>
                    <span className="text-sm text-muted-foreground font-medium tracking-wide uppercase">
                      {t('recording.getReady', 'Get ready...')}
                    </span>
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            )}

            {/* Recording indicator */}
            {isRecording && (
              <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 backdrop-blur px-3 py-1.5 rounded-full">
                <motion.div className="h-2.5 w-2.5 rounded-full bg-destructive" animate={{ opacity: isPaused ? 0.3 : [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1 }} />
                <span className="text-xs font-mono text-foreground">{formatTime(duration)}</span>
              </div>
            )}
          </div>
        </div>
        <div className="lg:col-span-3 min-h-[300px] lg:min-h-0">
          <Teleprompter script={cleanedScript} currentWordIndex={speechRecognition.currentWordIndex} isActive={isRecording} />
        </div>
      </div>
      {recordPhase !== 'countdown' && (
        <RecordingControls
          isRecording={isRecording}
          isPaused={isPaused}
          gestureReady={recordPhase === 'ready'}
          onStart={handleStartRecording}
          onStop={handleStopRecording}
          onPause={handlePause}
          onResume={handleResume}
          duration={duration}
        />
      )}
      {speechRecognition.isListening && (
        <div className="text-center">
          <p className="text-xs text-muted-foreground">{t('recording.listening')} <span className="text-foreground/70">{speechRecognition.transcript}</span></p>
        </div>
      )}
    </motion.div>
  );
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}
