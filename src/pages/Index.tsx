import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Lightbulb, FileText, Video, TrendingUp, Users, Mic, Brain, Target } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' },
  }),
};

const steps = [
  { icon: Lightbulb, title: 'Idea', desc: 'Define your message and audience' },
  { icon: FileText, title: 'Script', desc: 'AI generates a structured script' },
  { icon: Video, title: 'Record', desc: 'Professional teleprompter recording' },
  { icon: TrendingUp, title: 'Improve', desc: 'AI analyzes and coaches you' },
];

const audiences = [
  { icon: Target, title: 'Entrepreneurs', desc: 'Build authority and pitch with confidence' },
  { icon: Users, title: 'Creators', desc: 'Create content that resonates and converts' },
  { icon: Mic, title: 'Professionals', desc: 'Present ideas with clarity and impact' },
  { icon: Brain, title: 'Educators', desc: 'Teach with structure and engagement' },
];

const benefits = [
  { title: 'AI Speaking Coach', desc: 'Get real-time feedback on pacing, clarity, and delivery to continuously improve.' },
  { title: 'Strategic Storytelling', desc: 'Use proven frameworks to structure your message for maximum persuasion.' },
  { title: 'Speaking Analysis', desc: 'Detailed metrics on your communication skills with actionable improvement paths.' },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <span className="text-xl font-bold tracking-tight text-foreground">
            PRESENCIA
          </span>
          <Link to="/auth">
            <Button size="sm">Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex min-h-screen items-center justify-center px-6 pt-16">
        <div className="mx-auto max-w-3xl text-center">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-4 text-sm font-semibold uppercase tracking-widest text-primary"
          >
            AI Communication Platform
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-6 text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl md:text-6xl"
          >
            Communicate with intention.{' '}
            <span className="text-primary">Impact with intelligence.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-10 text-lg text-muted-foreground sm:text-xl"
          >
            Transform your ideas into high-impact messages with AI-powered speaking coaching and intelligent video creation.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Link to="/auth">
              <Button size="lg" className="px-8 text-base font-semibold">
                Get Started Free
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border bg-muted/30 py-24 px-6">
        <div className="mx-auto max-w-5xl">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="mb-4 text-center text-3xl font-bold text-foreground"
          >
            How it works
          </motion.h2>
          <motion.p
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={1}
            className="mb-16 text-center text-muted-foreground"
          >
            Four steps from idea to impactful communication
          </motion.p>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i + 2}
                className="flex flex-col items-center rounded-2xl border border-border bg-card p-8 text-center shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-accent text-primary">
                  <step.icon className="h-7 w-7" />
                </div>
                <span className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Step {i + 1}
                </span>
                <h3 className="mb-2 text-lg font-bold text-foreground">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="py-24 px-6">
        <div className="mx-auto max-w-5xl">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="mb-4 text-center text-3xl font-bold text-foreground"
          >
            Built for communicators
          </motion.h2>
          <motion.p
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={1}
            className="mb-16 text-center text-muted-foreground"
          >
            Whether you're pitching, teaching, or creating — Presencia helps you speak with power
          </motion.p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {audiences.map((a, i) => (
              <motion.div
                key={a.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i + 2}
                className="rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-md"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-primary">
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
      <section className="border-t border-border bg-muted/30 py-24 px-6">
        <div className="mx-auto max-w-4xl">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="mb-4 text-center text-3xl font-bold text-foreground"
          >
            More than video recording
          </motion.h2>
          <motion.p
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={1}
            className="mb-16 text-center text-muted-foreground"
          >
            A complete AI communication training ecosystem
          </motion.p>
          <div className="grid gap-8 md:grid-cols-3">
            {benefits.map((b, i) => (
              <motion.div
                key={b.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i + 2}
                className="rounded-2xl border border-border bg-card p-8 shadow-sm"
              >
                <h3 className="mb-3 text-lg font-bold text-foreground">{b.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0}
          className="mx-auto max-w-2xl rounded-3xl bg-primary p-12 text-center shadow-lg"
        >
          <h2 className="mb-4 text-3xl font-bold text-primary-foreground">
            Ready to transform your communication?
          </h2>
          <p className="mb-8 text-primary-foreground/80">
            Join Presencia and start speaking with intention today.
          </p>
          <Link to="/auth">
            <Button size="lg" variant="secondary" className="px-8 font-semibold">
              Start Free
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <span className="text-sm font-bold tracking-tight text-foreground">PRESENCIA</span>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Presencia. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
