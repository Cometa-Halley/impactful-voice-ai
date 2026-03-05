import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Monitor, Smartphone, Hand, Loader2 } from 'lucide-react';
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
import PerformanceAnalysis from '@/components/recording/PerformanceAnalysis';

import { analyzePerformance, type AnalysisResult } from '@/lib/ai-service';
import type { MethodologyKey } from '@/lib/methodologies';

type Phase = 'checks' | 'ready' | 'recording' | 'review' | 'analyzing' | 'results';
type DeviceMode = 'single' | 'multi';

const RecordingStudio = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const scriptId = searchParams.get('scriptId');
  const joinCode = searchParams.get('join');

  const [script, setScript] = useState('');
  const [methodology, setMethodology] = useState<MethodologyKey>('sinek');
  const [scriptLoading, setScriptLoading] = useState(true);
  const [phase, setPhase] = useState<Phase>('checks');
  const [deviceMode, setDeviceMode] = useState<DeviceMode>(joinCode ? 'multi' : 'single');
  const [sessionCode] = useState(() => joinCode || crypto.randomUUID().slice(0, 8));
  const [deviceRole, setDeviceRole] = useState<'desktop' | 'mobile' | null>(joinCode ? 'mobile' : null);
  const [isPaired, setIsPaired] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  const { stream, videoRef, hasCamera, hasMicrophone, error, isLoading, startDevices, stopDevices } = useMediaDevices();
  const audioQuality = useAudioAnalysis(stream);
  const lightingQuality = useLightingDetection(videoRef, hasCamera && phase === 'checks');
  const words = useMemo(() => script.split(/\s+/).filter(Boolean), [script]);
  const speechRecognition = useSpeechRecognition(words);

  const handleGesture = useCallback(() => {
    if (phase === 'ready' && !isRecording) handleStartRecording();
  }, [phase, isRecording]);

  const gestureDetection = useGestureDetection(videoRef, phase === 'ready' && !isRecording, handleGesture);

  useEffect(() => {
    if (!scriptId) { setScript('No script loaded.'); setScriptLoading(false); return; }
    (async () => {
      const { data, error } = await supabase.from('scripts').select('hook, development, call_to_action, methodology').eq('id', scriptId).single();
      if (error || !data) { toast.error('Could not load script'); setScriptLoading(false); return; }
      if (data.methodology) setMethodology(data.methodology as MethodologyKey);
      setScript([data.hook, data.development, data.call_to_action].filter(Boolean).join('\n\n'));
      setScriptLoading(false);
    })();
  }, [scriptId]);

  useEffect(() => {
    if (isRecording && !isPaused) { timerRef.current = setInterval(() => setDuration(d => d + 1), 1000); }
    else { if (timerRef.current) clearInterval(timerRef.current); }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRecording, isPaused]);

  const handleStartRecording = useCallback(() => {
    if (!stream) return;
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9,opus' });
    chunksRef.current = [];
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    recorder.onstop = () => setPhase('review');
    recorder.start(1000);
    mediaRecorderRef.current = recorder;
    setIsRecording(true); setIsPaused(false); setDuration(0); setPhase('recording');
    speechRecognition.start();
  }, [stream, speechRecognition]);

  const handleStopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop(); setIsRecording(false); setIsPaused(false); speechRecognition.stop();
  }, [speechRecognition]);

  const handlePause = useCallback(() => { mediaRecorderRef.current?.pause(); setIsPaused(true); }, []);
  const handleResume = useCallback(() => { mediaRecorderRef.current?.resume(); setIsPaused(false); }, []);
  const handleContinueToReady = () => setPhase('ready');

  const recordedBlob = useMemo(() => {
    if (chunksRef.current.length === 0) return null;
    return new Blob(chunksRef.current, { type: 'video/webm' });
  }, [phase]);

  const handleSaveAndAnalyze = useCallback(async () => {
    if (!recordedBlob || !user) return;
    setPhase('analyzing');
    try {
      const fileName = `${user.id}/${crypto.randomUUID()}.webm`;
      const { error: uploadError } = await supabase.storage.from('videos').upload(fileName, recordedBlob, { contentType: 'video/webm' });
      if (uploadError) throw new Error('Failed to upload video');
      const { data: videoRow, error: videoError } = await supabase.from('videos').insert({ user_id: user.id, file_url: fileName, script_id: scriptId }).select('id').single();
      if (videoError || !videoRow) throw new Error('Failed to save video record');
      const transcription = speechRecognition.transcript || script;
      const result = await analyzePerformance(methodology, script, transcription);
      setAnalysisResult(result);
      const overallScoreNormalized = Math.round(result.overall_score * 10);
      await Promise.all([
        supabase.from('feedback').insert({ video_id: videoRow.id, hook_score: result.hook_score, clarity_score: result.clarity_score, energy_score: result.energy_score, coherence_score: result.coherence_score, cta_strength: result.cta_strength, suggestions: JSON.stringify(result.suggestions) }),
        supabase.from('videos').update({ analysis_score: overallScoreNormalized }).eq('id', videoRow.id),
      ]);
      setPhase('results');
      toast.success('Analysis complete!');
    } catch (err: any) {
      console.error('Save & analyze error:', err);
      toast.error(err.message || 'Something went wrong during analysis');
      setPhase('review');
    }
  }, [recordedBlob, user, scriptId, methodology, script, speechRecognition.transcript]);

  const handleReRecord = useCallback(() => { setPhase('ready'); setDuration(0); chunksRef.current = []; setAnalysisResult(null); }, []);
  const handleFinish = useCallback(() => navigate('/my-videos'), [navigate]);

  const phaseDescriptions: Record<Phase, string> = {
    checks: t('recording.checkEnv'),
    ready: t('recording.ready'),
    recording: t('recording.inProgress'),
    review: t('recording.review'),
    analyzing: t('recording.analyzing'),
    results: t('recording.results'),
  };

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> {t('recording.back')}
          </Button>
          <h1 className="text-2xl font-bold text-foreground">{t('recording.title')}</h1>
        </div>
        <p className="text-sm text-muted-foreground ml-11">{phaseDescriptions[phase]}</p>
      </motion.div>

      {phase === 'checks' && (
        <div className="mb-6">
          <Tabs value={deviceMode} onValueChange={(v) => setDeviceMode(v as DeviceMode)}>
            <TabsList className="bg-secondary">
              <TabsTrigger value="single" className="gap-2"><Monitor className="h-4 w-4" /> {t('recording.singleDevice')}</TabsTrigger>
              <TabsTrigger value="multi" className="gap-2"><Smartphone className="h-4 w-4" /> {t('recording.multiDevice')}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      )}

      <AnimatePresence mode="wait">
        {phase === 'checks' && (
          <motion.div key="checks" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {deviceMode === 'multi' && <div className="mb-6"><DevicePairing sessionCode={sessionCode} role={deviceRole} onRoleSelect={setDeviceRole} onPaired={() => setIsPaired(true)} isPaired={isPaired} /></div>}
            <PreRecordingChecks hasCamera={hasCamera} hasMicrophone={hasMicrophone} audioQuality={audioQuality} lightingQuality={lightingQuality} isLoading={isLoading} onStartDevices={startDevices} onContinue={handleContinueToReady} videoRef={videoRef} />
          </motion.div>
        )}

        {(phase === 'ready' || phase === 'recording') && (
          <motion.div key="studio" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-5">
              <div className="lg:col-span-2 relative">
                <div className="aspect-[9/16] max-h-[60vh] bg-black rounded-xl overflow-hidden relative">
                  <video ref={videoRef} autoPlay muted playsInline className="absolute inset-0 w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
                  {phase === 'ready' && (
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
                  {isRecording && (
                    <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 backdrop-blur px-3 py-1.5 rounded-full">
                      <motion.div className="h-2.5 w-2.5 rounded-full bg-destructive" animate={{ opacity: isPaused ? 0.3 : [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1 }} />
                      <span className="text-xs font-mono text-foreground">{formatTime(duration)}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="lg:col-span-3 min-h-[300px] lg:min-h-0">
                <Teleprompter script={script} currentWordIndex={speechRecognition.currentWordIndex} isActive={isRecording} />
              </div>
            </div>
            <RecordingControls isRecording={isRecording} isPaused={isPaused} gestureReady={phase === 'ready'} onStart={handleStartRecording} onStop={handleStopRecording} onPause={handlePause} onResume={handleResume} duration={duration} />
            {speechRecognition.isListening && <div className="text-center"><p className="text-xs text-muted-foreground">{t('recording.listening')} <span className="text-foreground/70">{speechRecognition.transcript}</span></p></div>}
            {!speechRecognition.isSupported && isRecording && <p className="text-xs text-center text-muted-foreground">{t('recording.speechNotSupported')}</p>}
          </motion.div>
        )}

        {phase === 'review' && recordedBlob && (
          <motion.div key="review" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
            <div className="max-w-2xl mx-auto">
              <div className="aspect-[9/16] max-h-[60vh] bg-black rounded-xl overflow-hidden">
                <video src={URL.createObjectURL(recordedBlob)} controls className="w-full h-full object-contain" />
              </div>
            </div>
            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={handleReRecord}>{t('recording.reRecord')}</Button>
              <Button className="glow-gold font-semibold" onClick={handleSaveAndAnalyze}>{t('recording.saveAnalyze')}</Button>
            </div>
          </motion.div>
        )}

        {phase === 'analyzing' && (
          <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-20 gap-6">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}>
              <Loader2 className="h-12 w-12 text-primary" />
            </motion.div>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold text-foreground">{t('recording.analyzingTitle')}</h2>
              <p className="text-sm text-muted-foreground max-w-sm">{t('recording.analyzingDesc')}</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 max-w-md">
              {[t('recording.hookStrength'), t('recording.messageClarity'), t('recording.energyLevel'), t('recording.methodCoherence'), t('recording.ctaEffectiveness')].map((item, i) => (
                <motion.div key={item} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.3 }} className="bg-secondary/80 text-muted-foreground text-xs px-3 py-1.5 rounded-full border border-border">{item}</motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {phase === 'results' && analysisResult && (
          <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <PerformanceAnalysis analysis={analysisResult} onReRecord={handleReRecord} onFinish={handleFinish} />
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
