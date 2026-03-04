import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Film } from 'lucide-react';
import { motion } from 'framer-motion';

const MyVideos = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('videos')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setVideos(data ?? []);
        setLoading(false);
      });
  }, [user]);

  return (
    <AppLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-10"
      >
        <h1 className="text-3xl font-bold text-foreground">{t('myVideos.title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('myVideos.subtitle')}</p>
      </motion.div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : videos.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="gradient-card border-border text-center py-16">
            <CardContent className="flex flex-col items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
                <Film className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">{t('myVideos.noVideosTitle')}</h3>
              <p className="text-sm text-muted-foreground max-w-sm">{t('myVideos.noVideosDesc')}</p>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((v) => (
            <Card key={v.id} className="gradient-card border-border">
              <CardHeader>
                <CardTitle className="text-sm">Video</CardTitle>
                <CardDescription>{new Date(v.created_at).toLocaleDateString()}</CardDescription>
              </CardHeader>
              <CardContent>
                {v.analysis_score != null && (
                  <span className="text-primary font-bold text-lg">{v.analysis_score}/100</span>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AppLayout>
  );
};

export default MyVideos;
