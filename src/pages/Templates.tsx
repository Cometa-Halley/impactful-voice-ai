import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  LayoutTemplate, Sparkles, Heart, Zap, Presentation, Clock, ArrowRight,
  TrendingUp, GraduationCap, ShoppingBag, Lightbulb, Award, Filter,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { METHODOLOGIES, type MethodologyKey } from '@/lib/methodologies';

const CATEGORIES = [
  { key: 'all', label: 'All', icon: Filter },
  { key: 'Viral', label: 'Viral', icon: TrendingUp },
  { key: 'Educational', label: 'Educational', icon: GraduationCap },
  { key: 'Sales', label: 'Sales', icon: ShoppingBag },
  { key: 'Entrepreneur Tips', label: 'Entrepreneur', icon: Lightbulb },
  { key: 'Authority Content', label: 'Authority', icon: Award },
] as const;

const METHODOLOGY_ICONS: Record<string, typeof Sparkles> = {
  sinek: Sparkles,
  obama: Heart,
  robbins: Zap,
  jobs: Presentation,
};

const METHODOLOGY_COLORS: Record<string, string> = {
  sinek: 'bg-primary/15 text-primary border-primary/25',
  obama: 'bg-pink-500/15 text-pink-400 border-pink-500/25',
  robbins: 'bg-accent/15 text-accent border-accent/25',
  jobs: 'bg-violet-500/15 text-violet-400 border-violet-500/25',
};

interface Template {
  id: string;
  category: string;
  title: string | null;
  description: string | null;
  methodology: string | null;
  recommended_duration: string | null;
  structure: string[] | null;
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const Templates = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  const CATEGORIES = [
    { key: 'all', label: t('templates.all'), icon: Filter },
    { key: 'Viral', label: t('templates.viral'), icon: TrendingUp },
    { key: 'Educational', label: t('templates.educational'), icon: GraduationCap },
    { key: 'Sales', label: t('templates.sales'), icon: ShoppingBag },
    { key: 'Entrepreneur Tips', label: t('templates.entrepreneur'), icon: Lightbulb },
    { key: 'Authority Content', label: t('templates.authority'), icon: Award },
  ];

  useEffect(() => {
    supabase
      .from('templates')
      .select('*')
      .order('category', { ascending: true })
      .then(({ data }) => {
        setTemplates((data as unknown as Template[]) ?? []);
        setLoading(false);
      });
  }, []);

  const filtered = activeCategory === 'all'
    ? templates
    : templates.filter(t => t.category === activeCategory);

  const handleUseTemplate = (template: Template) => {
    navigate(`/create-video?methodology=${template.methodology}&templateId=${template.id}`);
  };

