import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import logoPresencia from '@/assets/logo-presencia.png';
import ParticleBackground from '@/components/ParticleBackground';
import { toast } from 'sonner';

const sectors = [
  'Technology', 'Marketing', 'Education', 'Health', 'Finance',
  'Real Estate', 'Entertainment', 'Consulting', 'E-commerce', 'Other',
];

const Onboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [experienceLevel, setExperienceLevel] = useState<string>('');
  const [confidenceLevel, setConfidenceLevel] = useState([5]);
  const [sector, setSector] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [saving, setSaving] = useState(false);

  const handleComplete = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      experience_level: experienceLevel as 'beginner' | 'intermediate' | 'advanced',
      confidence_level: confidenceLevel[0],
      sector,
      target_audience: targetAudience,
    }).eq('id', user.id);

    if (error) {
      toast.error('Could not save profile. Please try again.');
    } else {
      toast.success('Profile complete!');
      navigate('/dashboard');
    }
    setSaving(false);
  };

  const steps = [
    {
      title: 'Experience Level',
      description: 'How experienced are you with public speaking or creating video content?',
      content: (
        <div className="grid gap-3">
          {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
            <button
              key={level}
              onClick={() => setExperienceLevel(level)}
              className={`rounded-xl border p-4 text-left transition-all ${experienceLevel === level
                ? 'border-primary bg-primary/10 text-foreground'
                : 'border-border bg-card hover:border-muted-foreground/30 text-muted-foreground'
              }`}
            >
              <span className="font-semibold capitalize">{level}</span>
              <p className="mt-1 text-sm opacity-70">
                {level === 'beginner' && 'Just getting started with video communication'}
                {level === 'intermediate' && 'Some experience creating content or presenting'}
                {level === 'advanced' && 'Regularly create content or speak professionally'}
              </p>
            </button>
          ))}
        </div>
      ),
      valid: !!experienceLevel,
    },
    {
      title: 'Confidence Level',
      description: 'How confident do you feel speaking on camera right now?',
      content: (
        <div className="space-y-8">
          <Slider
            value={confidenceLevel}
            onValueChange={setConfidenceLevel}
            min={1}
            max={10}
            step={1}
            className="py-4"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>1 — Not confident</span>
            <span className="text-2xl font-bold text-primary">{confidenceLevel[0]}</span>
            <span>10 — Very confident</span>
          </div>
        </div>
      ),
      valid: true,
    },
    {
      title: 'Your Sector',
      description: 'What industry or field are you in?',
      content: (
        <Select value={sector} onValueChange={setSector}>
          <SelectTrigger className="bg-card border-border">
            <SelectValue placeholder="Select your sector" />
          </SelectTrigger>
          <SelectContent>
            {sectors.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
      valid: !!sector,
    },
    {
      title: 'Target Audience',
      description: 'Who are you primarily trying to reach with your message?',
      content: (
        <Input
          value={targetAudience}
          onChange={(e) => setTargetAudience(e.target.value)}
          placeholder="e.g., Startup founders, College students, SMB owners..."
          className="bg-card border-border"
        />
      ),
      valid: targetAudience.trim().length > 0,
    },
  ];

  const currentStep = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div className="min-h-screen bg-background relative flex items-center justify-center px-6">
      <ParticleBackground />
      <motion.div
        key={step}
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -30 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-lg"
      >
        <div className="mb-8 flex justify-center">
          <img src={logoPresencia} alt="Presencia" className="h-12 w-auto" />
        </div>

        {/* Progress */}
        <div className="mb-6 flex gap-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all ${i <= step ? 'bg-primary' : 'bg-border'}`}
            />
          ))}
        </div>

        <Card className="gradient-card border-border">
          <CardHeader>
            <CardTitle className="text-xl">{currentStep.title}</CardTitle>
            <CardDescription>{currentStep.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentStep.content}
            <div className="flex gap-3 pt-2">
              {step > 0 && (
                <Button variant="ghost" onClick={() => setStep(step - 1)} className="text-muted-foreground">
                  Back
                </Button>
              )}
              <Button
                className="ml-auto glow-gold font-semibold"
                disabled={!currentStep.valid || saving}
                onClick={isLast ? handleComplete : () => setStep(step + 1)}
              >
                {saving ? 'Saving...' : isLast ? (
                  <>
                    Complete <Sparkles className="ml-2 h-4 w-4" />
                  </>
                ) : (
                  <>
                    Next <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Onboarding;
