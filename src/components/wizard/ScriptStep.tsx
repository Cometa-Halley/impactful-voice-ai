import { useRef, useEffect, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send, Sparkles, Check, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useVideoFlowStore } from '@/stores/videoFlowStore';
import { refineScript } from '@/lib/ai-service';
import { formatScriptForDisplay } from '@/lib/clean-script';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
  exit: { opacity: 0, y: -16, transition: { duration: 0.3 } },
};

const QUICK_REFINEMENT_KEYS = [
  'moreDirect', 'reduce30', 'moreEmotional', 'addUrgency', 'simplify',
] as const;

/** Convert any raw value (possibly JSON) into clean readable script text */
function toReadableScript(raw: string | null | undefined): string {
  if (!raw) return '';
  return formatScriptForDisplay(raw);
}

export default function ScriptStep() {
  const { t, i18n } = useTranslation();
  const {
    script, proposedScript, isGenerating, isRefining, chatMessages, methodology,
    setIsRefining, addChatMessage, updateLastAssistantMessage,
    setProposedScript, acceptProposal, rejectProposal,
  } = useVideoFlowStore();

  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const QUICK_REFINEMENTS = QUICK_REFINEMENT_KEYS.map(key => ({
    key,
    label: t(`createVideo.quickRefinements.${key}`),
  }));

  const handleRefine = useCallback(async (instruction: string) => {
    if (!methodology || !script || isRefining) return;
    addChatMessage({ role: 'user', content: instruction });
    setChatInput('');
    setIsRefining(true);

    let refined = '';
    try {
      await refineScript({
        methodology,
        script,
        instruction,
        history: chatMessages,
        language: i18n.language,
        onDelta: (text) => {
          refined += text;
          updateLastAssistantMessage(refined);
        },
        onDone: () => {
          setProposedScript(refined);
          setIsRefining(false);
        },
      });
    } catch {
      setIsRefining(false);
    }
  }, [methodology, script, chatMessages, isRefining, addChatMessage, updateLastAssistantMessage, setProposedScript, setIsRefining, i18n.language]);

  const hasProposal = !!proposedScript;

  const displayedScript = toReadableScript(script);

  return (
    <motion.div key="step-script" initial="hidden" animate="visible" exit="exit" variants={fadeUp}>
      <div className="grid gap-6 lg:grid-cols-2 min-h-[60vh] items-start">
        {/* Left: Script document */}
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {hasProposal ? t('createVideo.proposedChanges', 'Cambios propuestos') : t('createVideo.yourScript')}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {isGenerating
                ? t('createVideo.aiCrafting')
                : hasProposal
                  ? t('createVideo.reviewProposal', 'Revisa el guion refinado. Si te convence, acepta los cambios.')
                  : t('createVideo.reviewScript')}
            </p>
          </div>

          {/* Accept / Reject bar */}
          {hasProposal && (
            <div className="flex gap-2">
              <Button onClick={acceptProposal} className="gap-2" variant="default">
                <Check className="h-4 w-4" />
                {t('createVideo.acceptChanges', 'Aceptar cambios')}
              </Button>
              <Button onClick={rejectProposal} variant="outline" className="gap-2">
                <X className="h-4 w-4" />
                {t('createVideo.rejectChanges', 'Rechazar')}
              </Button>
            </div>
          )}

          <Card className="gradient-card border-border h-[calc(100%-5rem)]">
            <CardContent className="pt-6 h-full overflow-y-auto">
              <div className="relative min-h-[200px]">
                {isGenerating && !script && (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>{t('createVideo.generating')}</span>
                  </div>
                )}

                <div className="whitespace-pre-wrap text-sm text-foreground leading-relaxed">
                  {displayedScript}
                  {isGenerating && <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-0.5" />}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Chat refinement */}
        <div className="space-y-4 flex flex-col rounded-2xl border-2 border-primary p-4 shadow-[0_0_20px_hsl(var(--primary)/0.15)]">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{t('createVideo.refineWithAI')}</h2>
            <p className="text-sm text-muted-foreground mt-1">{t('createVideo.refineDesc')}</p>
          </div>

          {/* Quick refinements */}
          <div className="flex flex-wrap gap-2">
            {QUICK_REFINEMENTS.map(r => (
              <button
                key={r.key}
                onClick={() => handleRefine(r.label)}
                disabled={isRefining || isGenerating || !script || hasProposal}
                className="rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground hover:bg-nav-hover/30 transition-colors disabled:opacity-50"
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Chat messages */}
          <div className="flex-1 space-y-3 overflow-y-auto rounded-lg bg-muted/30 p-4 min-h-[200px] max-h-[400px]">
            {chatMessages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                <Sparkles className="h-8 w-8 text-primary/40" />
                <p className="text-sm text-center">{t('createVideo.refineDesc')}</p>
              </div>
            )}
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm ${
                  msg.role === 'user'
                    ? 'bg-nav-hover text-white'
                    : 'bg-secondary text-foreground'
                }`}>
                  <div className="whitespace-pre-wrap">
                    {msg.role === 'assistant' ? toReadableScript(msg.content) : msg.content}
                  </div>
                </div>
              </div>
            ))}
            {isRefining && chatMessages[chatMessages.length - 1]?.role !== 'assistant' && (
              <div className="flex justify-start">
                <div className="bg-secondary rounded-xl px-4 py-2.5">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

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
              placeholder={t('createVideo.chatPlaceholder')}
              className="bg-muted/50 border-border focus:border-primary"
              disabled={isRefining || isGenerating || !script || hasProposal}
            />
            <Button
              size="icon"
              disabled={!chatInput.trim() || isRefining || isGenerating || !script || hasProposal}
              onClick={() => handleRefine(chatInput.trim())}
              className="shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
