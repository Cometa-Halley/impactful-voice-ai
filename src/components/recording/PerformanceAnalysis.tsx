import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Target, Lightbulb, Zap, GitMerge, Megaphone, Trophy,
  RotateCcw, ArrowRight, AlertTriangle, CheckCircle2, Info,
} from 'lucide-react';
import { motion } from 'framer-motion';
import type { AnalysisResult } from '@/lib/ai-service';

interface Props {
  analysis: AnalysisResult;
  onReRecord: () => void;
  onFinish: () => void;
}

function getScoreColor(score: number): string {
  if (score >= 8) return 'text-green-400';
  if (score >= 6) return 'text-primary';
  if (score >= 4) return 'text-yellow-400';
  return 'text-destructive';
}

function getProgressColor(score: number): string {
  if (score >= 8) return '[&>div]:bg-green-400';
  if (score >= 6) return '[&>div]:bg-primary';
  if (score >= 4) return '[&>div]:bg-yellow-400';
  return '[&>div]:bg-destructive';
}

const priorityConfig = {
  high: { icon: AlertTriangle, color: 'bg-destructive/20 text-destructive border-destructive/30' },
  medium: { icon: Info, color: 'bg-primary/20 text-primary border-primary/30' },
  low: { icon: CheckCircle2, color: 'bg-green-400/20 text-green-400 border-green-400/30' },
};

export default function PerformanceAnalysis({ analysis, onReRecord, onFinish }: Props) {
  const { t } = useTranslation();

  const SCORE_DIMENSIONS = [
    { key: 'hook_score' as const, label: t('analysis.hookStrength'), icon: Target, description: t('analysis.hookDesc') },
    { key: 'clarity_score' as const, label: t('analysis.messageClarity'), icon: Lightbulb, description: t('analysis.clarityDesc') },
    { key: 'energy_score' as const, label: t('analysis.energyLevel'), icon: Zap, description: t('analysis.energyDesc') },
    { key: 'coherence_score' as const, label: t('analysis.methodCoherence'), icon: GitMerge, description: t('analysis.coherenceDesc') },
    { key: 'cta_strength' as const, label: t('analysis.cta'), icon: Megaphone, description: t('analysis.ctaDesc') },
  ];

  function getScoreLabel(score: number): string {
    if (score >= 9) return t('analysis.excellent');
    if (score >= 7) return t('analysis.good');
    if (score >= 5) return t('analysis.average');
    if (score >= 3) return t('analysis.needsWork');
    return t('analysis.poor');
  }

  const shouldReRecord = analysis.overall_score < 5;
  const highPrioritySuggestions = analysis.suggestions.filter(s => s.priority === 'high');

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-3xl mx-auto space-y-6">
      {/* Overall Score */}
      <Card className="gradient-card border-border overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <CardContent className="relative pt-8 pb-8 flex flex-col items-center gap-4">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, delay: 0.2 }} className="relative">
            <div className="h-28 w-28 rounded-full border-4 border-primary/30 flex items-center justify-center bg-secondary/50">
              <div className="text-center">
                <span className={`text-4xl font-bold ${getScoreColor(analysis.overall_score)}`}>{analysis.overall_score}</span>
                <span className="text-muted-foreground text-sm">/10</span>
              </div>
            </div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="absolute -bottom-2 left-1/2 -translate-x-1/2">
              <Badge variant="outline" className="bg-secondary border-border text-foreground text-xs">{getScoreLabel(analysis.overall_score)}</Badge>
            </motion.div>
          </motion.div>
          <p className="text-sm text-muted-foreground text-center max-w-md mt-4">{analysis.summary}</p>
          {shouldReRecord && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="flex items-center gap-2 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg px-4 py-2 text-sm">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{t('analysis.recommendReRecord')}</span>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Score Breakdown */}
      <Card className="gradient-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            {t('analysis.scoreBreakdown')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {SCORE_DIMENSIONS.map((dim, i) => {
            const score = analysis[dim.key];
            const Icon = dim.icon;
            return (
              <motion.div key={dim.key} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * i }} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">{dim.label}</span>
                  </div>
                  <span className={`text-sm font-bold ${getScoreColor(score)}`}>{score}/10</span>
                </div>
                <Progress value={score * 10} className={`h-2 bg-secondary ${getProgressColor(score)}`} />
                <p className="text-xs text-muted-foreground">{dim.description}</p>
              </motion.div>
            );
          })}
        </CardContent>
      </Card>

      {/* Suggestions */}
      <Card className="gradient-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            {t('analysis.suggestions')}
            {highPrioritySuggestions.length > 0 && (
              <Badge variant="destructive" className="text-xs ml-auto">
                {t('analysis.highPriority', { count: highPrioritySuggestions.length })}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" defaultValue={analysis.suggestions.filter(s => s.priority === 'high').map((_, i) => `suggestion-${i}`)}>
            {analysis.suggestions.map((suggestion, i) => {
              const config = priorityConfig[suggestion.priority];
              const PriorityIcon = config.icon;
              return (
                <AccordionItem key={i} value={`suggestion-${i}`} className="border-border">
                  <AccordionTrigger className="hover:no-underline py-3">
                    <div className="flex items-center gap-3 text-left">
                      <Badge variant="outline" className={`${config.color} text-xs capitalize shrink-0`}>
                        <PriorityIcon className="h-3 w-3 mr-1" />
                        {t(`analysis.${suggestion.priority}`)}
                      </Badge>
                      <span className="text-sm font-medium text-foreground">{suggestion.area}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground pb-4">{suggestion.suggestion}</AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>

      {/* Actions */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="flex justify-center gap-4 pt-2">
        <Button variant="outline" onClick={onReRecord} className="gap-2">
          <RotateCcw className="h-4 w-4" /> {t('analysis.reRecord')}
        </Button>
        <Button onClick={onFinish} className="glow-gold font-semibold gap-2">
          {t('analysis.finish')} <ArrowRight className="h-4 w-4" />
        </Button>
      </motion.div>
    </motion.div>
  );
}
