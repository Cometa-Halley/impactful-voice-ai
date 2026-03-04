import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Save, Globe } from 'lucide-react';

const sectorKeys = [
  'Technology', 'Marketing', 'Education', 'Health', 'Finance',
  'Real Estate', 'Entertainment', 'Consulting', 'E-commerce', 'Other',
];

const Profile = () => {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
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

    if (error) toast.error(t('profile.error'));
    else toast.success(t('profile.saved'));
    setSaving(false);
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
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
        <h1 className="text-3xl font-bold text-foreground">{t('profile.title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('profile.subtitle')}</p>
      </motion.div>

      <div className="max-w-lg space-y-6">
        {/* Language */}
        <Card className="gradient-card border-border">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              {t('profile.language')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">{t('profile.languageDesc')}</p>
            <div className="flex gap-2">
              <Button
                variant={i18n.language?.startsWith('en') ? 'default' : 'outline'}
                size="sm"
                onClick={() => changeLanguage('en')}
                className={i18n.language?.startsWith('en') ? 'glow-gold' : 'border-border text-muted-foreground hover:text-foreground'}
              >
                🇺🇸 {t('profile.english')}
              </Button>
              <Button
                variant={i18n.language?.startsWith('es') ? 'default' : 'outline'}
                size="sm"
                onClick={() => changeLanguage('es')}
                className={i18n.language?.startsWith('es') ? 'glow-gold' : 'border-border text-muted-foreground hover:text-foreground'}
              >
                🇪🇸 {t('profile.spanish')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Account */}
        <Card className="gradient-card border-border">
          <CardHeader>
            <CardTitle className="text-base">{t('profile.account')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>{t('profile.email')}</Label>
              <Input value={user?.email ?? ''} disabled className="bg-muted/50 border-border mt-1" />
            </div>
            <div>
              <Label>{t('profile.fullName')}</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="bg-card border-border mt-1" />
            </div>
          </CardContent>
        </Card>

        {/* Communication Profile */}
        <Card className="gradient-card border-border">
          <CardHeader>
            <CardTitle className="text-base">{t('profile.communicationProfile')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <Label>{t('profile.experienceLevel')}</Label>
              <Select value={experienceLevel} onValueChange={setExperienceLevel}>
                <SelectTrigger className="bg-card border-border mt-1">
                  <SelectValue placeholder={t('profile.selectLevel')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">{t('profile.beginner')}</SelectItem>
                  <SelectItem value="intermediate">{t('profile.intermediate')}</SelectItem>
                  <SelectItem value="advanced">{t('profile.advanced')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>{t('profile.confidenceLevel', { level: confidenceLevel[0] })}</Label>
              <Slider value={confidenceLevel} onValueChange={setConfidenceLevel} min={1} max={10} step={1} className="mt-3" />
            </div>

            <div>
              <Label>{t('profile.sector')}</Label>
              <Select value={sector} onValueChange={setSector}>
                <SelectTrigger className="bg-card border-border mt-1">
                  <SelectValue placeholder={t('profile.selectSector')} />
                </SelectTrigger>
                <SelectContent>
                  {sectorKeys.map((s) => (
                    <SelectItem key={s} value={s}>{t(`sectors.${s}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>{t('profile.targetAudience')}</Label>
              <Input value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} className="bg-card border-border mt-1" placeholder={t('profile.targetPlaceholder')} />
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSave} disabled={saving} className="glow-gold font-semibold w-full">
          <Save className="mr-2 h-4 w-4" />
          {saving ? t('profile.saving') : t('profile.saveChanges')}
        </Button>
      </div>
    </AppLayout>
  );
};

export default Profile;
