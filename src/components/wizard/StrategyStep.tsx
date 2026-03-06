import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Heart, Zap, Presentation } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTranslatedMethodologies, type MethodologyKey } from '@/lib/methodologies';
import { useVideoFlowStore } from '@/stores/videoFlowStore';

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

export default function StrategyStep() {
  const { t } = useTranslation();
  const methods = getTranslatedMethodologies(t);
  const { methodology, answers, setMethodology, setAnswers, updateAnswer } = useVideoFlowStore();

  const handleSelectMethodology = (key: MethodologyKey) => {
    setMethodology(key);
    const m = methods[key];
    if (!answers.length || methodology !== key) {
      setAnswers(new Array(m.questions.length).fill(''));
    }
  };

  return (
    <motion.div key="step-strategy" initial="hidden" animate="visible" exit="exit" variants={fadeUp} className="space-y-6">
      <p className="text-sm text-muted-foreground">{t('createVideo.chooseImpact')}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {(Object.keys(methods) as MethodologyKey[]).map(key => {
          const m = methods[key];
          const Icon = METHODOLOGY_ICONS[key];
          const selected = methodology === key;
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

      {/* Questions appear below with animation when methodology is selected */}
      <AnimatePresence>
        {methodology && (
          <motion.div
            key={`questions-${methodology}`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-6 overflow-hidden"
          >
            <div className="pt-4 border-t border-border">
              <h2 className="text-lg font-semibold text-foreground">
                {methods[methodology].tagline} — {t('createVideo.strategicQuestions')}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {t('createVideo.answersShape')}
              </p>
            </div>

            {methods[methodology].questions.map((q, i) => (
              <div key={i} className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  {i + 1}. {q}
                </label>
                <Textarea
                  value={answers[i] || ''}
                  onChange={e => updateAnswer(i, e.target.value)}
                  placeholder={METHODOLOGY_PLACEHOLDERS[methodology]?.[i] || t('createVideo.writePlaceholder')}
                  className="min-h-[100px] bg-muted/50 border-border focus:border-primary"
                />
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
