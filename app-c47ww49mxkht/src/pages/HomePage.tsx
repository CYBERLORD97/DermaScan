import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Camera, History, ChevronRight, ShieldCheck, Zap, BookOpen, MessageCircle, Calendar } from 'lucide-react';
import TransparentLogo from '@/components/ui/transparent-logo';
import { useTranslation } from 'react-i18next';

const LOGO_URL = 'https://miaoda-conversation-file.s3cdn.medo.dev/user-bixucmyfwphc/app-c47ww49mxkht/20260606/image_1780751279387.png';

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();

  const goTo = (path: string, requiresAuth = true) => {
    if (requiresAuth && !user) { navigate('/login'); return; }
    navigate(path);
  };

  const features = [
    { icon: Zap, title: t('home.feature_instant'), desc: t('home.feature_instant_desc') },
    { icon: ShieldCheck, title: t('home.feature_trusted'), desc: t('home.feature_trusted_desc') },
    { icon: BookOpen, title: t('home.feature_nigerian'), desc: t('home.feature_nigerian_desc') },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Banner */}
      <div className="gradient-hero px-4 pt-10 pb-16 text-center">
        <TransparentLogo src={LOGO_URL} alt="DermaScan" className="mx-auto h-20 w-auto object-contain mb-4 drop-shadow-md" />
        <h1 className="text-3xl md:text-4xl font-extrabold text-white text-balance leading-tight mb-3">
          {t('home.hero_title')}
        </h1>
        <p className="text-white/80 text-sm md:text-base max-w-sm mx-auto text-pretty mb-6">
          {t('home.hero_subtitle')}
        </p>
        <Button
          size="lg"
          className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-full px-8 shadow-lg font-semibold"
          onClick={() => goTo('/photo-input')}
        >
          <Camera className="mr-2 h-5 w-5" />
          {t('home.start_scan')}
        </Button>
      </div>

      {/* Content area */}
      <div className="max-w-2xl mx-auto px-4 -mt-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <button
            onClick={() => goTo('/photo-input')}
            className="bg-card rounded-2xl p-5 shadow text-left card-hover border border-border group"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
              <Camera className="h-5 w-5 text-primary" />
            </div>
            <p className="font-semibold text-foreground text-sm">{t('home.new_scan')}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{t('home.new_scan_sub')}</p>
          </button>

          <button
            onClick={() => goTo('/history')}
            className="bg-card rounded-2xl p-5 shadow text-left card-hover border border-border group"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
              <History className="h-5 w-5 text-primary" />
            </div>
            <p className="font-semibold text-foreground text-sm">{t('home.history')}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{t('home.history_sub')}</p>
          </button>
        </div>

        <button
          onClick={() => goTo('/book-appointment')}
          className="w-full bg-card rounded-2xl p-5 shadow text-left card-hover border border-border group mb-8 flex items-center gap-4"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm">{t('home.book_appointment', 'Book Appointment')}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{t('home.book_appointment_sub', 'Consult a dermatologist directly')}</p>
          </div>
        </button>

        {/* Features */}
        <div className="mb-8">
          <h2 className="text-base font-bold text-foreground mb-3">{t('home.why_title')}</h2>
          <div className="space-y-3">
            {features.map((f, i) => (
              <div key={i} className="bg-card rounded-2xl p-4 border border-border flex items-start gap-4 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                  <f.icon className="h-5 w-5 text-accent" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-foreground">{f.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 text-pretty">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA strip */}
        {!user && (
          <div className="bg-primary rounded-2xl p-5 flex items-center justify-between shadow mb-8">
            <div>
              <p className="font-bold text-white text-sm">{t('home.cta_title')}</p>
              <p className="text-white/70 text-xs mt-0.5">{t('home.cta_sub')}</p>
            </div>
            <Button
              size="sm"
              className="bg-accent hover:bg-accent/90 text-white rounded-full shrink-0"
              onClick={() => navigate('/register')}
            >
              {t('home.sign_up')} <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground pb-8">
          {t('common.not_substitute')}
        </p>
      </div>

      {/* Floating Chatbot FAB */}
      {user && (
        <button
          onClick={() => navigate('/dermatologist-chat')}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-transform hover:scale-105 active:scale-95"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}
    </div>
  );
}
