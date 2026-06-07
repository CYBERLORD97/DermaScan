import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Medication } from '@/types/index';
import { ArrowLeft, Pill, AlertTriangle, BarChart3, Tag } from 'lucide-react';
import { useTranslation } from 'react-i18next';

function PriceIndicator({ level, priceRange }: { level: 'low' | 'medium' | 'high'; priceRange?: string }) {
  const { t } = useTranslation();
  const label = level === 'low' ? t('results.cheap') : level === 'medium' ? t('results.affordable') : t('results.expensive');
  const colorClass = level === 'low'
    ? 'bg-green-100 text-green-800 border-green-200'
    : level === 'medium'
    ? 'bg-amber-100 text-amber-800 border-amber-200'
    : 'bg-red-100 text-red-800 border-red-200';
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <span className={`inline-block text-sm font-semibold px-3 py-1 rounded-full border ${colorClass}`}>{label}</span>
      {priceRange && <span className="text-base font-bold text-foreground">{priceRange}</span>}
    </div>
  );
}

export default function MedicationDetailsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const state = location.state as { medication?: Medication } | null;
  const medication = state?.medication;

  if (!medication) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <p className="text-muted-foreground mb-4">{t('medication.no_medication')}</p>
        <Button onClick={() => navigate('/photo-input')}>{t('common.new_scan')}</Button>
      </div>
    );
  }

  const effectivenessColor = {
    high: 'bg-green-100 text-green-800 border-green-200',
    medium: 'bg-amber-100 text-amber-800 border-amber-200',
    low: 'bg-red-100 text-red-800 border-red-200',
  };

  const effectivenessLabel: Record<string, string> = {
    high: t('results.highly_effective'),
    medium: t('results.effective'),
    low: t('results.less_effective'),
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="gradient-hero px-4 pt-6 pb-14">
        <button onClick={() => navigate(-1)} className="flex items-center text-white/80 hover:text-white text-sm mb-4 transition-colors">
          <ArrowLeft className="mr-1 h-4 w-4" />{t('common.back_results')}
        </button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            <Pill className="h-6 w-6 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-white/70 text-xs font-medium uppercase tracking-wide mb-0.5">{t('medication.label')}</p>
            <h1 className="text-xl font-bold text-white text-balance leading-tight">{medication.name}</h1>
          </div>
        </div>
      </div>
      <div className="max-w-2xl mx-auto px-4 -mt-6 pb-10 space-y-4">
        <div className="bg-card rounded-2xl border border-border shadow-sm p-5 space-y-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">{t('medication.effectiveness')}</p>
            <Badge variant="outline" className={effectivenessColor[medication.effectiveness]}>
              <BarChart3 className="mr-1.5 h-3 w-3" />{effectivenessLabel[medication.effectiveness]}
            </Badge>
          </div>
          <div className="h-px bg-border" />
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Tag className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('medication.price_nigeria')}</p>
            </div>
            <PriceIndicator level={medication.price_level} priceRange={medication.price_range_naira} />
          </div>
          <div className="h-px bg-border" />
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">{t('medication.description')}</p>
            <p className="text-sm text-foreground text-pretty leading-relaxed">{medication.description}</p>
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-amber-800 text-sm">{t('common.medical_disclaimer')}</p>
            <p className="text-sm text-amber-700 mt-1 text-pretty">{t('medication.disclaimer_body')}</p>
          </div>
        </div>
        <Button className="w-full rounded-xl h-11 font-semibold" onClick={() => navigate('/photo-input')}>
          <Pill className="mr-2 h-4 w-4" />{t('common.analyze_another')}
        </Button>
      </div>
    </div>
  );
}
