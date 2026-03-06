import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Video, Film, LayoutTemplate, ArrowRight, Target, Lightbulb,
  Zap, Megaphone, TrendingUp, Trophy, Flame, Calendar,
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
} from 'recharts';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

interface FeedbackRow {
  hook_score: number | null;
  clarity_score: number | null;
  energy_score: number | null;
  coherence_score: number | null;
  cta_strength: number | null;
  created_at: string;
  video_id: string;
}

function getConfidenceLevel(videoCount: number, t: (key: string) => string) {
  const levels = [
    { min: 0, label: t('dashboard.confidenceLevels.gettingStarted') },
    { min: 3, label: t('dashboard.confidenceLevels.findingVoice') },
    { min: 6, label: t('dashboard.confidenceLevels.buildingMomentum') },
    { min: 10, label: t('dashboard.confidenceLevels.confidentSpeaker') },
    { min: 15, label: t('dashboard.confidenceLevels.communicationPro') },
  ];
  let level = levels[0];
  for (const l of levels) {
    if (videoCount >= l.min) level = l;
  }
  const nextLevel = levels[levels.indexOf(level) + 1];
  const progressToNext = nextLevel
    ? ((videoCount - level.min) / (nextLevel.min - level.min)) * 100
    : 100;
  return { ...level, progress: Math.min(progressToNext, 100), nextLevel };
}

