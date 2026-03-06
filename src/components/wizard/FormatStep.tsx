import { useTranslation } from 'react-i18next';
import { Monitor, Smartphone, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useVideoFlowStore } from '@/stores/videoFlowStore';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -16, transition: { duration: 0.3 } },
};

export default function FormatStep() {
  const { t } = useTranslation();
  const { videoFormat, videoDuration, setVideoFormat, setVideoDuration } = useVideoFlowStore();

  return (
    <motion.div key="step-format" initial="hidden" animate="visible" exit="exit" variants={fadeUp} className="space-y-8">
      {/* Orientation */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">{t('createVideo.formatOrientation')}</h2>
        <p className="text-sm text-muted-foreground">{t('createVideo.formatOrientationDesc')}</p>
        <div className="grid grid-cols-2 gap-4 max-w-md">
          {(['horizontal', 'vertical'] as const).map(fmt => (
            <button
              key={fmt}
              onClick={() => setVideoFormat(fmt)}
              className={`flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition-all ${
                videoFormat === fmt
                  ? 'border-primary bg-primary/5 glow-gold'
                  : 'border-border hover:border-primary/40 bg-muted/30'
              }`}
            >
              {fmt === 'horizontal' ? (
                <Monitor className={`h-8 w-8 ${videoFormat === fmt ? 'text-primary' : 'text-muted-foreground'}`} />
              ) : (
                <Smartphone className={`h-8 w-8 ${videoFormat === fmt ? 'text-primary' : 'text-muted-foreground'}`} />
              )}
              <span className={`text-sm font-medium ${videoFormat === fmt ? 'text-primary' : 'text-foreground'}`}>
                {t(`createVideo.format${fmt.charAt(0).toUpperCase() + fmt.slice(1)}`)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Duration */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">{t('createVideo.formatDuration')}</h2>
        <p className="text-sm text-muted-foreground">{t('createVideo.formatDurationDesc')}</p>
        <div className="grid grid-cols-2 gap-4 max-w-md">
          {(['30s', '60s'] as const).map(dur => (
            <button
              key={dur}
              onClick={() => setVideoDuration(dur)}
              className={`flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition-all ${
                videoDuration === dur
                  ? 'border-primary bg-primary/5 glow-gold'
                  : 'border-border hover:border-primary/40 bg-muted/30'
              }`}
            >
              <Clock className={`h-8 w-8 ${videoDuration === dur ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`text-sm font-medium ${videoDuration === dur ? 'text-primary' : 'text-foreground'}`}>
                {dur === '30s' ? '30 ' + t('createVideo.seconds') : '60 ' + t('createVideo.seconds')}
              </span>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
