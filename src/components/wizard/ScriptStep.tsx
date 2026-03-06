import { useRef, useEffect, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send, Sparkles, Check, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useVideoFlowStore } from '@/stores/videoFlowStore';
import { refineScript } from '@/lib/ai-service';
import { formatScriptForDisplay } from '@/lib/clean-script';
import { motion } from 'framer-motion';
import { useVideoFlowStore } from '@/stores/videoFlowStore';
import { refineScript } from '@/lib/ai-service';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
  exit: { opacity: 0, y: -16, transition: { duration: 0.3 } },
};

const QUICK_REFINEMENT_KEYS = [
  'moreDirect', 'reduce30', 'moreEmotional', 'addUrgency', 'simplify',
] as const;

/* ── Simple line-diff helper ── */
function diffLines(oldText: string, newText: string) {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  const maxLen = Math.max(oldLines.length, newLines.length);
  const result: Array<{ type: 'same' | 'removed' | 'added'; text: string }> = [];

  // Simple LCS-based approach: match equal lines, mark rest as added/removed
  const oldSet = new Map<string, number[]>();
  oldLines.forEach((line, i) => {
    if (!oldSet.has(line)) oldSet.set(line, []);
    oldSet.get(line)!.push(i);
  });

  let oi = 0;
  let ni = 0;
  while (oi < oldLines.length && ni < newLines.length) {
    if (oldLines[oi] === newLines[ni]) {
      result.push({ type: 'same', text: oldLines[oi] });
      oi++;
      ni++;
    } else {
      // Look ahead in new for a match with current old
      let foundInNew = -1;
      for (let j = ni + 1; j < Math.min(ni + 5, newLines.length); j++) {
        if (newLines[j] === oldLines[oi]) { foundInNew = j; break; }
      }
      let foundInOld = -1;
      for (let j = oi + 1; j < Math.min(oi + 5, oldLines.length); j++) {
        if (oldLines[j] === newLines[ni]) { foundInOld = j; break; }
      }

      if (foundInNew !== -1 && (foundInOld === -1 || foundInNew - ni <= foundInOld - oi)) {
        // Lines added in new
        for (let j = ni; j < foundInNew; j++) {
          result.push({ type: 'added', text: newLines[j] });
        }
        ni = foundInNew;
      } else if (foundInOld !== -1) {
        // Lines removed from old
        for (let j = oi; j < foundInOld; j++) {
          result.push({ type: 'removed', text: oldLines[j] });
        }
        oi = foundInOld;
      } else {
        result.push({ type: 'removed', text: oldLines[oi] });
        result.push({ type: 'added', text: newLines[ni] });
        oi++;
        ni++;
      }
    }
  }
  while (oi < oldLines.length) {
    result.push({ type: 'removed', text: oldLines[oi++] });
  }
  while (ni < newLines.length) {
    result.push({ type: 'added', text: newLines[ni++] });
  }
  return result;
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

  const diff = useMemo(() => {
    if (!proposedScript || !script) return null;
    return diffLines(script, proposedScript);
  }, [script, proposedScript]);

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
          // Store as proposal, don't auto-apply
          setProposedScript(refined);
          setIsRefining(false);
        },
      });
    } catch {
      setIsRefining(false);
    }
  }, [methodology, script, chatMessages, isRefining, addChatMessage, updateLastAssistantMessage, setProposedScript, setIsRefining, i18n.language]);

  const hasProposal = !!proposedScript;

  return (
    <motion.div key="step-script" initial="hidden" animate="visible" exit="exit" variants={fadeUp}>
      <div className="grid gap-6 lg:grid-cols-2 min-h-[60vh] items-start">
        {/* Left: Script document or Diff view */}
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {hasProposal ? t('createVideo.proposedChanges', 'Cambios propuestos') : t('createVideo.yourScript')}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {isGenerating
                ? t('createVideo.aiCrafting')
                : hasProposal
                  ? t('createVideo.reviewProposal', 'Revisa los cambios sugeridos. Verde = añadido, rojo = eliminado.')
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

                {/* Diff view when proposal exists */}
                {hasProposal && diff ? (
                  <div className="text-sm font-mono leading-relaxed space-y-0">
                    {diff.map((line, i) => (
                      <div
                        key={i}
                        className={
                          line.type === 'added'
                            ? 'bg-green-500/15 text-green-400 border-l-2 border-green-500 pl-3'
                            : line.type === 'removed'
                              ? 'bg-red-500/15 text-red-400 border-l-2 border-red-500 pl-3 line-through opacity-70'
                              : 'text-foreground pl-3'
                        }
                      >
                        <span className="select-none text-muted-foreground mr-2 text-xs">
                          {line.type === 'added' ? '+' : line.type === 'removed' ? '−' : ' '}
                        </span>
                        {line.text || '\u00A0'}
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Normal script view */
                  <div className="whitespace-pre-wrap text-sm text-foreground leading-relaxed font-mono">
                    {formatScriptForDisplay(script)}
                    {isGenerating && <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-0.5" />}
                  </div>
                )}
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
                  <div className="whitespace-pre-wrap">{msg.content}</div>
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
