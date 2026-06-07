import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, User, Menu } from 'lucide-react';
import { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import TransparentLogo from '@/components/ui/transparent-logo';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';

const LOGO_URL = 'https://miaoda-conversation-file.s3cdn.medo.dev/user-bixucmyfwphc/app-c47ww49mxkht/20260606/image_1780751279387.png';

export function Header() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useTranslation();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const navItems = [
    { label: t('nav.home'), path: '/' },
    ...(user ? [
      { label: t('nav.scan', 'Scan'), path: '/photo-input' },
      { label: t('nav.history', 'Scan History'), path: '/history' },
      { label: t('nav.chat_history', 'Chat History'), path: '/chat-history' },
      { label: t('appointments.title', 'My Appointments'), path: '/my-appointments' },
      { label: t('nav.profile', 'Profile'), path: '/profile' },
    ] : []),
    { label: t('nav.about'), path: '/about' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/95 backdrop-blur">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <TransparentLogo src={LOGO_URL} alt="DermaScan" className="h-8 w-auto object-contain" />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isActive(item.path)
                  ? 'bg-primary/10 text-primary'
                  : 'text-foreground/70 hover:text-foreground hover:bg-muted'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <LanguageSwitcher />

          {user ? (
            <div className="flex items-center gap-2">
              <span className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
                <User className="h-3.5 w-3.5" />
                {user.email?.split('@')[0]}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-foreground h-9"
              >
                <LogOut className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">{t('nav.logout')}</span>
              </Button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-9" onClick={() => navigate('/login')}>
                {t('nav.login')}
              </Button>
              <Button size="sm" className="h-9 rounded-full px-4" onClick={() => navigate('/register')}>
                {t('nav.register')}
              </Button>
            </div>
          )}

          {/* Mobile menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64 bg-card">
              <div className="flex flex-col gap-1 mt-8">
                {navItems.map(item => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                      isActive(item.path)
                        ? 'bg-primary/10 text-primary'
                        : 'text-foreground hover:bg-muted'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
                {!user && (
                  <div className="flex flex-col gap-2 mt-4 px-1">
                    <Button
                      className="rounded-xl"
                      onClick={() => { setMobileMenuOpen(false); navigate('/login'); }}
                    >
                      {t('nav.login')}
                    </Button>
                    <Button
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => { setMobileMenuOpen(false); navigate('/register'); }}
                    >
                      {t('nav.register')}
                    </Button>
                  </div>
                )}
                {user && (
                  <button
                    onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                    className="mt-4 px-4 py-3 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 text-left transition-colors flex items-center gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    {t('nav.logout')}
                  </button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