const Dashboard = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [fullName, setFullName] = useState('');
  const [stats, setStats] = useState({ videos: 0, scripts: 0 });
  const [feedbackHistory, setFeedbackHistory] = useState<FeedbackRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [profileRes, videosRes, scriptsRes, feedbackRes] = await Promise.all([
        supabase.from('profiles').select('full_name').eq('id', user.id).single(),
        supabase.from('videos').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('scripts').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('feedback').select('hook_score, clarity_score, energy_score, coherence_score, cta_strength, created_at, video_id')
          .order('created_at', { ascending: true }),
      ]);
      if (profileRes.data?.full_name) setFullName(profileRes.data.full_name);
      setStats({ videos: videosRes.count ?? 0, scripts: scriptsRes.count ?? 0 });
      setFeedbackHistory((feedbackRes.data ?? []) as FeedbackRow[]);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const displayName = fullName || user?.email?.split('@')[0] || 'there';
  const confidence = getConfidenceLevel(stats.videos, t);
  const hasFeedback = feedbackHistory.length > 0;

  const trendData = feedbackHistory.map((f, i) => ({
    session: `#${i + 1}`,
    hook: f.hook_score ?? 0,
    clarity: f.clarity_score ?? 0,
    energy: f.energy_score ?? 0,
    cta: f.cta_strength ?? 0,
  }));

  const latest = feedbackHistory[feedbackHistory.length - 1];
  const first = feedbackHistory[0];
  const radarData = latest ? [
    { metric: t('dashboard.hook'), current: latest.hook_score ?? 0, first: first?.hook_score ?? 0 },
    { metric: t('dashboard.clarity'), current: latest.clarity_score ?? 0, first: first?.clarity_score ?? 0 },
    { metric: t('dashboard.energy'), current: latest.energy_score ?? 0, first: first?.energy_score ?? 0 },
    { metric: t('dashboard.coherence'), current: latest.coherence_score ?? 0, first: first?.coherence_score ?? 0 },
    { metric: t('dashboard.cta'), current: latest.cta_strength ?? 0, first: first?.cta_strength ?? 0 },
  ] : [];

  const avgScores = hasFeedback ? {
    hook: avg(feedbackHistory.map(f => f.hook_score)),
    clarity: avg(feedbackHistory.map(f => f.clarity_score)),
    energy: avg(feedbackHistory.map(f => f.energy_score)),
    coherence: avg(feedbackHistory.map(f => f.coherence_score)),
    cta: avg(feedbackHistory.map(f => f.cta_strength)),
  } : null;

  const improvement = feedbackHistory.length >= 2 ? calcImprovement(feedbackHistory) : null;

  const actions = [
    { icon: Video, title: t('nav.createVideo'), desc: t('dashboard.createVideoDesc'), to: '/create-video', color: 'text-primary' },
    { icon: Film, title: t('nav.myVideos'), desc: t('dashboard.myVideosDesc'), to: '/my-videos', color: 'text-accent' },
    { icon: LayoutTemplate, title: t('nav.templates'), desc: t('dashboard.templatesDesc'), to: '/templates', color: 'text-soft-blue' },
  ];

  return (
    <AppLayout>
      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="mb-4">
        <h1 className="text-3xl font-bold text-foreground">{t('dashboard.welcome', { name: displayName })}</h1>
        <p className="mt-2 text-muted-foreground">{t('dashboard.subtitle')}</p>
      </motion.div>

      {/* Quick actions */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1} className="mb-8">
        <h2 className="text-lg font-semibold text-foreground mb-4">{t('dashboard.quickActions')}</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {actions.map((a, i) => (
            <motion.div key={a.title} initial="hidden" animate="visible" variants={fadeUp} custom={i + 2}>
              <Link to={a.to}>
                <Card className="gradient-card border-border group cursor-pointer transition-all duration-300 hover:border-primary/30 hover:scale-[1.02]">
                  <CardHeader className="pb-2">
                    <div className={`mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-secondary ${a.color}`}>
                      <a.icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-base">{a.title}</CardTitle>
                    <CardDescription className="text-xs">{a.desc}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <span className="inline-flex items-center text-sm text-primary opacity-0 transition-opacity group-hover:opacity-100">
                      {t('dashboard.go')} <ArrowRight className="ml-1 h-3 w-3" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {[
          { label: t('dashboard.videos'), value: stats.videos, icon: Film, color: 'text-accent' },
          { label: t('dashboard.scripts'), value: stats.scripts, icon: LayoutTemplate, color: 'text-soft-blue' },
          { label: t('dashboard.avgScore'), value: avgScores ? `${((avgScores.hook + avgScores.clarity + avgScores.energy + avgScores.coherence + avgScores.cta) / 5).toFixed(1)}/10` : '—', icon: Trophy, color: 'text-primary' },
          { label: t('dashboard.sessions'), value: feedbackHistory.length, icon: Calendar, color: 'text-energy-cyan' },
        ].map((s, i) => (
          <motion.div key={s.label} initial="hidden" animate="visible" variants={fadeUp} custom={i + 1}>
            <Card className="gradient-card border-border">
              <CardContent className="flex items-center gap-4 py-5">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-secondary ${s.color}`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Confidence Level */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={5}>
        <Card className="gradient-card border-border mb-8 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5" />
          <CardContent className="relative py-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div>
                  <h3 className="font-semibold text-foreground">{confidence.label}</h3>
                  <p className="text-xs text-muted-foreground">
                    {confidence.nextLevel
                      ? t('dashboard.moreVideosTo', { count: confidence.nextLevel.min - stats.videos, level: confidence.nextLevel.label })
                      : t('dashboard.maxLevel')}
                  </p>
                </div>
              </div>
              {improvement !== null && (
                <Badge variant="outline" className={`gap-1 ${improvement >= 0 ? 'bg-green-500/15 text-green-400 border-green-500/25' : 'bg-destructive/15 text-destructive border-destructive/25'}`}>
                  <TrendingUp className={`h-3 w-3 ${improvement < 0 ? 'rotate-180' : ''}`} />
                  {improvement >= 0 ? '+' : ''}{improvement.toFixed(1)} avg
                </Badge>
              )}
            </div>
            <Progress value={confidence.progress} className="h-2 bg-secondary [&>div]:bg-primary" />
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts */}
      {hasFeedback && (
        <div className="grid gap-4 lg:grid-cols-5 mb-8">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={6} className="lg:col-span-3">
            <Card className="gradient-card border-border h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  {t('dashboard.performanceOverTime')}
                </CardTitle>
                <CardDescription>{t('dashboard.performanceDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="hookGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(40, 92%, 55%)" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="hsl(40, 92%, 55%)" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="clarityGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(195, 85%, 50%)" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="hsl(195, 85%, 50%)" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="energyGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(292, 80%, 63%)" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="hsl(292, 80%, 63%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="session" tick={{ fill: 'hsl(250,20%,55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 10]} tick={{ fill: 'hsl(250,20%,55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: 'hsl(260,50%,11%)', border: '1px solid hsl(260,30%,18%)', borderRadius: '8px', fontSize: '12px', color: 'hsl(240,20%,95%)' }} />
                      <Area type="monotone" dataKey="hook" stroke="hsl(40,92%,55%)" fill="url(#hookGrad)" strokeWidth={2} name={t('dashboard.hook')} />
                      <Area type="monotone" dataKey="clarity" stroke="hsl(195,85%,50%)" fill="url(#clarityGrad)" strokeWidth={2} name={t('dashboard.clarity')} />
                      <Area type="monotone" dataKey="energy" stroke="hsl(292,80%,63%)" fill="url(#energyGrad)" strokeWidth={2} name={t('dashboard.energy')} />
                      <Area type="monotone" dataKey="cta" stroke="hsl(250,40%,65%)" fill="none" strokeWidth={2} strokeDasharray="4 4" name={t('dashboard.cta')} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-4 mt-3 justify-center">
                  {[
                    { label: t('dashboard.hook'), color: 'bg-primary' },
                    { label: t('dashboard.clarity'), color: 'bg-accent' },
                    { label: t('dashboard.energy'), color: 'bg-energy-cyan' },
                    { label: t('dashboard.cta'), color: 'bg-soft-blue' },
                  ].map(l => (
                    <div key={l.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <div className={`h-2 w-2 rounded-full ${l.color}`} /> {l.label}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={7} className="lg:col-span-2">
            <Card className="gradient-card border-border h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  {t('dashboard.skillProfile')}
                </CardTitle>
                <CardDescription>
                  {feedbackHistory.length > 1 ? t('dashboard.latestVsFirst') : t('dashboard.currentProfile')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                      <PolarGrid stroke="hsl(260,30%,18%)" />
                      <PolarAngleAxis dataKey="metric" tick={{ fill: 'hsl(250,20%,55%)', fontSize: 11 }} />
                      {feedbackHistory.length > 1 && (
                        <Radar name={t('dashboard.first')} dataKey="first" stroke="hsl(260,30%,40%)" fill="hsl(260,30%,40%)" fillOpacity={0.15} strokeWidth={1} strokeDasharray="4 4" />
                      )}
                      <Radar name={t('dashboard.current')} dataKey="current" stroke="hsl(40,92%,55%)" fill="hsl(40,92%,55%)" fillOpacity={0.2} strokeWidth={2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                {feedbackHistory.length > 1 && (
                  <div className="flex gap-4 justify-center mt-2">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <div className="h-2 w-2 rounded-full bg-primary" /> {t('dashboard.current')}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <div className="h-2 w-2 rounded-full bg-muted-foreground" /> {t('dashboard.first')}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Metric Breakdown */}
      {avgScores && (
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={8} className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Flame className="h-5 w-5 text-primary" />
            {t('dashboard.strengthsGrowth')}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { key: 'hook', label: t('dashboard.hook'), icon: Target, score: avgScores.hook },
              { key: 'clarity', label: t('dashboard.clarity'), icon: Lightbulb, score: avgScores.clarity },
              { key: 'energy', label: t('dashboard.energy'), icon: Zap, score: avgScores.energy },
              { key: 'coherence', label: t('dashboard.coherence'), icon: TrendingUp, score: avgScores.coherence },
              { key: 'cta', label: t('dashboard.cta'), icon: Megaphone, score: avgScores.cta },
            ].map(m => {
              const isStrength = m.score >= 7;
              const isWeak = m.score < 5;
              return (
                <Card key={m.key} className="gradient-card border-border">
                  <CardContent className="py-4 flex flex-col items-center gap-2">
                    <m.icon className={`h-5 w-5 ${isStrength ? 'text-green-400' : isWeak ? 'text-destructive' : 'text-primary'}`} />
                    <span className="text-xs text-muted-foreground">{m.label}</span>
                    <span className={`text-xl font-bold ${isStrength ? 'text-green-400' : isWeak ? 'text-destructive' : 'text-primary'}`}>
                      {m.score.toFixed(1)}
                    </span>
                    <Badge variant="outline" className={`text-[10px] ${isStrength ? 'bg-green-500/15 text-green-400 border-green-500/25' : isWeak ? 'bg-destructive/15 text-destructive border-destructive/25' : 'bg-primary/15 text-primary border-primary/25'}`}>
                      {isStrength ? t('dashboard.strength') : isWeak ? t('dashboard.focusArea') : t('dashboard.growing')}
                    </Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Empty state */}
      {!hasFeedback && !loading && (
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={6}>
          <Card className="gradient-card border-border text-center py-12 mb-8">
            <CardContent className="flex flex-col items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
                <TrendingUp className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">{t('dashboard.noDataTitle')}</h3>
              <p className="text-sm text-muted-foreground max-w-sm">{t('dashboard.noDataDesc')}</p>
              <Link to="/create-video">
                <Button className="glow-gold font-semibold gap-2 mt-2">
                  {t('dashboard.createFirst')} <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Quick actions */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={9}>
        <h2 className="text-lg font-semibold text-foreground mb-4">{t('dashboard.quickActions')}</h2>
      </motion.div>
      <div className="grid gap-4 sm:grid-cols-3">
        {actions.map((a, i) => (
          <motion.div key={a.title} initial="hidden" animate="visible" variants={fadeUp} custom={i + 10}>
            <Link to={a.to}>
              <Card className="gradient-card border-border group cursor-pointer transition-all duration-300 hover:border-primary/30 hover:scale-[1.02]">
                <CardHeader className="pb-2">
                  <div className={`mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-secondary ${a.color}`}>
                    <a.icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base">{a.title}</CardTitle>
                  <CardDescription className="text-xs">{a.desc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <span className="inline-flex items-center text-sm text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    {t('dashboard.go')} <ArrowRight className="ml-1 h-3 w-3" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
    </AppLayout>
  );
};

function avg(values: (number | null)[]): number {
  const valid = values.filter((v): v is number => v !== null);
  if (valid.length === 0) return 0;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

function calcImprovement(data: FeedbackRow[]): number {
  const scoreOf = (f: FeedbackRow) =>
    ((f.hook_score ?? 0) + (f.clarity_score ?? 0) + (f.energy_score ?? 0) +
     (f.coherence_score ?? 0) + (f.cta_strength ?? 0)) / 5;
  const take = Math.min(3, Math.floor(data.length / 2));
  const firstSlice = data.slice(0, take);
  const lastSlice = data.slice(-take);
  const firstAvg = firstSlice.reduce((s, f) => s + scoreOf(f), 0) / firstSlice.length;
  const lastAvg = lastSlice.reduce((s, f) => s + scoreOf(f), 0) / lastSlice.length;
  return lastAvg - firstAvg;
}

export default Dashboard;
