import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Video, Film, LayoutTemplate, TrendingUp, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
};

const actions = [
  { icon: Video, title: 'Create Video', desc: 'Start a new AI-powered video session', to: '/create-video', color: 'text-primary' },
  { icon: Film, title: 'My Videos', desc: 'View and manage your recordings', to: '/my-videos', color: 'text-energy-cyan' },
  { icon: LayoutTemplate, title: 'Templates', desc: 'Explore communication frameworks', to: '/templates', color: 'text-soft-blue' },
];

const Dashboard = () => {
  const { user } = useAuth();
  const [fullName, setFullName] = useState('');
  const [stats, setStats] = useState({ videos: 0, scripts: 0 });

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [profileRes, videosRes, scriptsRes] = await Promise.all([
        supabase.from('profiles').select('full_name').eq('id', user.id).single(),
        supabase.from('videos').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('scripts').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      ]);
      if (profileRes.data?.full_name) setFullName(profileRes.data.full_name);
      setStats({ videos: videosRes.count ?? 0, scripts: scriptsRes.count ?? 0 });
    };
    fetchData();
  }, [user]);

  const displayName = fullName || user?.email?.split('@')[0] || 'there';

  return (
    <AppLayout>
      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="mb-10">
        <h1 className="text-3xl font-bold text-foreground">Welcome, {displayName}</h1>
        <p className="mt-2 text-muted-foreground">Your AI communication coach is ready. Start building your message.</p>
      </motion.div>

      {/* Stats */}
      <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { label: 'Videos', value: stats.videos },
          { label: 'Scripts', value: stats.scripts },
          { label: 'Level', value: 'Growing', accent: true },
        ].map((s, i) => (
          <motion.div key={s.label} initial="hidden" animate="visible" variants={fadeUp} custom={i + 1}>
            <Card className="gradient-card border-border text-center py-4">
              <CardContent className="p-0">
                <p className={`text-2xl font-bold ${s.accent ? 'text-primary' : 'text-foreground'}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid gap-6 sm:grid-cols-3">
        {actions.map((a, i) => (
          <motion.div key={a.title} initial="hidden" animate="visible" variants={fadeUp} custom={i + 4}>
            <Link to={a.to}>
              <Card className="gradient-card border-border group cursor-pointer transition-all duration-300 hover:border-soft-blue/30 hover:scale-[1.02]">
                <CardHeader>
                  <div className={`mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-secondary ${a.color}`}>
                    <a.icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">{a.title}</CardTitle>
                  <CardDescription>{a.desc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <span className="inline-flex items-center text-sm text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    Go <ArrowRight className="ml-1 h-3 w-3" />
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

export default Dashboard;
