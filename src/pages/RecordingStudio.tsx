import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Monitor, Smartphone, Hand } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

import { useMediaDevices } from '@/hooks/useMediaDevices';
import { useAudioAnalysis } from '@/hooks/useAudioAnalysis';
import { useLightingDetection } from '@/hooks/useLightingDetection';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useGestureDetection } from '@/hooks/useGestureDetection';

import PreRecordingChecks from '@/components/recording/PreRecordingChecks';
import Teleprompter from '@/components/recording/Teleprompter';
import RecordingControls from '@/components/recording/RecordingControls';
import DevicePairing from '@/components/recording/DevicePairing';

type Phase = 'checks' | 'ready' | 'recording' | 'review';
type DeviceMode = 'single' | 'multi';

const RecordingStudio = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const scriptId = searchParams.get('scriptId');
  const joinCode = searchParams.get('join');

  // Script
  const [script, setScript] = useState('');
  const [scriptLoading, setScriptLoading] = useState(true);

  // Phase
  const [phase, setPhase] = useState<Phase>('checks');
  const [deviceMode, setDeviceMode] = useState<DeviceMode>(joinCode ? 'multi' : 'single');

  // Multi-device
  const [sessionCode] = useState(() => joinCode || crypto.randomUUID().slice(0, 8));
  const [deviceRole, setDeviceRole] = useState<'desktop' | 'mobile' | null>(joinCode ? 'mobile' : null);
  const [isPaired, setIsPaired] = useState(false);

  // Recording
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Hooks
  const { stream, videoRef, hasCamera, hasMicrophone, error, isLoading, startDevices, stopDevices } = useMediaDevices();
  const audioQuality = useAudioAnalysis(stream);
  const lightingQuality = useLightingDetection(videoRef, hasCamera && phase === 'checks');

  const words = useMemo(() => script.split(/\s+/).filter(Boolean), [script]);
  const speechRecognition = useSpeechRecognition(words);

  const handleGesture = useCallback(() => {
    if (phase === 'ready' && !isRecording) {
      handleStartRecording();
    }
  }, [phase, isRecording]);

  const gestureDetection = useGestureDetection(videoRef, phase === 'ready' && !isRecording, handleGesture);

  // Load script
  useEffect(() => {
    if (!scriptId) {
      setScript('No script loaded. Navigate from Create Video to load your script here.');
      setScriptLoading(false);
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from('scripts')
        .select('hook, development, call_to_action')
        .eq('id', scriptId)
        .single();

      if (error || !data) {
        toast.error('Could not load script');
        setScriptLoading(false);
        return;
      }
      const parts = [data.hook, data.development, data.call_to_action].filter(Boolean);
      setScript(parts.join('\n\n'));
      setScriptLoading(false);
    })();
  }, [scriptId]);

  // Recording timer
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRecording, isPaused]);

  const handleStartRecording = useCallback(() => {
    if (!stream) return;
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9,opus' });
    chunksRef.current = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      setPhase('review');
    };
    recorder.start(1000);
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
    setIsPaused(false);
    setDuration(0);
    setPhase('recording');
    speechRecognition.start();
  }, [stream, speechRecognition]);

  const handleStopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    setIsPaused(false);
    speechRecognition.stop();
  }, [speechRecognition]);

  const handlePause = useCallback(() => {
    mediaRecorderRef.current?.pause();
    setIsPaused(true);
  }, []);

  const handleResume = useCallback(() => {
    mediaRecorderRef.current?.resume();
    setIsPaused(false);
  }, []);

  const handleContinueToReady = () => setPhase('ready');

  const recordedBlob = useMemo(() => {
    if (chunksRef.current.length === 0) return null;
    return new Blob(chunksRef.current, { type: 'video/webm' });
  }, [phase]); // recalc when phase changes to review

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Recording Studio</h1>
        </div>
        <p className="text-sm text-muted-foreground ml-11">
          {phase === 'checks' && 'Check your environment before recording.'}
          {phase === 'ready' && 'Your environment is ready. Start recording!'}
          {phase === 'recording' && 'Recording in progress...'}
          {phase === 'review' && 'Review your recording.'}
        </p>
      </motion.div>

      {/* Device mode toggle (only in checks phase) */}
      {phase === 'checks' && (
        <div className="mb-6">
          <Tabs value={deviceMode} onValueChange={(v) => setDeviceMode(v as DeviceMode)}>
            <TabsList className="bg-secondary">
              <TabsTrigger value="single" className="gap-2">
                <Monitor className="h-4 w-4" /> Single Device
              </TabsTrigger>
              <TabsTrigger value="multi" className="gap-2">
                <Smartphone className="h-4 w-4" /> Multi-Device
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* ── CHECKS PHASE ── */}
        {phase === 'checks' && (
          <motion.div key="checks" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {deviceMode === 'multi' && (
              <div className="mb-6">
                <DevicePairing
                  sessionCode={sessionCode}
                  role={deviceRole}
                  onRoleSelect={setDeviceRole}
                  onPaired={() => setIsPaired(true)}
                  isPaired={isPaired}
                />
              </div>
            )}
            <PreRecordingChecks
              hasCamera={hasCamera}
              hasMicrophone={hasMicrophone}
              audioQuality={audioQuality}
              lightingQuality={lightingQuality}
              isLoading={isLoading}
              onStartDevices={startDevices}
              onContinue={handleContinueToReady}
              videoRef={videoRef}
            />
          </motion.div>
        )}

        {/* ── READY / RECORDING PHASE ── */}
        {(phase === 'ready' || phase === 'recording') && (
          <motion.div key="studio" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-5">
              {/* Camera preview */}
              <div className="lg:col-span-2 relative">
                <div className="aspect-[9/16] max-h-[60vh] bg-black rounded-xl overflow-hidden relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ transform: 'scaleX(-1)' }}
                  />
                  {/* Gesture indicator */}
                  {phase === 'ready' && (
                    <AnimatePresence>
                      {gestureDetection.gestureDetected && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          className="absolute inset-0 flex items-center justify-center bg-primary/20 backdrop-blur-sm"
                        >
                          <div className="flex flex-col items-center gap-2">
                            <Hand className="h-12 w-12 text-primary" />
                            <span className="text-primary font-bold text-lg">Wave detected!</span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  )}
                  {/* Recording indicator */}
                  {isRecording && (
                    <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 backdrop-blur px-3 py-1.5 rounded-full">
                      <motion.div
                        className="h-2.5 w-2.5 rounded-full bg-destructive"
                        animate={{ opacity: isPaused ? 0.3 : [1, 0.3, 1] }}
                        transition={{ repeat: Infinity, duration: 1 }}
                      />
                      <span className="text-xs font-mono text-foreground">{formatTime(duration)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Teleprompter */}
              <div className="lg:col-span-3 min-h-[300px] lg:min-h-0">
                <Teleprompter
                  script={script}
                  currentWordIndex={speechRecognition.currentWordIndex}
                  isActive={isRecording}
                />
              </div>
            </div>

            {/* Controls */}
            <RecordingControls
              isRecording={isRecording}
              isPaused={isPaused}
              gestureReady={phase === 'ready'}
              onStart={handleStartRecording}
              onStop={handleStopRecording}
              onPause={handlePause}
              onResume={handleResume}
              duration={duration}
            />

            {/* Speech recognition status */}
            {speechRecognition.isListening && (
              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  🎤 Listening... <span className="text-foreground/70">{speechRecognition.transcript}</span>
                </p>
              </div>
            )}
            {!speechRecognition.isSupported && isRecording && (
              <p className="text-xs text-center text-muted-foreground">
                Speech recognition not supported in this browser. Teleprompter will scroll manually.
              </p>
            )}
          </motion.div>
        )}

        {/* ── REVIEW PHASE ── */}
        {phase === 'review' && recordedBlob && (
          <motion.div key="review" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
            <div className="max-w-2xl mx-auto">
              <div className="aspect-[9/16] max-h-[60vh] bg-black rounded-xl overflow-hidden">
                <video
                  src={URL.createObjectURL(recordedBlob)}
                  controls
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={() => { setPhase('ready'); setDuration(0); chunksRef.current = []; }}>
                Re-record
              </Button>
              <Button className="glow-gold font-semibold" onClick={() => toast.success('Video saved! Analysis coming soon.')}>
                Save & Analyze
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
};

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

export default RecordingStudio;
