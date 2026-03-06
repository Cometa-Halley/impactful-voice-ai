import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Camera, Mic, Sun, Waves, CheckCircle2, AlertTriangle, XCircle, ArrowRight, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
  stream?: MediaStream | null;
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
  isLoading, onStartDevices, onContinue, videoRef, stream,
}: Props) {
  const { t } = useTranslation();

  // Re-attach stream to video element when component mounts / ref becomes available
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [videoRef, stream, hasCamera]);

  const allGood = hasCamera && hasMicrophone &&
    (audioQuality.quality === 'good' || audioQuality.quality === 'fair') &&
    (lightingQuality.quality === 'good' || lightingQuality.quality === 'fair');

  const tips: string[] = [];
  if (lightingQuality.brightness < 80) tips.push(t('recording.tipBrighter'));
  if (lightingQuality.brightness > 200) tips.push(t('recording.tipReduceBright'));
  if (lightingQuality.visualNoise > 40) tips.push(t('recording.tipKeepStill'));
  if (audioQuality.quality === 'poor') tips.push(t('recording.tipSpeakLouder'));
  if (audioQuality.clipping) tips.push(t('recording.tipMoveAway'));
  if (audioQuality.noiseFloor > 40) tips.push(t('recording.tipReduceNoise'));

  if (!hasCamera && !isLoading) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-6 py-12">
        <div className="h-24 w-24 rounded-full bg-secondary flex items-center justify-center">
          <Camera className="h-10 w-10 text-muted-foreground" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold text-foreground">{t('recording.cameraAccess')}</h2>
          <p className="text-sm text-muted-foreground max-w-md">{t('recording.cameraAccessDesc')}</p>
        </div>
        <Button onClick={onStartDevices} className="glow-gold font-semibold" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}
          {t('recording.enableCameraMic')}
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
                className="absolute inset-0 w-full h-full object-cover"
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
        <div className="space-y-3 min-h-[360px]">
          <Card className="gradient-card border-border">
            <CardContent className="flex items-center gap-3 py-4 h-[56px]">
              <StatusIcon status={hasCamera} />
              <Camera className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground flex-1">{t('recording.camera')}</span>
              <StatusBadge status={hasCamera ? 'good' : 'poor'} />
            </CardContent>
          </Card>

          <Card className="gradient-card border-border">
            <CardContent className="flex items-center gap-3 py-4 h-[56px]">
              <StatusIcon status={hasMicrophone} />
              <Mic className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground flex-1">{t('recording.microphone')}</span>
              <StatusBadge status={hasMicrophone ? 'good' : 'poor'} />
            </CardContent>
          </Card>

          <Card className="gradient-card border-border">
            <CardContent className="py-4 h-[110px]">
              <div className="flex items-center gap-3">
                <StatusIcon status={audioQuality.quality} />
                <Waves className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground flex-1">{t('recording.audioQuality')}</span>
                <StatusBadge status={audioQuality.quality} />
              </div>
              <div className="ml-8 space-y-1 mt-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-16">{t('recording.level')}</span>
                  <Progress value={audioQuality.level} className="h-1.5 flex-1" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-16">{t('recording.noise')}</span>
                  <Progress value={audioQuality.noiseFloor} className="h-1.5 flex-1" />
                </div>
                {audioQuality.clipping && (
                  <p className="text-xs text-destructive">{t('recording.clippingDetected')}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-card border-border">
            <CardContent className="py-4 h-[120px]">
              <div className="flex items-center gap-3">
                <StatusIcon status={lightingQuality.quality} />
                <Sun className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground flex-1">{t('recording.lighting')}</span>
                <StatusBadge status={lightingQuality.quality} />
              </div>
              <div className="ml-8 space-y-1 mt-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-16">{t('recording.bright')}</span>
                  <Progress value={Math.round((lightingQuality.brightness / 255) * 100)} className="h-1.5 flex-1" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-16">{t('recording.contrast')}</span>
                  <Progress value={lightingQuality.contrast} className="h-1.5 flex-1" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-16">{t('recording.noise')}</span>
                  <Progress value={lightingQuality.visualNoise} className="h-1.5 flex-1" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tips — fixed height, scrollable */}
      {tips.length > 0 && (
        <Card className="gradient-card border-primary/20">
          <CardContent className="py-4 h-[120px] overflow-hidden">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">{t('recording.tipsToImprove')}</h3>
            </div>
            <ul className="text-xs text-muted-foreground space-y-1 max-h-[68px] overflow-y-auto">
              {tips.map((tip, i) => (
                <li key={i}>• {tip}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Continue button */}
      <div className="flex justify-end pt-2">
        <Button onClick={onContinue} className="glow-gold font-semibold">
          {t('recording.startRecording')} <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}
