import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Video, TrendingUp, LogOut } from 'lucide-react';

const features = [
  { icon: FileText, title: 'Create Script', desc: 'Generate AI-powered scripts from your ideas', soon: true },
  { icon: Video, title: 'My Recordings', desc: 'Record and manage your video sessions', soon: true },
  { icon: TrendingUp, title: 'Progress', desc: 'Track your speaking improvement over time', soon: true },
];

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const [fullName, setFullName] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
      if (data?.full_name) setFullName(data.full_name);
    };
    fetchProfile();
  }, [user]);

  const displayName = fullName || user?.email?.split('@')[0] || 'there';

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <span className="text-xl font-bold tracking-tight text-foreground">PRESENCIA</span>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-foreground">
            Welcome, {displayName} 👋
          </h1>
          <p className="mt-2 text-muted-foreground">
            Your AI communication coach is ready. Start building your message.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title} className="relative overflow-hidden opacity-75">
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">{f.title}</CardTitle>
                <CardDescription>{f.desc}</CardDescription>
              </CardHeader>
              <CardContent>
                {f.soon && (
                  <span className="inline-block rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                    Coming Soon
                  </span>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
