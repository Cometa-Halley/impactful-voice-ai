import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Camera, Mic, Sun, Waves, CheckCircle2, AlertTriangle, XCircle, ArrowRight, Loader2 } from 'lucide-react';
import type { AudioQuality } from '@/hooks/useAudioAnalysis';
import type { LightingQuality } from '@/hooks/useLightingDetection';

interface Props {
  hasCamera: boolean;
  hasMicrophone: boolean;
  audioQuality: AudioQuality;
  lightingQuality: LightingQuality;
  isLoading: boolean;
  onStartDevices: () => void;
  onContinue: () => void;
  videoRef: React.RefObject<HTMLVideoElement>;
}

const StatusIcon = ({ status }: { status: 'good' | 'fair' | 'poor' | 'silent' | boolean }) => {
  if (status === true || status === 'good') return <CheckCircle2 className="h-5 w-5 text-green-400" />;
  if (status === 'fair') return <AlertTriangle className="h-5 w-5 text-primary" />;
  return <XCircle className="h-5 w-5 text-destructive" />;
};

const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    good: 'bg-green-500/20 text-green-400',
    fair: 'bg-primary/20 text-primary',
    poor: 'bg-destructive/20 text-destructive',
    silent: 'bg-muted text-muted-foreground',
  };
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${colors[status] || colors.poor}`}>
      {status}
    </span>
  );
};

export default function PreRecordingChecks({
  hasCamera, hasMicrophone, audioQuality, lightingQuality,
  isLoading, onStartDevices, onContinue, videoRef,
}: Props) {
  const allGood = hasCamera && hasMicrophone &&
    (audioQuality.quality === 'good' || audioQuality.quality === 'fair') &&
    (lightingQuality.quality === 'good' || lightingQuality.quality === 'fair');

  if (!hasCamera && !isLoading) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-6 py-12">
        <div className="h-24 w-24 rounded-full bg-secondary flex items-center justify-center">
          <Camera className="h-10 w-10 text-muted-foreground" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold text-foreground">Camera & Microphone Access</h2>
          <p className="text-sm text-muted-foreground max-w-md">
            We need access to your camera and microphone to check your recording environment.
          </p>
        </div>
        <Button onClick={onStartDevices} className="glow-gold font-semibold" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}
          Enable Camera & Mic
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Camera preview */}
        <Card className="gradient-card border-border overflow-hidden">
          <CardContent className="p-0">
            <div className="relative aspect-video bg-black rounded-t-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover mirror"
                style={{ transform: 'scaleX(-1)' }}
              />
              {!hasCamera && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted">
                  <Camera className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Checks panel */}
        <div className="space-y-3">
          {/* Camera */}
          <Card className="gradient-card border-border">
            <CardContent className="flex items-center gap-3 py-4">
              <StatusIcon status={hasCamera} />
              <Camera className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground flex-1">Camera</span>
              <StatusBadge status={hasCamera ? 'good' : 'poor'} />
            </CardContent>
          </Card>

          {/* Microphone */}
          <Card className="gradient-card border-border">
            <CardContent className="flex items-center gap-3 py-4">
              <StatusIcon status={hasMicrophone} />
              <Mic className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground flex-1">Microphone</span>
              <StatusBadge status={hasMicrophone ? 'good' : 'poor'} />
            </CardContent>
          </Card>

          {/* Audio quality */}
          <Card className="gradient-card border-border">
            <CardContent className="py-4 space-y-2">
              <div className="flex items-center gap-3">
                <StatusIcon status={audioQuality.quality} />
                <Waves className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground flex-1">Audio Quality</span>
                <StatusBadge status={audioQuality.quality} />
              </div>
              <div className="ml-8 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-16">Level</span>
                  <Progress value={audioQuality.level} className="h-1.5 flex-1" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-16">Noise</span>
                  <Progress value={audioQuality.noiseFloor} className="h-1.5 flex-1" />
                </div>
                {audioQuality.clipping && (
                  <p className="text-xs text-destructive">⚠ Audio clipping detected — move back from mic</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Lighting */}
          <Card className="gradient-card border-border">
            <CardContent className="py-4 space-y-2">
              <div className="flex items-center gap-3">
                <StatusIcon status={lightingQuality.quality} />
                <Sun className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground flex-1">Lighting</span>
                <StatusBadge status={lightingQuality.quality} />
              </div>
              <div className="ml-8 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-16">Bright</span>
                  <Progress value={Math.round((lightingQuality.brightness / 255) * 100)} className="h-1.5 flex-1" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-16">Contrast</span>
                  <Progress value={lightingQuality.contrast} className="h-1.5 flex-1" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-16">Noise</span>
                  <Progress value={lightingQuality.visualNoise} className="h-1.5 flex-1" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tips */}
      {!allGood && (
        <Card className="gradient-card border-primary/20">
          <CardContent className="py-4">
            <h3 className="text-sm font-semibold text-foreground mb-2">💡 Tips to improve</h3>
            <ul className="text-xs text-muted-foreground space-y-1">
              {lightingQuality.brightness < 80 && <li>• Move to a brighter area or add a light source in front of you</li>}
              {lightingQuality.brightness > 200 && <li>• Reduce brightness — avoid direct light behind you</li>}
              {lightingQuality.visualNoise > 40 && <li>• Keep still and reduce background movement</li>}
              {audioQuality.quality === 'poor' && <li>• Speak louder or move closer to the microphone</li>}
              {audioQuality.clipping && <li>• Move away from the microphone to avoid distortion</li>}
              {audioQuality.noiseFloor > 40 && <li>• Reduce ambient noise — close windows, turn off fans</li>}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end pt-2">
        <Button onClick={onContinue} disabled={!allGood} className="glow-gold font-semibold">
          Start Recording <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}
