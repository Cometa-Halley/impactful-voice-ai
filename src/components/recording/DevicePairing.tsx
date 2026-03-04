import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Smartphone, Monitor, Copy, CheckCircle2, Loader2, Link2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface Props {
  sessionCode: string;
  role: 'desktop' | 'mobile' | null;
  onRoleSelect: (role: 'desktop' | 'mobile') => void;
  onPaired: () => void;
  isPaired: boolean;
}

export default function DevicePairing({ sessionCode, role, onRoleSelect, onPaired, isPaired }: Props) {
  const { user } = useAuth();
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [copied, setCopied] = useState(false);

  const pairingUrl = `${window.location.origin}/recording-studio?join=${sessionCode}`;

  const copyCode = async () => {
    await navigator.clipboard.writeText(pairingUrl);
    setCopied(true);
    toast.success('Pairing link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  // Listen for paired device via Realtime
  useEffect(() => {
    if (!sessionCode || !role || isPaired) return;

    const channel = supabase
      .channel(`pairing-${sessionCode}`)
      .on('broadcast', { event: 'device-joined' }, (payload) => {
        if (payload.payload?.role !== role) {
          onPaired();
          toast.success('Device paired successfully!');
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [sessionCode, role, isPaired, onPaired]);

  const handleJoin = useCallback(async () => {
    if (!joinCode.trim()) return;
    setIsJoining(true);
    try {
      const channel = supabase.channel(`pairing-${joinCode.trim()}`);
      await channel.subscribe();
      await channel.send({
        type: 'broadcast',
        event: 'device-joined',
        payload: { role: 'mobile', userId: user?.id },
      });
      onRoleSelect('mobile');
      onPaired();
      toast.success('Paired as mobile camera!');
    } catch (err) {
      toast.error('Failed to pair. Check the code and try again.');
    } finally {
      setIsJoining(false);
    }
  }, [joinCode, user, onRoleSelect, onPaired]);

  if (isPaired) {
    return (
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <Card className="gradient-card border-green-500/30">
          <CardContent className="py-6 flex items-center justify-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-green-400" />
            <span className="text-foreground font-medium">
              Devices paired — {role === 'desktop' ? 'Teleprompter mode' : 'Camera mode'}
            </span>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {/* Desktop role */}
      <Card
        className={`gradient-card border-2 cursor-pointer transition-all ${
          role === 'desktop' ? 'border-primary glow-gold' : 'border-border hover:border-primary/50'
        }`}
        onClick={() => onRoleSelect('desktop')}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <Monitor className="h-8 w-8 text-primary" />
            <CardTitle className="text-base">This is my desktop</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">Use this screen as your teleprompter. Pair your phone as the camera.</p>
          {role === 'desktop' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2">
              <p className="text-xs font-medium text-foreground">Share this link with your phone:</p>
              <div className="flex gap-2">
                <Input value={pairingUrl} readOnly className="text-xs bg-muted/50" />
                <Button size="icon" variant="outline" onClick={copyCode}>
                  {copied ? <CheckCircle2 className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Waiting for mobile device...
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Mobile role */}
      <Card
        className={`gradient-card border-2 cursor-pointer transition-all ${
          role === 'mobile' ? 'border-accent glow-cyan' : 'border-border hover:border-accent/50'
        }`}
        onClick={() => onRoleSelect('mobile')}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <Smartphone className="h-8 w-8 text-accent" />
            <CardTitle className="text-base">This is my phone</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">Use this phone as your camera. Your desktop will show the teleprompter.</p>
          {role === 'mobile' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2">
              <p className="text-xs font-medium text-foreground">Enter the pairing code:</p>
              <div className="flex gap-2">
                <Input
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="Paste pairing code..."
                  className="text-xs bg-muted/50"
                />
                <Button size="sm" onClick={handleJoin} disabled={isJoining || !joinCode.trim()}>
                  {isJoining ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                </Button>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
