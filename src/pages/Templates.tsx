import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LayoutTemplate } from 'lucide-react';
import { motion } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const Templates = () => {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('templates')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setTemplates(data ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <AppLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-10"
      >
        <h1 className="text-3xl font-bold text-foreground">Templates</h1>
        <p className="mt-2 text-muted-foreground">Pre-built communication structures to accelerate your message.</p>
      </motion.div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : templates.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="gradient-card border-border text-center py-16">
            <CardContent className="flex flex-col items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
                <LayoutTemplate className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">No templates yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Templates will appear here as they become available. Each one includes a proven communication methodology.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t, i) => (
            <motion.div key={t.id} initial="hidden" animate="visible" variants={fadeUp} custom={i}>
              <Card className="gradient-card border-border cursor-pointer transition-all duration-300 hover:border-soft-blue/30 hover:scale-[1.02]">
                <CardHeader>
                  <span className="inline-block rounded-full bg-secondary px-3 py-1 text-xs font-medium text-energy-cyan mb-2 w-fit">
                    {t.category}
                  </span>
                  <CardTitle className="text-base">{t.methodology ?? t.category}</CardTitle>
                  <CardDescription>{t.description}</CardDescription>
                </CardHeader>
                {t.recommended_duration && (
                  <CardContent>
                    <span className="text-xs text-muted-foreground">Duration: {t.recommended_duration}</span>
                  </CardContent>
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </AppLayout>
  );
};

export default Templates;
