import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import TransparentLogo from '@/components/ui/transparent-logo';
import { useTranslation } from 'react-i18next';

const LOGO_URL = 'https://miaoda-conversation-file.s3cdn.medo.dev/user-bixucmyfwphc/app-c47ww49mxkht/20260606/image_1780751279387.png';

export default function LoginPage() {
  const navigate = useNavigate();
  const { signInWithEmail } = useAuth();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error(t('login.error_fields'));
      return;
    }
    setLoading(true);
    const { error } = await signInWithEmail(email, password);
    setLoading(false);
    if (error) {
      toast.error(error.message || t('login.error_invalid'));
    } else {
      toast.success(t('login.success'));
      navigate('/');
    }
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-background flex flex-col">
      <div className="gradient-hero px-4 pt-10 pb-16 flex flex-col items-center text-center">
        <TransparentLogo src={LOGO_URL} alt="DermaScan" className="h-16 w-auto object-contain mb-3 drop-shadow" />
        <h1 className="text-2xl font-bold text-white">{t('login.welcome')}</h1>
        <p className="text-white/70 text-sm mt-1">{t('login.subtitle')}</p>
      </div>
      <div className="flex-1 flex items-start justify-center px-4 -mt-6 pb-10">
        <div className="w-full max-w-[calc(100%-2rem)] md:max-w-md bg-card rounded-2xl shadow-md border border-border p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-normal text-muted-foreground">{t('login.email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t('login.email_placeholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-xl h-11"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-normal text-muted-foreground">{t('login.password')}</Label>
              <Input
                id="password"
                type="password"
                placeholder={t('login.password_placeholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-xl h-11"
                required
              />
            </div>
            <Button type="submit" className="w-full rounded-xl h-11 font-semibold" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t('login.submit')}
            </Button>
          </form>
          <p className="mt-5 text-center text-sm text-muted-foreground">
            {t('login.no_account')}{' '}
            <Link to="/register" className="text-primary hover:underline font-semibold">{t('login.register_link')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