  return (
    <AppLayout>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-foreground">{t('templates.title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('templates.subtitle')}</p>
      </motion.div>

      {/* Category Filter */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="flex flex-wrap gap-2 mb-8"
      >
        {CATEGORIES.map(cat => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.key;
          return (
            <Button
              key={cat.key}
              variant={isActive ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory(cat.key)}
              className={`gap-1.5 transition-all ${
                isActive
                  ? 'glow-gold'
                  : 'border-border text-muted-foreground hover:text-foreground hover:border-primary/40'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {cat.label}
            </Button>
          );
        })}
      </motion.div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card className="gradient-card border-border text-center py-16">
            <CardContent className="flex flex-col items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
                <LayoutTemplate className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">{t('templates.noTemplates')}</h3>
              <p className="text-sm text-muted-foreground max-w-sm">{t('templates.noTemplatesDesc')}</p>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((t, i) => {
              const MethodIcon = METHODOLOGY_ICONS[t.methodology ?? ''] ?? Sparkles;
              const methodColor = METHODOLOGY_COLORS[t.methodology ?? ''] ?? 'bg-secondary text-muted-foreground border-border';
              const methodLabel = t.methodology ? METHODOLOGIES[t.methodology as MethodologyKey]?.name : null;
              const structure = (t.structure ?? []) as string[];

              return (
                <motion.div
                  key={t.id}
                  layout
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, scale: 0.95 }}
                  variants={fadeUp}
                  custom={i}
                >
                  <Card
                    className="gradient-card border-border cursor-pointer transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 group h-full flex flex-col"
                    onClick={() => setSelectedTemplate(t)}
                  >
                    <CardHeader className="pb-3 flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="bg-secondary/80 text-muted-foreground border-border text-xs">
                          {t.category}
                        </Badge>
                        {t.recommended_duration && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {t.recommended_duration}
                          </div>
                        )}
                      </div>
                      <CardTitle className="text-base group-hover:text-primary transition-colors">
                        {t.title ?? t.category}
                      </CardTitle>
                      <CardDescription className="text-sm line-clamp-2">
                        {t.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between">
                        {methodLabel && (
                          <Badge variant="outline" className={`${methodColor} text-xs gap-1`}>
                            <MethodIcon className="h-3 w-3" />
                            {methodLabel.split('—')[0].trim()}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {t('templates.blocks', { count: structure.length })}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Template Detail Dialog */}
      <Dialog open={!!selectedTemplate} onOpenChange={(open) => !open && setSelectedTemplate(null)}>
        {selectedTemplate && (() => {
          const MethodIcon = METHODOLOGY_ICONS[selectedTemplate.methodology ?? ''] ?? Sparkles;
          const methodColor = METHODOLOGY_COLORS[selectedTemplate.methodology ?? ''] ?? 'bg-secondary text-muted-foreground border-border';
          const methodData = selectedTemplate.methodology ? METHODOLOGIES[selectedTemplate.methodology as MethodologyKey] : null;
          const structure = (selectedTemplate.structure ?? []) as string[];

          return (
            <DialogContent className="bg-card border-border max-w-lg">
              <DialogHeader>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="bg-secondary/80 text-muted-foreground border-border text-xs">
                    {selectedTemplate.category}
                  </Badge>
                  {selectedTemplate.recommended_duration && (
                    <Badge variant="outline" className="bg-secondary/80 text-muted-foreground border-border text-xs gap-1">
                      <Clock className="h-3 w-3" />
                      {selectedTemplate.recommended_duration}
                    </Badge>
                  )}
                </div>
                <DialogTitle className="text-xl">{selectedTemplate.title ?? selectedTemplate.category}</DialogTitle>
                <DialogDescription>{selectedTemplate.description}</DialogDescription>
              </DialogHeader>

              {/* Methodology */}
              {methodData && (
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className={`${methodColor} gap-1`}>
                    <MethodIcon className="h-3.5 w-3.5" />
                    {methodData.name}
                  </Badge>
                </div>
              )}

              {/* Structure */}
              {structure.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h4 className="text-sm font-semibold text-foreground">{t('templates.exampleStructure')}</h4>
                  <div className="space-y-2">
                    {structure.map((block, i) => {
                      const [title, ...rest] = block.split('—');
                      const desc = rest.join('—').trim();
                      return (
                        <div key={i} className="flex gap-3 items-start">
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-bold mt-0.5">
                            {i + 1}
                          </div>
                          <div>
                            <span className="text-sm font-medium text-foreground">{title.trim()}</span>
                            {desc && <p className="text-xs text-muted-foreground">{desc}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <DialogFooter className="mt-4">
                <Button variant="outline" onClick={() => setSelectedTemplate(null)}>
                  {t('templates.close')}
                </Button>
                <Button
                  onClick={() => handleUseTemplate(selectedTemplate)}
                  className="glow-gold font-semibold gap-2"
                >
                  {t('templates.useTemplate')} <ArrowRight className="h-4 w-4" />
                </Button>
              </DialogFooter>
            </DialogContent>
          );
        })()}
      </Dialog>
    </AppLayout>
  );
};

export default Templates;
