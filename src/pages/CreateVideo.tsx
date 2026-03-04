import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Video, Lightbulb, FileText, Mic, TrendingUp, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
};

const steps = [
  { icon: Lightbulb, title: 'Define your idea', desc: 'Choose a topic and audience for your message', status: 'current' },
  { icon: FileText, title: 'Generate script', desc: 'AI creates a structured script with methodology', status: 'upcoming' },
  { icon: Mic, title: 'Record with teleprompter', desc: 'Record your video with guided prompts', status: 'upcoming' },
  { icon: TrendingUp, title: 'Get AI feedback', desc: 'Receive analysis and improvement suggestions', status: 'upcoming' },
];

const CreateVideo = () => {
  return (
    <AppLayout>
      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="mb-10">
        <h1 className="text-3xl font-bold text-foreground">Create Video</h1>
        <p className="mt-2 text-muted-foreground">Follow the guided workflow to create a high-impact video.</p>
      </motion.div>

      {/* Workflow steps */}
      <div className="space-y-4">
        {steps.map((step, i) => (
          <motion.div key={step.title} initial="hidden" animate="visible" variants={fadeUp} custom={i + 1}>
            <Card className={`gradient-card border-border transition-all duration-300 ${step.status === 'current' ? 'border-primary/40 glow-gold' : 'opacity-60'}`}>
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary ${step.status === 'current' ? 'text-primary' : 'text-muted-foreground'}`}>
                  <step.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-base">{step.title}</CardTitle>
                  <CardDescription className="text-sm">{step.desc}</CardDescription>
                </div>
                {step.status === 'current' && (
                  <Button size="sm" className="glow-gold font-semibold shrink-0">
                    Start <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                )}
              </CardHeader>
            </Card>
          </motion.div>
        ))}
      </div>
    </AppLayout>
  );
};

export default CreateVideo;
