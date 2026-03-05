import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Sparkles, FileText, MessageSquare, CheckCircle2, ArrowRight, ArrowLeft,
  Loader2, Send, Zap, Heart, Target, Presentation, Check, Video,
  Monitor, Smartphone, Clock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { METHODOLOGIES, getTranslatedMethodologies, type MethodologyKey } from '@/lib/methodologies';
import { generateScript, refineScript } from '@/lib/ai-service';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
  exit: { opacity: 0, y: -16, transition: { duration: 0.3 } },
};

const METHODOLOGY_ICONS: Record<MethodologyKey, typeof Sparkles> = {
  sinek: Sparkles,
  obama: Heart,
  robbins: Zap,
  jobs: Presentation,
};

const METHODOLOGY_COLORS: Record<MethodologyKey, string> = {
  sinek: 'border-primary/50 hover:border-primary',
  obama: 'border-accent/50 hover:border-accent',
  robbins: 'border-pink-brand/50 hover:border-pink-brand',
  jobs: 'border-soft-blue/50 hover:border-soft-blue',
};

// Dynamic placeholder examples per methodology
const METHODOLOGY_PLACEHOLDERS: Record<MethodologyKey, string[]> = {
  sinek: [
    'e.g. I help entrepreneurs find clarity because I believe every idea deserves a voice...',
    'e.g. Through 1-on-1 coaching and frameworks that simplify complex ideas...',
    'e.g. A 6-week communication program that transforms how founders pitch...',
    'e.g. Early-stage founders who struggle to articulate their vision clearly...',
  ],
  obama: [
    'e.g. Growing up, I watched my mother work two jobs while pursuing her education...',
    'e.g. The moment I failed my first public presentation changed everything for me...',
    'e.g. We all share the desire to be heard and to make our stories matter...',
    'e.g. I want them to feel empowered to share their own story without fear...',
  ],
  robbins: [
    'e.g. They believe they need to be perfect before they can start creating content...',
    'e.g. The confidence to press record and speak authentically without a script...',
    'e.g. Record a 30-second video right now sharing one thing they learned today...',
    'e.g. Unstoppable excitement — the feeling that they CAN do this starting today...',
  ],
  jobs: [
    'e.g. Most people spend hours preparing presentations that nobody remembers...',
    'e.g. Our AI coach analyzes your delivery in real-time and gives instant feedback...',
    'e.g. Users improve their speaking score by 40% in just 3 sessions...',
    'e.g. "One more thing" — it also writes your script for you in 30 seconds...',
  ],
};

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const CreateVideo = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const methods = getTranslatedMethodologies(t);
  const [currentStep, setCurrentStep] = useState(0);

  // Step 0 — Format
  const [videoFormat, setVideoFormat] = useState<'vertical' | 'horizontal' | null>(null);
  const [videoDuration, setVideoDuration] = useState<'30s' | '60s' | null>(null);

  // Step 1 — Methodology
  const [selectedMethodology, setSelectedMethodology] = useState<MethodologyKey | null>(null);

  // Step 2 — Questions
  const [answers, setAnswers] = useState<string[]>([]);

  // Step 3 — Script generation
  const [script, setScript] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Step 4 — Chat refinement
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Step 6 — Validation
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // ── Step handlers ─────────────────────────────────────

  const handleSelectMethodology = (key: MethodologyKey) => {
    setSelectedMethodology(key);
    const m = methods[key];
    setAnswers(new Array(m.questions.length).fill(''));
  };

  const handleAnswerChange = (index: number, value: string) => {
    setAnswers(prev => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const allAnswered = answers.length > 0 && answers.every(a => a.trim().length > 10);

  const handleGenerateScript = useCallback(async () => {
    if (!selectedMethodology || !videoFormat || !videoDuration) return;
    setIsGenerating(true);
    setScript('');
    setCurrentStep(3);

    try {
      await generateScript({
        methodology: selectedMethodology,
        answers,
        duration: videoDuration,
        format: videoFormat,
        onDelta: (text) => setScript(prev => prev + text),
        onDone: () => setIsGenerating(false),
      });
    } catch (e: any) {
      toast.error(t('createVideo.failedGenerate'));
      setIsGenerating(false);
    }
  }, [selectedMethodology, answers, videoFormat, videoDuration, t]);

  const handleRefine = useCallback(async (instruction: string) => {
    if (!selectedMethodology || !script || isRefining) return;
    const userMsg: ChatMessage = { role: 'user', content: instruction };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsRefining(true);

    let refined = '';
    try {
      await refineScript({
        methodology: selectedMethodology,
        script,
        instruction,
        history: chatMessages,
        onDelta: (text) => {
          refined += text;
          setChatMessages(prev => {
            const last = prev[prev.length - 1];
            if (last?.role === 'assistant') {
              return [...prev.slice(0, -1), { role: 'assistant', content: refined }];
            }
            return [...prev, { role: 'assistant', content: refined }];
          });
        },
        onDone: () => {
          setScript(refined);
          setIsRefining(false);
        },
      });
    } catch (e: any) {
      toast.error(t('createVideo.failedRefine'));
      setIsRefining(false);
    }
  }, [selectedMethodology, script, chatMessages, isRefining, t]);

  const handleSaveAndContinue = async () => {
    if (!user || !selectedMethodology || !script || !videoFormat || !videoDuration) return;
    setIsSaving(true);
    try {
      const { data, error } = await supabase.from('scripts').insert({
        user_id: user.id,
        methodology: selectedMethodology,
        hook: script.split('\n\n')[0] || '',
        development: script,
        call_to_action: '',
        duration: videoDuration,
        format: videoFormat,
      }).select('id').single();
      if (error) throw error;
      setSaved(true);
      toast.success(t('createVideo.scriptSaved'));
      setTimeout(() => navigate(`/recording-studio?scriptId=${data.id}`), 1000);
    } catch (e: any) {
      toast.error(t('createVideo.failedSave'));
    } finally {
      setIsSaving(false);
    }
  };

  // ── Validation per step ───────────────────────────────

  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 0: return !!videoFormat && !!videoDuration;
      case 1: return !!selectedMethodology;
      case 2: return allAnswered;
      case 3: return !isGenerating && !!script;
      case 4: return !!script;
      case 5: return !!script;
      case 6: return !!script;
      default: return false;
    }
  };

  // ── Step definitions ──────────────────────────────────

  const QUICK_REFINEMENTS = [
    { key: 'moreDirect', label: t('createVideo.quickRefinements.moreDirect') },
    { key: 'reduce30', label: t('createVideo.quickRefinements.reduce30') },
    { key: 'moreEmotional', label: t('createVideo.quickRefinements.moreEmotional') },
    { key: 'addUrgency', label: t('createVideo.quickRefinements.addUrgency') },
    { key: 'simplify', label: t('createVideo.quickRefinements.simplify') },
  ];

  const steps = [
    { label: t('createVideo.steps.format'), icon: Monitor },
    { label: t('createVideo.steps.strategy'), icon: Target },
    { label: t('createVideo.steps.context'), icon: MessageSquare },
    { label: t('createVideo.steps.script'), icon: FileText },
    { label: t('createVideo.steps.refine'), icon: Sparkles },
    { label: t('createVideo.steps.record'), icon: Video },
    { label: t('createVideo.steps.validate'), icon: CheckCircle2 },
  ];

  // Handler for "Next" button per step
  const handleNext = () => {
    if (currentStep === 2) {
      // Step 2 → generate script and go to step 3
      handleGenerateScript();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  // Steps that show the fixed bottom nav (0, 1, 2 always; others have custom nav)
  const showFixedNav = currentStep <= 2;

  return (
    <AppLayout>
      <div className={showFixedNav ? 'pb-24' : ''}>
        {/* Header + Stepper */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="mb-8">
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
                    onClick={() => { if (done) setCurrentStep(i); }}
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
          {/* ── STEP 0: Format ────────────────────────── */}
          {currentStep === 0 && (
            <motion.div key="step-format" initial="hidden" animate="visible" exit="exit" variants={fadeUp} className="space-y-8">
              {/* Orientation */}
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-foreground">{t('createVideo.formatOrientation')}</h2>
                <p className="text-sm text-muted-foreground">{t('createVideo.formatOrientationDesc')}</p>
                <div className="grid grid-cols-2 gap-4 max-w-md">
                  {(['horizontal', 'vertical'] as const).map(fmt => (
                    <button
                      key={fmt}
                      onClick={() => setVideoFormat(fmt)}
                      className={`flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition-all ${
                        videoFormat === fmt
                          ? 'border-primary bg-primary/5 glow-gold'
                          : 'border-border hover:border-primary/40 bg-muted/30'
                      }`}
                    >
                      {fmt === 'horizontal' ? (
                        <Monitor className={`h-8 w-8 ${videoFormat === fmt ? 'text-primary' : 'text-muted-foreground'}`} />
                      ) : (
                        <Smartphone className={`h-8 w-8 ${videoFormat === fmt ? 'text-primary' : 'text-muted-foreground'}`} />
                      )}
                      <span className={`text-sm font-medium ${videoFormat === fmt ? 'text-primary' : 'text-foreground'}`}>
                        {t(`createVideo.format${fmt.charAt(0).toUpperCase() + fmt.slice(1)}`)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-foreground">{t('createVideo.formatDuration')}</h2>
                <p className="text-sm text-muted-foreground">{t('createVideo.formatDurationDesc')}</p>
                <div className="grid grid-cols-2 gap-4 max-w-md">
                  {(['30s', '60s'] as const).map(dur => (
                    <button
                      key={dur}
                      onClick={() => setVideoDuration(dur)}
                      className={`flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition-all ${
                        videoDuration === dur
                          ? 'border-primary bg-primary/5 glow-gold'
                          : 'border-border hover:border-primary/40 bg-muted/30'
                      }`}
                    >
                      <Clock className={`h-8 w-8 ${videoDuration === dur ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className={`text-sm font-medium ${videoDuration === dur ? 'text-primary' : 'text-foreground'}`}>
                        {dur === '30s' ? '30 ' + t('createVideo.seconds') : '60 ' + t('createVideo.seconds')}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── STEP 1: Select methodology ──────────────── */}
          {currentStep === 1 && (
            <motion.div key="step-strategy" initial="hidden" animate="visible" exit="exit" variants={fadeUp} className="space-y-4">
              <p className="text-sm text-muted-foreground">{t('createVideo.chooseImpact')}</p>
              <div className="grid gap-4 sm:grid-cols-2">
                {(Object.keys(methods) as MethodologyKey[]).map(key => {
                  const m = methods[key];
                  const Icon = METHODOLOGY_ICONS[key];
                  const selected = selectedMethodology === key;
                  return (
                    <Card
                      key={key}
                      onClick={() => handleSelectMethodology(key)}
                      className={`cursor-pointer gradient-card border-2 transition-all duration-300 ${
                        selected ? 'border-primary glow-gold' : METHODOLOGY_COLORS[key]
                      }`}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-secondary ${selected ? 'text-primary' : 'text-muted-foreground'}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{m.tagline}</CardTitle>
                            <CardDescription className="text-xs">{m.name}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{m.focus}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ── STEP 2: Context / Strategic questions ───── */}
          {currentStep === 2 && selectedMethodology && (
            <motion.div key="step-context" initial="hidden" animate="visible" exit="exit" variants={fadeUp} className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  {methods[selectedMethodology].tagline} — {t('createVideo.strategicQuestions')}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('createVideo.answersShape')}
                </p>
              </div>

              {methods[selectedMethodology].questions.map((q, i) => (
                <div key={i} className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    {i + 1}. {q}
                  </label>
                  <Textarea
                    value={answers[i] || ''}
                    onChange={e => handleAnswerChange(i, e.target.value)}
                    placeholder={METHODOLOGY_PLACEHOLDERS[selectedMethodology]?.[i] || t('createVideo.writePlaceholder')}
                    className="min-h-[100px] bg-muted/50 border-border focus:border-primary"
                  />
                </div>
              ))}
            </motion.div>
          )}

          {/* ── STEP 3: Script generation ──────────────── */}
          {currentStep === 3 && (
            <motion.div key="step-script" initial="hidden" animate="visible" exit="exit" variants={fadeUp} className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground">{t('createVideo.yourScript')}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {isGenerating ? t('createVideo.aiCrafting') : t('createVideo.reviewScript')}
                </p>
              </div>

              <Card className="gradient-card border-border">
                <CardContent className="pt-6">
                  <div className="relative min-h-[200px]">
                    {isGenerating && !script && (
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>{t('createVideo.generating')}</span>
                      </div>
                    )}
                    <div className="whitespace-pre-wrap text-sm text-foreground leading-relaxed font-mono">
                      {script}
                      {isGenerating && <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-0.5" />}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between pt-2">
                <Button variant="ghost" onClick={() => setCurrentStep(2)}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> {t('createVideo.back')}
                </Button>
                <Button
                  disabled={isGenerating || !script}
                  onClick={() => setCurrentStep(4)}
                  className="glow-gold font-semibold"
                >
                  {t('createVideo.refineScript')} <MessageSquare className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 4: AI Chat Refinement ─────────────── */}
          {currentStep === 4 && (
            <motion.div key="step-refine" initial="hidden" animate="visible" exit="exit" variants={fadeUp} className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">{t('createVideo.refineWithAI')}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('createVideo.refineDesc')}
                </p>
              </div>

              <Card className="gradient-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">{t('createVideo.currentScript')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="whitespace-pre-wrap text-sm text-foreground leading-relaxed font-mono max-h-48 overflow-y-auto">
                    {script}
                  </div>
                </CardContent>
              </Card>

              <div className="flex flex-wrap gap-2">
                {QUICK_REFINEMENTS.map(r => (
                  <button
                    key={r.key}
                    onClick={() => handleRefine(r.label)}
                    disabled={isRefining}
                    className="rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground hover:bg-nav-hover/30 transition-colors disabled:opacity-50"
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              {chatMessages.length > 0 && (
                <div className="space-y-3 max-h-64 overflow-y-auto rounded-lg bg-muted/30 p-4">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm ${
                        msg.role === 'user'
                          ? 'bg-nav-hover text-white'
                          : 'bg-secondary text-foreground'
                      }`}>
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      </div>
                    </div>
                  ))}
                  {isRefining && (
                    <div className="flex justify-start">
                      <div className="bg-secondary rounded-xl px-4 py-2.5">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
              )}

              <div className="flex gap-2">
                <Input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey && chatInput.trim()) {
                      e.preventDefault();
                      handleRefine(chatInput.trim());
                    }
                  }}
                  placeholder={t('createVideo.chatPlaceholder')}
                  className="bg-muted/50 border-border focus:border-primary"
                  disabled={isRefining}
                />
                <Button
                  size="icon"
                  disabled={!chatInput.trim() || isRefining}
                  onClick={() => handleRefine(chatInput.trim())}
                  className="shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="ghost" onClick={() => setCurrentStep(3)}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> {t('createVideo.back')}
                </Button>
                <Button
                  onClick={() => setCurrentStep(5)}
                  className="glow-gold font-semibold"
                >
                  {t('createVideo.validateContinue')} <CheckCircle2 className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 5: Recording Studio ───────────────── */}
          {currentStep === 5 && (
            <motion.div key="step-record" initial="hidden" animate="visible" exit="exit" variants={fadeUp} className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground">{t('createVideo.recordingStepTitle')}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('createVideo.recordingStepDesc')}
                </p>
              </div>

              <Card className="gradient-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">{t('createVideo.currentScript')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="whitespace-pre-wrap text-sm text-foreground leading-relaxed font-mono max-h-48 overflow-y-auto">
                    {script}
                  </div>
                </CardContent>
              </Card>

              <div className="flex items-center justify-center">
                <Button
                  size="lg"
                  onClick={async () => {
                    if (!user || !selectedMethodology || !script || !videoFormat || !videoDuration) return;
                    setIsSaving(true);
                    try {
                      const { data, error } = await supabase.from('scripts').insert({
                        user_id: user.id,
                        methodology: selectedMethodology,
                        hook: script.split('\n\n')[0] || '',
                        development: script,
                        call_to_action: '',
                        duration: videoDuration,
                        format: videoFormat,
                      }).select('id').single();
                      if (error) throw error;
                      navigate(`/recording-studio?scriptId=${data.id}`);
                    } catch {
                      toast.error(t('createVideo.failedSave'));
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                  disabled={isSaving}
                  className="glow-gold font-semibold"
                >
                  {isSaving ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('createVideo.saving')}</>
                  ) : (
                    <><Video className="mr-2 h-5 w-5" /> {t('createVideo.goToStudio')}</>
                  )}
                </Button>
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="ghost" onClick={() => setCurrentStep(4)}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> {t('createVideo.back')}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setCurrentStep(6)}
                >
                  {t('createVideo.skipRecording')} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 6: Validation ─────────────────────── */}
          {currentStep === 6 && (
            <motion.div key="step-validate" initial="hidden" animate="visible" exit="exit" variants={fadeUp} className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground">{t('createVideo.validateScript')}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('createVideo.validateDesc')}
                </p>
              </div>

              <Card className="gradient-card border-primary/30 glow-gold">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{t('createVideo.finalScript')} — {selectedMethodology && methods[selectedMethodology].tagline}</CardTitle>
                    <span className="text-xs text-primary font-medium">{t('createVideo.readyReview')}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="whitespace-pre-wrap text-sm text-foreground leading-relaxed font-mono">
                    {script}
                  </div>
                </CardContent>
              </Card>

              {selectedMethodology && (
                <Card className="gradient-card border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">{t('createVideo.scriptStructure')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {methods[selectedMethodology].scriptStructure.map((block, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                          <span className="text-sm text-foreground">{block}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-between pt-2">
                <Button variant="ghost" onClick={() => setCurrentStep(5)}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> {t('createVideo.back')}
                </Button>
                <Button
                  onClick={handleSaveAndContinue}
                  disabled={isSaving || saved}
                  className="glow-gold font-semibold"
                >
                  {saved ? (
                    <>{t('createVideo.saved')} <Check className="ml-2 h-4 w-4" /></>
                  ) : isSaving ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('createVideo.saving')}</>
                  ) : (
                    <>{t('createVideo.validateUnlock')} <ArrowRight className="ml-2 h-4 w-4" /></>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Fixed bottom navigation (steps 0-2) ──────── */}
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
              disabled={!isStepValid(currentStep)}
              className="glow-gold font-semibold gap-2"
            >
              {currentStep === 2
                ? <>{t('createVideo.generateScript')} <Sparkles className="h-4 w-4" /></>
                : <>{t('createVideo.next')} <ArrowRight className="h-4 w-4" /></>
              }
            </Button>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default CreateVideo;
