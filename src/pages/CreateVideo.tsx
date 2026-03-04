import { useState, useRef, useEffect, useCallback } from 'react';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Sparkles, FileText, MessageSquare, CheckCircle2, ArrowRight, ArrowLeft,
  Loader2, Send, Zap, Heart, Target, Presentation, Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { METHODOLOGIES, type MethodologyKey } from '@/lib/methodologies';
import { generateScript, refineScript } from '@/lib/ai-service';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
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
  robbins: 'border-destructive/50 hover:border-destructive',
  jobs: 'border-soft-blue/50 hover:border-soft-blue',
};

const QUICK_REFINEMENTS = [
  'Make it more direct',
  'Reduce to 30 seconds',
  'Make it more emotional',
  'Add more urgency',
  'Simplify the language',
];

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const CreateVideo = () => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);

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

  // Step 5 — Validation
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // ── Step handlers ─────────────────────────────────────

  const handleSelectMethodology = (key: MethodologyKey) => {
    setSelectedMethodology(key);
    const m = METHODOLOGIES[key];
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
    if (!selectedMethodology) return;
    setIsGenerating(true);
    setScript('');
    setCurrentStep(2);

    try {
      await generateScript({
        methodology: selectedMethodology,
        answers,
        duration: '60s',
        format: 'vertical',
        onDelta: (text) => setScript(prev => prev + text),
        onDone: () => setIsGenerating(false),
      });
    } catch (e: any) {
      toast.error(e.message || 'Failed to generate script');
      setIsGenerating(false);
    }
  }, [selectedMethodology, answers]);

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
      toast.error(e.message || 'Failed to refine script');
      setIsRefining(false);
    }
  }, [selectedMethodology, script, chatMessages, isRefining]);

  const handleSaveAndContinue = async () => {
    if (!user || !selectedMethodology || !script) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.from('scripts').insert({
        user_id: user.id,
        methodology: selectedMethodology,
        hook: script.split('\n\n')[0] || '',
        development: script,
        call_to_action: '',
        duration: '60s',
        format: 'vertical',
      });
      if (error) throw error;
      setSaved(true);
      toast.success('Script saved! Ready to record.');
    } catch (e: any) {
      toast.error(e.message || 'Failed to save script');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Step definitions ──────────────────────────────────

  const steps = [
    { label: 'Impact', icon: Sparkles },
    { label: 'Strategy', icon: Target },
    { label: 'Script', icon: FileText },
    { label: 'Refine', icon: MessageSquare },
    { label: 'Validate', icon: CheckCircle2 },
  ];

  return (
    <AppLayout>
      {/* Header + Stepper */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp} className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Create Video</h1>
        <p className="mt-1 text-muted-foreground">Follow the flow to craft your high-impact message.</p>

        {/* Stepper */}
        <div className="mt-6 flex items-center gap-2">
          {steps.map((s, i) => {
            const done = i < currentStep;
            const active = i === currentStep;
            return (
              <div key={s.label} className="flex items-center gap-2">
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
                  <div className={`h-px w-6 ${i < currentStep ? 'bg-nav-hover' : 'bg-border'}`} />
                )}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        {/* ── STEP 1: Select methodology ──────────────── */}
        {currentStep === 0 && (
          <motion.div key="step1" initial="hidden" animate="visible" exit="exit" variants={fadeUp} className="space-y-4">
            <p className="text-sm text-muted-foreground">Choose the communication impact you want to create.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {(Object.keys(METHODOLOGIES) as MethodologyKey[]).map(key => {
                const m = METHODOLOGIES[key];
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
            <div className="flex justify-end pt-2">
              <Button
                disabled={!selectedMethodology}
                onClick={() => setCurrentStep(1)}
                className="glow-gold font-semibold"
              >
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* ── STEP 2: Strategic questions ─────────────── */}
        {currentStep === 1 && selectedMethodology && (
          <motion.div key="step2" initial="hidden" animate="visible" exit="exit" variants={fadeUp} className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {METHODOLOGIES[selectedMethodology].tagline} — Strategic Questions
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Answer thoughtfully. Your answers will shape the AI-generated script.
              </p>
            </div>

            {METHODOLOGIES[selectedMethodology].questions.map((q, i) => (
              <div key={i} className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  {i + 1}. {q}
                </label>
                <Textarea
                  value={answers[i] || ''}
                  onChange={e => handleAnswerChange(i, e.target.value)}
                  placeholder="Write your answer here..."
                  className="min-h-[100px] bg-muted/50 border-border focus:border-primary"
                />
              </div>
            ))}

            <div className="flex justify-between pt-2">
              <Button variant="ghost" onClick={() => setCurrentStep(0)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button
                disabled={!allAnswered}
                onClick={handleGenerateScript}
                className="glow-gold font-semibold"
              >
                Generate Script <Sparkles className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* ── STEP 3: Script generation ──────────────── */}
        {currentStep === 2 && (
          <motion.div key="step3" initial="hidden" animate="visible" exit="exit" variants={fadeUp} className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Your Script</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {isGenerating ? 'AI is crafting your script...' : 'Review your generated script below.'}
              </p>
            </div>

            <Card className="gradient-card border-border">
              <CardContent className="pt-6">
                <div className="relative min-h-[200px]">
                  {isGenerating && !script && (
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Generating...</span>
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
              <Button variant="ghost" onClick={() => setCurrentStep(1)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button
                disabled={isGenerating || !script}
                onClick={() => setCurrentStep(3)}
                className="glow-gold font-semibold"
              >
                Refine Script <MessageSquare className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* ── STEP 4: AI Chat Refinement ─────────────── */}
        {currentStep === 3 && (
          <motion.div key="step4" initial="hidden" animate="visible" exit="exit" variants={fadeUp} className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Refine with AI</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Tell the AI how to improve your script. Each change updates it in real-time.
              </p>
            </div>

            {/* Current script preview */}
            <Card className="gradient-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Current Script</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap text-sm text-foreground leading-relaxed font-mono max-h-48 overflow-y-auto">
                  {script}
                </div>
              </CardContent>
            </Card>

            {/* Quick refinement chips */}
            <div className="flex flex-wrap gap-2">
              {QUICK_REFINEMENTS.map(r => (
                <button
                  key={r}
                  onClick={() => handleRefine(r)}
                  disabled={isRefining}
                  className="rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground hover:bg-nav-hover/30 transition-colors disabled:opacity-50"
                >
                  {r}
                </button>
              ))}
            </div>

            {/* Chat messages */}
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

            {/* Chat input */}
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
                placeholder="e.g. Make the hook more provocative..."
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
              <Button variant="ghost" onClick={() => setCurrentStep(2)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button
                onClick={() => setCurrentStep(4)}
                className="glow-gold font-semibold"
              >
                Validate & Continue <CheckCircle2 className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* ── STEP 5: Validation ─────────────────────── */}
        {currentStep === 4 && (
          <motion.div key="step5" initial="hidden" animate="visible" exit="exit" variants={fadeUp} className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Validate Your Script</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Review the final version. Once validated, you'll unlock the recording phase.
              </p>
            </div>

            {/* Final script */}
            <Card className="gradient-card border-primary/30 glow-gold">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Final Script — {selectedMethodology && METHODOLOGIES[selectedMethodology].tagline}</CardTitle>
                  <span className="text-xs text-primary font-medium">Ready for review</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap text-sm text-foreground leading-relaxed font-mono">
                  {script}
                </div>
              </CardContent>
            </Card>

            {/* Script structure breakdown */}
            {selectedMethodology && (
              <Card className="gradient-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Script Structure</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {METHODOLOGIES[selectedMethodology].scriptStructure.map((block, i) => (
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
              <Button variant="ghost" onClick={() => setCurrentStep(3)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Refine
              </Button>
              <Button
                onClick={handleSaveAndContinue}
                disabled={isSaving || saved}
                className="glow-gold font-semibold"
              >
                {saved ? (
                  <>Saved <Check className="ml-2 h-4 w-4" /></>
                ) : isSaving ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                ) : (
                  <>Validate & Unlock Recording <ArrowRight className="ml-2 h-4 w-4" /></>
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
};

export default CreateVideo;
