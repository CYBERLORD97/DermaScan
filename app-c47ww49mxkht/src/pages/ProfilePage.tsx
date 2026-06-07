import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  ArrowLeft, User, Mail, Calendar, LogOut, Loader2,
  UserCircle, Globe, MessageCircle, ChevronRight,
  Trash2, CalendarDays,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, setLanguage, type LanguageCode } from '@/i18n';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';



export default function ProfilePage() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const username = user?.email ?? '';
  const [displayName, setDisplayName] = useState(
    profile?.full_name ?? user?.user_metadata?.full_name ?? ''
  );
  const [saving, setSaving] = useState(false);



  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-NG', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : '—';





  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: displayName.trim() || null })
        .eq('id', user.id);
      if (error) throw error;
      await refreshProfile();
      toast.success(t('profile.success'));
    } catch {
      toast.error(t('profile.error'));
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleLanguageChange = (code: string) => {
    setLanguage(code as LanguageCode);
  };




  return (
    <div className="min-h-screen bg-background">
      {/* Hero banner */}
      <div className="gradient-hero px-4 pt-6 pb-16">
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-white/80 hover:text-white text-sm mb-4 transition-colors"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          {t('common.back_home')}
        </button>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 border border-white/30">
            <UserCircle className="h-9 w-9 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-white/70 text-xs font-medium uppercase tracking-wide mb-0.5">
              {t('profile.title')}
            </p>
            <h1 className="text-xl font-bold text-white text-balance leading-tight">
              {profile?.full_name || user?.user_metadata?.full_name || user?.email || '—'}
            </h1>
            <p className="text-white/60 text-xs mt-0.5">{t('profile.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-6 pb-10 space-y-4">

        {/* Account Info */}
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-border bg-muted/40">
            <User className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">{t('profile.section_account')}</span>
          </div>
          <div className="p-5 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="display_name" className="text-sm font-normal text-muted-foreground">
                {t('profile.display_name')}
              </Label>
              <Input
                id="display_name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={t('profile.display_name_placeholder')}
                className="rounded-xl h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-normal text-muted-foreground flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                {t('profile.email')}
              </Label>
              <div className="flex items-center gap-2 px-3 h-11 rounded-xl bg-muted border border-border text-sm text-muted-foreground">
                {username || '—'}
              </div>
            </div>
            <div className="flex items-center gap-2.5 py-2">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">{t('profile.member_since')}</p>
                <p className="text-sm text-foreground font-medium">{memberSince}</p>
              </div>
            </div>
            <Button className="w-full rounded-xl h-11 font-semibold" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {saving ? t('common.saving') : t('profile.save')}
            </Button>
          </div>
        </div>
        {/* Quick links */}
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-border bg-muted/40">
            <CalendarDays className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">{t('appointments.title')}</span>
          </div>
          <button
            onClick={() => navigate('/my-appointments')}
            className="flex items-center justify-between w-full px-5 py-4 hover:bg-muted/40 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-foreground">{t('appointments.subtitle')}</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Preferences */}
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-border bg-muted/40">
            <Globe className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">{t('profile.section_preferences')}</span>
          </div>
          <div className="p-5">
            <Label className="text-sm font-normal text-muted-foreground mb-1.5 block">
              {t('profile.language')}
            </Label>
            <Select value={i18n.language} onValueChange={handleLanguageChange}>
              <SelectTrigger className="rounded-xl h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Sign out */}
        <Button
          variant="ghost"
          className="w-full rounded-xl h-11 border border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive font-semibold"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {t('profile.sign_out')}
        </Button>
      </div>
    </div>
  );
}
