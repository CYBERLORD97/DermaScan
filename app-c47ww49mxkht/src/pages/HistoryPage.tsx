import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  ArrowLeft, Calendar, AlertTriangle, History,
  ChevronDown, ChevronUp, Stethoscope, Pill,
  BarChart3, Tag, Sparkles,
} from 'lucide-react';
import type { AnalysisRecord, Medication } from '@/types/index';
import { useTranslation } from 'react-i18next';

// ── price badge ──────────────────────────────────────────────────────────────
function PriceBadge({ level, range }: { level: 'low' | 'medium' | 'high'; range?: string }) {
  const { t } = useTranslation();
  const label = level === 'low' ? t('results.cheap') : level === 'medium' ? t('results.affordable') : t('results.expensive');
  const cls = level === 'low'
    ? 'bg-green-100 text-green-800 border-green-200'
    : level === 'medium'
    ? 'bg-amber-100 text-amber-800 border-amber-200'
    : 'bg-red-100 text-red-800 border-red-200';
  return (
    <span className="flex items-center gap-1.5 flex-wrap">
      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${cls}`}>{label}</span>
      {range && <span className="text-xs font-medium text-muted-foreground">{range}</span>}
    </span>
  );
}

// ── severity colors ──────────────────────────────────────────────────────────
const severityColor: Record<string, string> = {
  mild:     'bg-green-100 text-green-800 border-green-200',
  moderate: 'bg-amber-100 text-amber-800 border-amber-200',
  severe:   'bg-red-100 text-red-800 border-red-200',
};

// ── main page ────────────────────────────────────────────────────────────────
export default function HistoryPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [records, setRecords] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchHistory = async () => {
      const { data, error } = await supabase
        .from('analyses')
        .select(
          'id, user_id, image_url, condition_name, severity, confidence_score, treatment_recommendations, medication_recommendations, created_at'
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) { toast.error(t('history.failed')); setLoading(false); return; }
      setRecords(Array.isArray(data) ? (data as AnalysisRecord[]) : []);
      setLoading(false);
    };
    fetchHistory();
  }, [user, t]);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-NG', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  const toggle = (id: string) => setExpanded((prev) => (prev === id ? null : id));

  const effectivenessLabel: Record<string, string> = {
    high:   t('results.highly_effective'),
    medium: t('results.effective'),
    low:    t('results.less_effective'),
  };
  const effectivenessColor: Record<string, string> = {
    high:   'bg-green-100 text-green-800',
    medium: 'bg-amber-100 text-amber-800',
    low:    'bg-red-100 text-red-800',
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ── header banner ── */}
      <div className="gradient-hero px-4 pt-6 pb-14">
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-white/80 hover:text-white text-sm mb-4 transition-colors"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          {t('common.back_home')}
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
            <History className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">{t('history.title')}</h1>
        </div>
      </div>

      {/* ── content ── */}
      <div className="max-w-2xl mx-auto px-4 -mt-6 pb-10">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-2xl border border-border shadow-sm p-4">
                <Skeleton className="h-5 w-1/3 mb-2 bg-muted" />
                <Skeleton className="h-4 w-1/4 bg-muted" />
              </div>
            ))}
          </div>
        ) : records.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border shadow-sm p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <History className="h-7 w-7 text-primary" />
            </div>
            <p className="text-muted-foreground mb-4 text-sm">{t('history.empty')}</p>
            <Button className="rounded-xl" onClick={() => navigate('/photo-input')}>
              {t('history.first_scan')}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {records.map((record) => {
              const isOpen = expanded === record.id;
              const meds: Medication[] = Array.isArray(record.medication_recommendations)
                ? record.medication_recommendations
                : [];
              const isConcerning = record.severity === 'severe' || (record.confidence_score !== null && record.confidence_score < 60);

              return (
                <div
                  key={record.id}
                  className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden"
                >
                  {/* ── summary row (tap to expand) ── */}
                  <button
                    className="w-full p-4 text-left hover:bg-muted/30 transition-colors"
                    onClick={() => toggle(record.id)}
                  >
                    <div className="flex items-center gap-3">
                      {/* thumbnail */}
                      {record.image_url ? (
                        <img
                          src={record.image_url}
                          alt="Skin"
                          className="h-14 w-14 object-cover rounded-xl border shrink-0"
                        />
                      ) : (
                        <div className="h-14 w-14 rounded-xl bg-muted flex items-center justify-center shrink-0">
                          <History className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}

                      {/* info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-semibold text-foreground text-sm truncate">
                            {record.condition_name || t('history.unknown')}
                          </span>
                          {record.severity && (
                            <Badge
                              variant="outline"
                              className={`text-xs capitalize ${severityColor[record.severity] || ''}`}
                            >
                              {record.severity}
                            </Badge>
                          )}
                          {record.confidence_score !== null && record.confidence_score < 60 && (
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
                              <AlertTriangle className="mr-1 h-3 w-3" />
                              {t('history.low_badge')}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3 shrink-0" />
                          <span>{formatDate(record.created_at)}</span>
                        </div>
                      </div>

                      {/* chevron */}
                      <div className="shrink-0 text-muted-foreground">
                        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </div>
                  </button>

                  {/* ── expanded detail ── */}
                  {isOpen && (
                    <div className="border-t border-border px-4 pb-5 pt-4 space-y-4">

                      {/* confidence */}
                      {record.confidence_score !== null && (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">{t('results.confidence_label')}</p>
                            <span className="text-xs font-bold text-foreground">{record.confidence_score}%</span>
                          </div>
                          <Progress value={record.confidence_score} className="h-1.5" />
                        </div>
                      )}

                      {/* alert banner for concerning results */}
                      {isConcerning && (
                        <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                          <p className="text-xs text-red-700 font-medium">{t('results.important_notice')}</p>
                        </div>
                      )}

                      {/* treatment */}
                      {record.treatment_recommendations && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                              <Stethoscope className="h-3.5 w-3.5 text-primary" />
                            </div>
                            <h3 className="text-sm font-semibold text-foreground">
                              {t('results.treatment_title')}
                            </h3>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed text-pretty whitespace-pre-wrap pl-8">
                            {record.treatment_recommendations}
                          </p>
                        </div>
                      )}

                      {/* medications */}
                      {meds.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                              <Pill className="h-3.5 w-3.5 text-primary" />
                            </div>
                            <h3 className="text-sm font-semibold text-foreground">
                              {t('results.medication_title')}
                            </h3>
                          </div>
                          <div className="space-y-2 pl-8">
                            {meds.map((med, idx) => (
                              <div
                                key={idx}
                                className="bg-muted/50 border border-border rounded-xl p-3 space-y-1.5"
                              >
                                {/* name + effectiveness */}
                                <div className="flex items-start justify-between gap-2 flex-wrap">
                                  <span className="font-semibold text-sm text-foreground">{med.name}</span>
                                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${effectivenessColor[med.effectiveness] || ''}`}>
                                    <BarChart3 className="h-3 w-3" />
                                    {effectivenessLabel[med.effectiveness]}
                                  </span>
                                </div>
                                {/* description */}
                                <p className="text-xs text-muted-foreground text-pretty leading-relaxed">
                                  {med.description}
                                </p>
                                {/* price */}
                                <div className="flex items-center gap-1.5 pt-0.5">
                                  <Tag className="h-3 w-3 text-muted-foreground shrink-0" />
                                  <PriceBadge level={med.price_level} range={med.price_range_naira} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* re-scan CTA */}
                      <Button
                        size="sm"
                        className="w-full rounded-xl h-9 font-medium"
                        onClick={() => navigate('/photo-input')}
                      >
                        <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                        {t('common.start_scan')}
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
