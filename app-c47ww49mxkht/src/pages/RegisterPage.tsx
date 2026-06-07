import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import TransparentLogo from '@/components/ui/transparent-logo';
import { useTranslation } from 'react-i18next';

const LOGO_URL = 'https://miaoda-conversation-file.s3cdn.medo.dev/user-bixucmyfwphc/app-c47ww49mxkht/20260606/image_1780751279387.png';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { signUpWithEmail } = useAuth();
  const { t } = useTranslation();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email || !password) {
      toast.error(t('register.error_fields'));
      return;
    }
    if (password !== confirmPassword) {
      toast.error(t('register.error_match'));
      return;
    }
    if (!agreed) {
      toast.error(t('register.error_terms'));
      return;
    }
    setLoading(true);
    const { error } = await signUpWithEmail(email, password, fullName.trim());
    setLoading(false);
    if (error) {
      toast.error(error.message || t('register.error_fields'));
    } else {
      toast.success(t('register.success'));
      navigate('/');
    }
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-background flex flex-col">
      <div className="gradient-hero px-4 pt-10 pb-16 flex flex-col items-center text-center">
        <TransparentLogo src={LOGO_URL} alt="DermaScan" className="h-16 w-auto object-contain mb-3 drop-shadow" />
        <h1 className="text-2xl font-bold text-white">{t('register.title')}</h1>
        <p className="text-white/70 text-sm mt-1">{t('register.subtitle')}</p>
      </div>
      <div className="flex-1 flex items-start justify-center px-4 -mt-6 pb-10">
        <div className="w-full max-w-[calc(100%-2rem)] md:max-w-md bg-card rounded-2xl shadow-md border border-border p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-sm font-normal text-muted-foreground">{t('register.full_name')}</Label>
              <Input
                id="fullName"
                type="text"
                placeholder={t('register.full_name_placeholder')}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="rounded-xl h-11"
                required
              />
            </div>
            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-normal text-muted-foreground">{t('register.email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t('register.email_placeholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-xl h-11"
                required
              />
            </div>
            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-normal text-muted-foreground">{t('register.password')}</Label>
              <Input
                id="password"
                type="password"
                placeholder={t('register.password_placeholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-xl h-11"
                required
              />
            </div>
            {/* Confirm Password */}
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-sm font-normal text-muted-foreground">{t('register.confirm_password')}</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder={t('register.confirm_placeholder')}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="rounded-xl h-11"
                required
              />
            </div>
            {/* Terms */}
            <div className="flex items-start gap-3 min-h-12">
              <Checkbox
                id="terms"
                checked={agreed}
                onCheckedChange={(c) => setAgreed(c === true)}
                className="mt-0.5"
              />
              <Label htmlFor="terms" className="text-xs font-normal leading-relaxed text-muted-foreground cursor-pointer">
                {t('register.terms_prefix')}{' '}
                <span className="text-primary hover:underline cursor-pointer">{t('register.terms_agreement')}</span>{' '}
                {t('register.terms_and')}{' '}
                <span className="text-primary hover:underline cursor-pointer">{t('register.terms_privacy')}</span>.
              </Label>
            </div>
            <Button type="submit" className="w-full rounded-xl h-11 font-semibold" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t('register.submit')}
            </Button>
          </form>
          <p className="mt-5 text-center text-sm text-muted-foreground">
            {t('register.have_account')}{' '}
            <Link to="/login" className="text-primary hover:underline font-semibold">{t('register.sign_in')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
