import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { AnalysisResult } from '@/types/index';
import { ArrowLeft, AlertTriangle, Stethoscope, Pill, ChevronRight, Sparkles, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import DiagnosisAudioPlayer from '@/components/features/DiagnosisAudioPlayer';

function PriceIndicator({ level, priceRange }: { level: 'low' | 'medium' | 'high'; priceRange?: string }) {
  const { t } = useTranslation();
  const label = level === 'low' ? t('results.cheap') : level === 'medium' ? t('results.affordable') : t('results.expensive');
  const colorClass = level === 'low'
    ? 'bg-green-100 text-green-800 border-green-200'
    : level === 'medium'
    ? 'bg-amber-100 text-amber-800 border-amber-200'
    : 'bg-red-100 text-red-800 border-red-200';
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${colorClass}`}>{label}</span>
      {priceRange && <span className="text-xs font-medium text-muted-foreground">{priceRange}</span>}
    </div>
  );
}

export default function AnalysisResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const state = location.state as { result?: AnalysisResult; imageUrl?: string } | null;
  const result = state?.result;
  const imageUrl = state?.imageUrl;

  if (!result) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <p className="text-muted-foreground mb-4">{t('common.no_result')}</p>
        <Button onClick={() => navigate('/photo-input')}>{t('common.new_scan')}</Button>
      </div>
    );
  }

  const severityColor = {
    mild: 'bg-green-100 text-green-800 border-green-200',
    moderate: 'bg-amber-100 text-amber-800 border-amber-200',
    severe: 'bg-red-100 text-red-800 border-red-200',
  };

  const effectivenessLabel: Record<string, string> = {
    high: t('results.highly_effective'),
    medium: t('results.effective'),
    low: t('results.less_effective'),
  };

  const isConcerning = result.severity === 'severe' || result.confidence_score < 60;

  return (
    <div className="min-h-screen bg-background">
      <div className="gradient-hero px-4 pt-6 pb-14">
        <button onClick={() => navigate('/')} className="flex items-center text-white/80 hover:text-white text-sm mb-4 transition-colors">
          <ArrowLeft className="mr-1 h-4 w-4" />{t('common.back_home')}
        </button>
        <div className="flex items-end gap-4">
          {imageUrl && (
            <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-white/30 shrink-0">
              <img src={imageUrl} alt="Analyzed skin" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-white/70 text-xs font-medium uppercase tracking-wide mb-1">{t('results.label')}</p>
            <h1 className="text-xl font-bold text-white text-balance leading-tight">{result.condition_name}</h1>
          </div>
        </div>
      </div>
      <div className="max-w-2xl mx-auto px-4 -mt-6 pb-10 space-y-4">
        <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className={severityColor[result.severity]}>
                {result.severity.charAt(0).toUpperCase() + result.severity.slice(1)} {t('results.severity_suffix')}
              </Badge>
              {result.confidence_score < 60 && (
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  <AlertTriangle className="mr-1 h-3 w-3" />{t('results.low_confidence')}
                </Badge>
              )}
            </div>
            <span className="text-sm font-bold text-foreground">{result.confidence_score}%</span>
          </div>
          <Progress value={result.confidence_score} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">{t('results.confidence_label')}</p>
        </div>
        <div className={`rounded-2xl border p-4 flex items-start gap-3 ${isConcerning ? 'bg-red-50 border-red-200' : 'bg-secondary border-secondary'}`}>
          {isConcerning
            ? <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
            : <Stethoscope className="h-5 w-5 text-primary mt-0.5 shrink-0" />}
          <div>
            <p className={`font-semibold text-sm ${isConcerning ? 'text-red-800' : 'text-foreground'}`}>
              {isConcerning ? t('results.important_notice') : t('results.next_steps')}
            </p>
            <p className={`text-sm mt-1 text-pretty ${isConcerning ? 'text-red-700' : 'text-muted-foreground'}`}>{result.next_steps}</p>
          </div>
        </div>
        <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <Stethoscope className="h-4 w-4 text-primary" />
            <h2 className="font-bold text-sm text-foreground">{t('results.treatment_title')}</h2>
          </div>
          <p className="text-sm text-muted-foreground text-pretty whitespace-pre-wrap leading-relaxed">{result.treatment_recommendations}</p>
        </div>
        <DiagnosisAudioPlayer result={result} />
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Pill className="h-4 w-4 text-primary" />
            <h2 className="font-bold text-foreground">{t('results.medication_title')}</h2>
          </div>
          <div className="space-y-3">
            {result.medication_recommendations.map((med, index) => (
              <button key={index} className="w-full bg-card rounded-2xl border border-border shadow-sm p-4 text-left card-hover"
                onClick={() => navigate(`/medication/${index}`, { state: { medication: med } })}>
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-semibold text-foreground text-sm">{med.name}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${med.effectiveness === 'high' ? 'bg-green-100 text-green-800' : med.effectiveness === 'medium' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>
                        {effectivenessLabel[med.effectiveness]}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{med.description}</p>
                    <PriceIndicator level={med.price_level} priceRange={med.price_range_naira} />
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </div>
              </button>
            ))}
          </div>
        </div>
        <div className="pt-2 pb-2 space-y-3">
          <Button
            className="w-full rounded-xl h-11 font-semibold"
            onClick={() => navigate('/dermatologist-chat', { state: { result } })}
          >
            <MessageCircle className="mr-2 h-4 w-4" />{t('chat.connect_derm')}
          </Button>
          <Button variant="outline" className="w-full rounded-xl h-11 font-semibold" onClick={() => navigate('/photo-input')}>
            <Sparkles className="mr-2 h-4 w-4" />{t('common.analyze_another')}
          </Button>
          <p className="text-xs text-center text-muted-foreground text-pretty">{t('results.ai_disclaimer')}</p>
        </div>
      </div>
    </div>
  );
}
