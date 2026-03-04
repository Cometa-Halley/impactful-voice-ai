import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Lightbulb, FileText, Video, TrendingUp, Users, Mic, Brain, Target, ArrowRight } from 'lucide-react';
import logoPresencia from '@/assets/logo-presencia.png';
import ParticleBackground from '@/components/ParticleBackground';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const stepIcons = [Lightbulb, FileText, Video, TrendingUp];
const audienceIcons = [Target, Users, Mic, Brain];

const Index = () => {
  const { t } = useTranslation();

  const steps = [
    { icon: stepIcons[0], title: t('landing.steps.idea'), desc: t('landing.steps.ideaDesc') },
    { icon: stepIcons[1], title: t('landing.steps.script'), desc: t('landing.steps.scriptDesc') },
    { icon: stepIcons[2], title: t('landing.steps.record'), desc: t('landing.steps.recordDesc') },
    { icon: stepIcons[3], title: t('landing.steps.improve'), desc: t('landing.steps.improveDesc') },
  ];

  const audiences = [
    { icon: audienceIcons[0], title: t('landing.audiences.entrepreneurs'), desc: t('landing.audiences.entrepreneursDesc') },
    { icon: audienceIcons[1], title: t('landing.audiences.creators'), desc: t('landing.audiences.creatorsDesc') },
    { icon: audienceIcons[2], title: t('landing.audiences.professionals'), desc: t('landing.audiences.professionalsDesc') },
    { icon: audienceIcons[3], title: t('landing.audiences.educators'), desc: t('landing.audiences.educatorsDesc') },
  ];

  const benefits = [
    { title: t('landing.benefits.coach'), desc: t('landing.benefits.coachDesc') },
    { title: t('landing.benefits.storytelling'), desc: t('landing.benefits.storytellingDesc') },
    { title: t('landing.benefits.analysis'), desc: t('landing.benefits.analysisDesc') },
  ];

  return (
    <div className="min-h-screen bg-background relative">
      <ParticleBackground />
      {/* Navbar */}
      <nav className="fixed top-0 z-50 w-full border-b border-border/40 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoPresencia} alt="Presencia" className="h-8 w-auto" />
            <span className="text-lg font-bold tracking-tight text-foreground">Presencia</span>
          </Link>
          <Link to="/auth">
            <Button size="sm" className="glow-gold font-semibold">{t('landing.getStarted')}</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="gradient-sanctuary relative flex min-h-screen items-center justify-center overflow-hidden px-6 pt-16">
        <div className="pointer-events-none absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(hsl(250 40% 65%) 1px, transparent 1px), linear-gradient(90deg, hsl(250 40% 65%) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} className="mb-8 flex justify-center">
            <img src={logoPresencia} alt="Presencia" className="h-20 w-auto drop-shadow-2xl" />
          </motion.div>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-soft-blue">
            {t('landing.subtitle')}
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="mb-6 text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl md:text-6xl">
            {t('landing.heroTitle1')}{' '}
            <span className="text-gradient-brand">{t('landing.heroTitle2')}</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="mb-10 text-lg text-muted-foreground sm:text-xl">
            {t('landing.heroDesc')}
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 }}>
            <Link to="/auth">
              <Button size="lg" className="glow-gold px-8 text-base font-bold">
                {t('landing.getStarted')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border py-24 px-6">
        <div className="mx-auto max-w-5xl">
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="mb-4 text-center text-3xl font-bold text-foreground">
            {t('landing.howItWorks')}
          </motion.h2>
          <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1} className="mb-16 text-center text-muted-foreground">
            {t('landing.howItWorksDesc')}
          </motion.p>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i + 2} className="gradient-card flex flex-col items-center rounded-2xl border border-border p-8 text-center transition-all duration-300 hover:border-soft-blue/30 hover:glow-cyan">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-secondary text-energy-cyan">
                  <step.icon className="h-7 w-7" />
                </div>
                <span className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {t('landing.step')} {i + 1}
                </span>
                <h3 className="mb-2 text-lg font-bold text-foreground">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="border-t border-border py-24 px-6">
        <div className="mx-auto max-w-5xl">
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="mb-4 text-center text-3xl font-bold text-foreground">
            {t('landing.builtFor')}
          </motion.h2>
          <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1} className="mb-16 text-center text-muted-foreground">
            {t('landing.builtForDesc')}
          </motion.p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {audiences.map((a, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i + 2} className="gradient-card rounded-2xl border border-border p-6 transition-all duration-300 hover:border-soft-blue/30">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-soft-blue">
                  <a.icon className="h-5 w-5" />
                </div>
                <h3 className="mb-1 font-bold text-foreground">{a.title}</h3>
                <p className="text-sm text-muted-foreground">{a.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Value proposition */}
      <section className="border-t border-border py-24 px-6">
        <div className="mx-auto max-w-4xl">
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="mb-4 text-center text-3xl font-bold text-foreground">
            {t('landing.moreThan')}
          </motion.h2>
          <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1} className="mb-16 text-center text-muted-foreground">
            {t('landing.moreThanDesc')}
          </motion.p>
          <div className="grid gap-8 md:grid-cols-3">
            {benefits.map((b, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i + 2} className="gradient-card rounded-2xl border border-border p-8">
                <h3 className="mb-3 text-lg font-bold text-foreground">{b.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="mx-auto max-w-2xl rounded-3xl border border-border bg-secondary p-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground">{t('landing.ctaTitle')}</h2>
          <p className="mb-8 text-muted-foreground">{t('landing.ctaDesc')}</p>
          <Link to="/auth">
            <Button size="lg" className="glow-gold px-8 font-bold">
              {t('landing.startFree')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <img src={logoPresencia} alt="Presencia" className="h-6 w-auto" />
            <span className="text-sm font-bold tracking-tight text-foreground">Presencia</span>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Presencia. {t('landing.rights')}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
