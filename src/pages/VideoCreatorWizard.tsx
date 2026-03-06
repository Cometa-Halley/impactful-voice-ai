import { useState, useCallback, useEffect } from 'react';
import i18nInstance from '@/i18n';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, ArrowRight, Sparkles, Target, FileText, Video, CheckCircle2,
  Monitor, Check, Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVideoFlowStore } from '@/stores/videoFlowStore';
import { getTranslatedMethodologies } from '@/lib/methodologies';
import { generateScript } from '@/lib/ai-service';
import { formatScriptForDisplay } from '@/lib/clean-script';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useMediaDevices } from '@/hooks/useMediaDevices';

import FormatStep from '@/components/wizard/FormatStep';
import StrategyStep from '@/components/wizard/StrategyStep';
import ScriptStep from '@/components/wizard/ScriptStep';
import RecordStep from '@/components/wizard/RecordStep';
import ReviewStep from '@/components/wizard/ReviewStep';

const STEP_COUNT = 5;

const VideoCreatorWizard = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const methods = getTranslatedMethodologies(t);
  const store = useVideoFlowStore();
  const {
    currentStep, videoFormat, videoDuration, methodology, answers,
    script, isGenerating, scriptId,
    setStep, setScript, setIsGenerating, setScriptId, appendScript,
    setChatMessages, setProposedScript,
  } = store;

  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Pre-load camera/mic while on step 2 (Script)
  const mediaDevices = useMediaDevices();
  useEffect(() => {
    if (currentStep === 2 && !mediaDevices.stream && !mediaDevices.hasCamera) {
      mediaDevices.startDevices();
    }
  }, [currentStep]);

  const steps = [
    { label: t('createVideo.steps.format'), icon: Monitor },
    { label: t('createVideo.steps.strategy'), icon: Target },
    { label: t('createVideo.steps.script'), icon: FileText },
    { label: t('createVideo.steps.record'), icon: Video },
    { label: t('createVideo.steps.validate'), icon: CheckCircle2 },
  ];

  const allAnswered = answers.length > 0 && answers.every(a => a.trim().length > 10);

  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 0: return !!videoFormat && !!videoDuration;
      case 1: return !!methodology && allAnswered;
      case 2: return !isGenerating && !!script;
      case 3: return !!recordedBlob;
      case 4: return true;
      default: return false;
    }
  };


  const handleGenerateScript = useCallback(async () => {
    if (!methodology || !videoFormat || !videoDuration) return;
    setIsGenerating(true);
    setScript('');
    setChatMessages([]);
    setProposedScript(null);
    setStep(2);

    try {
      const result = await generateScript({
        methodology,
        answers,
        duration: videoDuration,
        format: videoFormat,
        language: i18nInstance.language,
      });
      // Store the raw JSON string so clean-script and display can parse it
      setScript(JSON.stringify(result));
    } catch {
      toast.error(t('createVideo.failedGenerate'));
    } finally {
      setIsGenerating(false);
    }
  }, [methodology, answers, videoFormat, videoDuration, t, setIsGenerating, setScript, setStep]);

  const handleGoToRecord = useCallback(async () => {
    if (!user || !methodology || !script || !videoFormat || !videoDuration) return;
    setIsSaving(true);
    try {
      const { data, error } = await supabase.from('scripts').insert({
        user_id: user.id,
        methodology,
        hook: script.split('\n\n')[0] || '',
        development: script,
        call_to_action: '',
        duration: videoDuration,
        format: videoFormat,
      }).select('id').single();
      if (error) throw error;
      setScriptId(data.id);
      setStep(3);
    } catch {
      toast.error(t('createVideo.failedSave'));
    } finally {
      setIsSaving(false);
    }
  }, [user, methodology, script, videoFormat, videoDuration, t, setScriptId, setStep]);

  const handleNext = () => {
    if (currentStep === 1) {
      handleGenerateScript();
    } else if (currentStep === 2) {
      handleGoToRecord();
    } else {
      setStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setStep(currentStep - 1);
  };

  const handleRecordingComplete = useCallback((blob: Blob) => {
    setRecordedBlob(blob);
    setStep(4);
  }, [setStep]);

  const handleReRecord = useCallback(() => {
    setRecordedBlob(null);
    store.setAnalysisResult(null);
    setStep(3);
  }, [setStep, store]);

  // Show fixed nav for steps 0-2
  const showFixedNav = currentStep <= 2;

  return (
    <AppLayout>
      <div className={showFixedNav ? 'pb-24' : ''}>
        {/* Header + Stepper */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">{t('createVideo.title')}</h1>
          <p className="mt-1 text-muted-foreground">{t('createVideo.subtitle')}</p>

          {/* Stepper */}
          <div className="mt-6 flex items-center gap-1 overflow-x-auto">
            {steps.map((s, i) => {
              const done = i < currentStep;
              const active = i === currentStep;
              return (
                <div key={s.label} className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => { if (done) setStep(i); }}
                    disabled={!done && !active}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                      active
                        ? 'bg-nav-hover text-white'
                        : done
                          ? 'bg-secondary text-foreground cursor-pointer hover:bg-nav-hover/30'
                          : 'bg-muted text-muted-foreground cursor-default'
                    }`}
                  >
                    {done ? <Check className="h-3 w-3" /> : <s.icon className="h-3 w-3" />}
                    <span className="hidden sm:inline">{s.label}</span>
                  </button>
                  {i < steps.length - 1 && (
                    <div className={`h-px w-4 ${i < currentStep ? 'bg-nav-hover' : 'bg-border'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          {currentStep === 0 && <FormatStep />}
          {currentStep === 1 && <StrategyStep />}
          {currentStep === 2 && <ScriptStep />}
          {currentStep === 3 && (
            <RecordStep
              onRecordingComplete={handleRecordingComplete}
              mediaDevices={mediaDevices}
            />
          )}
          {currentStep === 4 && (
            <ReviewStep recordedBlob={recordedBlob} onReRecord={handleReRecord} />
          )}
        </AnimatePresence>
      </div>

      {/* Fixed bottom navigation */}
      {showFixedNav && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentStep === 0}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" /> {t('createVideo.back')}
            </Button>
            <Button
              onClick={handleNext}
              disabled={!isStepValid(currentStep) || isSaving}
              className="glow-gold font-semibold gap-2"
            >
              {isSaving ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> {t('createVideo.saving')}</>
              ) : currentStep === 1 ? (
                <>{t('createVideo.generateScript')} <Sparkles className="h-4 w-4" /></>
              ) : currentStep === 2 ? (
                <><Video className="h-4 w-4" /> {t('createVideo.goToStudio', 'Go to Record')}</>
              ) : (
                <>{t('createVideo.next')} <ArrowRight className="h-4 w-4" /></>
              )}
            </Button>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default VideoCreatorWizard;
