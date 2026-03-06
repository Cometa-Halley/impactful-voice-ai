import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Download, Share2, Sparkles, RotateCcw, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useVideoFlowStore } from '@/stores/videoFlowStore';
import { analyzePerformance, type AnalysisResult } from '@/lib/ai-service';
import PerformanceAnalysis from '@/components/recording/PerformanceAnalysis';

interface Props {
  recordedBlob: Blob | null;
  onReRecord: () => void;
}

export default function ReviewStep({ recordedBlob, onReRecord }: Props) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { script, methodology, scriptId, videoFormat, analysisResult, setAnalysisResult, reset } = useVideoFlowStore();

  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const videoUrl = useMemo(() => {
    if (!recordedBlob) return null;
    return URL.createObjectURL(recordedBlob);
  }, [recordedBlob]);

  const aspectClass = videoFormat === 'horizontal' ? 'aspect-video' : 'aspect-[9/16]';

  const handleSaveAndAnalyze = useCallback(async () => {
    if (!recordedBlob || !user || !methodology) return;
    setIsAnalyzing(true);
    try {
      const fileName = `${user.id}/${crypto.randomUUID()}.webm`;
      const { error: uploadError } = await supabase.storage.from('videos').upload(fileName, recordedBlob, { contentType: 'video/webm' });
      if (uploadError) throw new Error('Failed to upload video');

      const { data: videoRow, error: videoError } = await supabase.from('videos').insert({
        user_id: user.id,
        file_url: fileName,
        script_id: scriptId,
      }).select('id').single();
      if (videoError || !videoRow) throw new Error('Failed to save video record');

      const transcription = script;
      const result = await analyzePerformance(methodology, script, transcription);
      const overallScoreNormalized = Math.round(result.overall_score * 10);

      await Promise.all([
        supabase.from('feedback').insert({
          video_id: videoRow.id,
          hook_score: result.hook_score,
          clarity_score: result.clarity_score,
          energy_score: result.energy_score,
          coherence_score: result.coherence_score,
          cta_strength: result.cta_strength,
          suggestions: JSON.stringify(result.suggestions),
        }),
        supabase.from('videos').update({ analysis_score: overallScoreNormalized }).eq('id', videoRow.id),
      ]);

      setAnalysisResult(result);
      toast.success('Analysis complete!');
    } catch (err: any) {
      console.error('Save & analyze error:', err);
      toast.error(err.message || 'Something went wrong during analysis');
    } finally {
      setIsAnalyzing(false);
    }
  }, [recordedBlob, user, scriptId, methodology, script, setAnalysisResult]);

  const handleFinish = useCallback(() => {
    reset();
    navigate('/my-videos');
  }, [navigate, reset]);

  if (isAnalyzing) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 gap-6">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}>
          <Loader2 className="h-12 w-12 text-primary" />
        </motion.div>
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold text-foreground">{t('recording.analyzingTitle')}</h2>
          <p className="text-sm text-muted-foreground max-w-sm">{t('recording.analyzingDesc')}</p>
        </div>
        <div className="flex flex-wrap justify-center gap-2 max-w-md">
          {[t('recording.hookStrength'), t('recording.messageClarity'), t('recording.energyLevel'), t('recording.methodCoherence'), t('recording.ctaEffectiveness')].map((item, i) => (
            <motion.div key={item} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.3 }} className="bg-secondary/80 text-muted-foreground text-xs px-3 py-1.5 rounded-full border border-border">{item}</motion.div>
          ))}
        </div>
      </motion.div>
    );
  }

  if (analysisResult) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <PerformanceAnalysis analysis={analysisResult} onReRecord={onReRecord} onFinish={handleFinish} />
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-28">
      {/* Video player */}
      <div className="max-w-2xl mx-auto">
        <div className={`${aspectClass} max-h-[60vh] bg-black rounded-xl overflow-hidden`}>
          {videoUrl && <video src={videoUrl} controls className="w-full h-full object-contain" />}
        </div>
      </div>

      {/* Fixed bottom action bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 sm:px-6 gap-3">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onReRecord} className="gap-2">
              <RotateCcw className="h-4 w-4" /> {t('recording.reRecord')}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (!recordedBlob) return;
                const url = URL.createObjectURL(recordedBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `presencia-${new Date().toISOString().slice(0, 10)}.webm`;
                a.click();
                URL.revokeObjectURL(url);
                toast.success(t('recording.downloaded', 'Video downloaded'));
              }}
              className="gap-2"
            >
              <Download className="h-4 w-4" /> {t('recording.download', 'Save')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                if (!recordedBlob || !navigator.share) {
                  toast.info(t('recording.shareNotSupported', 'Sharing not supported'));
                  return;
                }
                try {
                  const file = new File([recordedBlob], 'presencia-video.webm', { type: 'video/webm' });
                  await navigator.share({ files: [file], title: 'Presencia Video' });
                } catch { /* user cancelled */ }
              }}
              className="gap-2"
            >
              <Share2 className="h-4 w-4" /> {t('recording.publish', 'Publish')}
            </Button>
            <Button onClick={handleSaveAndAnalyze} className="glow-gold font-semibold gap-2">
              <Sparkles className="h-4 w-4" /> {t('recording.analyzeVideo', 'Analyze my video')}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
