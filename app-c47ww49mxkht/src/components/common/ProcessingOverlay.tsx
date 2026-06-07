import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, ImagePlus, Cpu, Pill, FileText, Search, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Step {
  labelKey: string;
  icon: React.ElementType;
}

const IMAGE_STEPS: Step[] = [
  { labelKey: 'processing.step_upload', icon: ImagePlus },
  { labelKey: 'processing.step_analyze', icon: Cpu },
  { labelKey: 'processing.step_recommend', icon: Pill },
];

const TEXT_STEPS: Step[] = [
  { labelKey: 'processing.step_reading', icon: FileText },
  { labelKey: 'processing.step_identify', icon: Search },
  { labelKey: 'processing.step_recommend', icon: Sparkles },
];

export type OverlayMode = 'image' | 'text';

interface ProcessingOverlayProps {
  step: number;
  mode?: OverlayMode;
}

export function ProcessingOverlay({ step, mode = 'image' }: ProcessingOverlayProps) {
  const { t } = useTranslation();
  const [dotCount, setDotCount] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setDotCount((c) => (c + 1) % 4), 420);
    return () => clearInterval(id);
  }, []);

  const dots = '.'.repeat(dotCount);
  const steps = mode === 'text' ? TEXT_STEPS : IMAGE_STEPS;
  const isText = mode === 'text';

  const currentLabel =
    step < steps.length
      ? `${t(steps[step].labelKey)}${dots}`
      : t('processing.step_almost');

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm px-4">

      {isText ? (
        <div className="relative flex flex-col items-center justify-center mb-8 w-20 h-20">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl gradient-hero shadow-lg">
            <FileText className="h-8 w-8 text-white" />
          </div>
          <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-accent/70 animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="absolute -bottom-1 -left-1 h-3 w-3 rounded-full bg-accent/50 animate-bounce" style={{ animationDelay: '200ms' }} />
          <span className="absolute top-1/2 -right-3 h-2 w-2 rounded-full bg-accent/60 animate-bounce" style={{ animationDelay: '400ms' }} />
        </div>
      ) : (
        <div className="relative flex items-center justify-center mb-8">
          <span className="absolute inline-flex h-28 w-28 rounded-full bg-primary/15 animate-ping" />
          <span className="absolute inline-flex h-20 w-20 rounded-full bg-primary/25 animate-pulse" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full gradient-hero shadow-lg">
            <Loader2 className="h-8 w-8 text-white animate-spin" />
          </div>
        </div>
      )}

      {/* Current step label */}
      <p className="text-base font-semibold text-foreground mb-6 min-h-[1.75rem] text-center">
        {currentLabel}
      </p>

      {/* Step list */}
      <div className="flex flex-col gap-2.5 w-full max-w-xs">
        {steps.map((s, i) => {
          const isDone = i < step;
          const isActive = i === step;
          const Icon = s.icon;
          return (
            <div
              key={i}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-300
                ${isDone ? 'bg-primary/10 border border-primary/20' : isActive ? 'bg-primary/20 border border-primary/30 shadow-sm' : 'bg-muted/50 opacity-40 border border-transparent'}`}
            >
              {isDone ? (
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
              ) : isActive ? (
                <Loader2 className="h-5 w-5 text-primary animate-spin shrink-0" />
              ) : (
                <Icon className="h-5 w-5 text-muted-foreground shrink-0" />
              )}
              <span
                className={`text-sm font-medium ${
                  isDone ? 'text-primary' : isActive ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {t(s.labelKey)}
              </span>
            </div>
          );
        })}
      </div>

      <p className="mt-8 text-xs text-muted-foreground text-center">
        {isText ? t('processing.footer_text') : t('processing.footer_image')}
      </p>
    </div>
  );
}
