import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Activity, Pill, Shield, AlertTriangle, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function AboutPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const sections = [
    { icon: Activity, title: t('about.how_title'), content: t('about.how_content') },
    { icon: Pill,     title: t('about.price_title'), content: t('about.price_content') },
    { icon: Shield,   title: t('about.privacy_title'), content: t('about.privacy_content') },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="gradient-hero px-4 pt-6 pb-14">
        <button onClick={() => navigate('/')} className="flex items-center text-white/80 hover:text-white text-sm mb-4 transition-colors">
          <ArrowLeft className="mr-1 h-4 w-4" />
          {t('common.back_home')}
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
            <Info className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">{t('about.title')}</h1>
        </div>
      </div>
      <div className="max-w-2xl mx-auto px-4 -mt-6 pb-10 space-y-4">
        {sections.map((s, i) => (
          <div key={i} className="bg-card rounded-2xl border border-border shadow-sm p-5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <s.icon className="h-4 w-4 text-primary" />
              </div>
              <h2 className="font-bold text-sm text-foreground">{s.title}</h2>
            </div>
            <p className="text-sm text-muted-foreground text-pretty leading-relaxed">{s.content}</p>
          </div>
        ))}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            </div>
            <h2 className="font-bold text-sm text-amber-800">{t('about.title').includes('DermaScan') ? 'Medical Disclaimer' : t('common.medical_disclaimer')}</h2>
          </div>
          <p className="text-sm text-amber-700 text-pretty leading-relaxed">{t('about.disclaimer_body')}</p>
        </div>
        <div className="pt-2 flex flex-col items-center gap-3">
          <Button className="w-full rounded-xl h-11 font-semibold" onClick={() => navigate('/photo-input')}>
            {t('common.start_scan')}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            {t('about.copyright')} &copy; {new Date().getFullYear()}.
          </p>
        </div>
      </div>
    </div>
  );
}
