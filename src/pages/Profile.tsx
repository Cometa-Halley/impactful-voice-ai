import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Save } from 'lucide-react';

const sectors = [
  'Technology', 'Marketing', 'Education', 'Health', 'Finance',
  'Real Estate', 'Entertainment', 'Consulting', 'E-commerce', 'Other',
];

const Profile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [confidenceLevel, setConfidenceLevel] = useState([5]);
  const [sector, setSector] = useState('');
  const [targetAudience, setTargetAudience] = useState('');

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => {
      if (data) {
        setFullName(data.full_name ?? '');
        setExperienceLevel(data.experience_level ?? '');
        setConfidenceLevel([data.confidence_level ?? 5]);
        setSector(data.sector ?? '');
        setTargetAudience(data.target_audience ?? '');
      }
      setLoading(false);
    });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      full_name: fullName,
      experience_level: experienceLevel as 'beginner' | 'intermediate' | 'advanced',
      confidence_level: confidenceLevel[0],
      sector,
      target_audience: targetAudience,
    }).eq('id', user.id);

    if (error) toast.error('Could not save profile.');
    else toast.success('Profile updated!');
    setSaving(false);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-10"
      >
        <h1 className="text-3xl font-bold text-foreground">Profile</h1>
        <p className="mt-2 text-muted-foreground">Your identity and communication configuration.</p>
      </motion.div>

      <div className="max-w-lg space-y-6">
        <Card className="gradient-card border-border">
          <CardHeader>
            <CardTitle className="text-base">Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input value={user?.email ?? ''} disabled className="bg-muted/50 border-border mt-1" />
            </div>
            <div>
              <Label>Full Name</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="bg-card border-border mt-1" />
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-card border-border">
          <CardHeader>
            <CardTitle className="text-base">Communication Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <Label>Experience Level</Label>
              <Select value={experienceLevel} onValueChange={setExperienceLevel}>
                <SelectTrigger className="bg-card border-border mt-1">
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Confidence Level: {confidenceLevel[0]}/10</Label>
              <Slider value={confidenceLevel} onValueChange={setConfidenceLevel} min={1} max={10} step={1} className="mt-3" />
            </div>

            <div>
              <Label>Sector</Label>
              <Select value={sector} onValueChange={setSector}>
                <SelectTrigger className="bg-card border-border mt-1">
                  <SelectValue placeholder="Select sector" />
                </SelectTrigger>
                <SelectContent>
                  {sectors.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Target Audience</Label>
              <Input value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} className="bg-card border-border mt-1" placeholder="e.g., Startup founders" />
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSave} disabled={saving} className="glow-gold font-semibold w-full">
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </AppLayout>
  );
};

export default Profile;
