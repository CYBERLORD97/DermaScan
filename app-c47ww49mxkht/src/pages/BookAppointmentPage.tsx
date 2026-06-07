import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, MapPin, Calendar, Clock, CreditCard, CheckCircle2, Loader2, User, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';
import type { Dermatologist, AnalysisResult } from '@/types/index';

const NEXT_7_DAYS = Array.from({ length: 14 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() + i + 1);
  return d;
});

function formatDate(d: Date) {
  return d.toISOString().split('T')[0];
}

function formatDateDisplay(d: Date) {
  return d.toLocaleDateString('en-NG', { weekday: 'short', month: 'short', day: 'numeric' });
}

function dayName(d: Date) {
  return d.toLocaleDateString('en-NG', { weekday: 'long' });
}

export default function BookAppointmentPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { result?: AnalysisResult } | null;

  const [dermatologists, setDermatologists] = useState<Dermatologist[]>([]);
  const [loadingDerms, setLoadingDerms] = useState(true);
  const [selectedDerm, setSelectedDerm] = useState<Dermatologist | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [paymentProvider, setPaymentProvider] = useState<'stripe' | 'paystack'>('paystack');

  useEffect(() => {
    supabase
      .from('dermatologists')
      .select('*')
      .eq('is_active', true)
      .order('years_experience', { ascending: false })
      .then(({ data }) => {
        setDermatologists((data as Dermatologist[]) ?? []);
        setLoadingDerms(false);
      });
  }, []);

  const availableDates = selectedDerm
    ? NEXT_7_DAYS.filter((d) => selectedDerm.available_days.includes(dayName(d)))
    : [];

  const handleBook = async () => {
    if (!selectedDerm || !selectedDate || !selectedTime) {
      toast.error(t('booking.error_select'));
      return;
    }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error('Please log in to book an appointment');
      navigate('/login');
      return;
    }
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-appointment-checkout', {
        body: {
          dermatologistId: selectedDerm.id,
          appointmentDate: formatDate(selectedDate),
          appointmentTime: selectedTime,
          paymentProvider,
          notes: notes.trim() || undefined,
        },
      });
      if (error) {
        const msg = await error.context?.text?.();
        throw new Error(msg || error.message);
      }
      if (data?.code !== 'SUCCESS') throw new Error(data?.message || 'Checkout failed');
      window.open(data.data.url, '_blank');
    } catch (err) {
      toast.error((err as Error).message || 'Booking failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="gradient-hero px-4 pt-6 pb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-white/80 hover:text-white text-sm mb-3 transition-colors"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />{t('booking.back')}
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            <Calendar className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-white text-balance">{t('booking.title')}</h1>
            <p className="text-white/70 text-xs text-pretty">{t('booking.subtitle')}</p>
          </div>
        </div>
        {state?.result && (
          <div className="mt-3 bg-white/10 rounded-xl px-3 py-2">
            <p className="text-white/80 text-xs">
              Booking for: <span className="font-semibold text-white">{state.result.condition_name}</span>
            </p>
          </div>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Step 1: Choose Dermatologist */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            1. {t('booking.select_derm')}
          </h2>
          {loadingDerms ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="space-y-3">
              {dermatologists.map((derm) => (
                <Card
                  key={derm.id}
                  className={`cursor-pointer transition-all border-2 ${
                    selectedDerm?.id === derm.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/40'
                  }`}
                  onClick={() => { setSelectedDerm(derm); setSelectedDate(null); setSelectedTime(null); }}
                >
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <div className="w-14 h-14 rounded-xl bg-muted overflow-hidden shrink-0">
                        {derm.photo_url
                          ? <img src={derm.photo_url} alt={derm.name} className="w-full h-full object-cover" />
                          : <User className="h-8 w-8 m-3 text-muted-foreground" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-foreground text-balance">{derm.name}</p>
                            <p className="text-xs text-muted-foreground text-pretty mt-0.5">{derm.specialization}</p>
                          </div>
                          {selectedDerm?.id === derm.id && (
                            <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{derm.location}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-amber-500" />
                            <span className="text-xs text-muted-foreground">{derm.years_experience} {t('booking.years')}</span>
                          </div>
                        </div>
                        <div className="mt-2">
                          <Badge className="bg-primary/10 text-primary border-0 text-xs font-semibold">
                            ₦{derm.consultation_fee_naira.toLocaleString('en-NG')}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    {derm.bio && (
                      <p className="text-xs text-muted-foreground mt-3 text-pretty">{derm.bio}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Step 2: Choose Date */}
        {selectedDerm && (
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              2. {t('booking.select_date')}
            </h2>
            <div className="flex gap-2 overflow-x-auto pb-2 whitespace-nowrap">
              {availableDates.length === 0 ? (
                <p className="text-sm text-muted-foreground">No available dates in the next 2 weeks.</p>
              ) : availableDates.map((d) => {
                const iso = formatDate(d);
                const isSelected = selectedDate && formatDate(selectedDate) === iso;
                return (
                  <button
                    key={iso}
                    onClick={() => { setSelectedDate(d); setSelectedTime(null); }}
                    className={`flex flex-col items-center px-3 py-2.5 rounded-xl border-2 transition-all shrink-0 min-w-[72px] ${
                      isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card hover:border-primary/50'
                    }`}
                  >
                    <span className={`text-xs font-medium ${isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                      {d.toLocaleDateString('en-NG', { weekday: 'short' })}
                    </span>
                    <span className="text-sm font-bold mt-0.5">{d.getDate()}</span>
                    <span className={`text-xs ${isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                      {d.toLocaleDateString('en-NG', { month: 'short' })}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Step 3: Choose Time */}
        {selectedDate && selectedDerm && (
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              3. {t('booking.select_time')}
            </h2>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
              {selectedDerm.available_times.map((time) => {
                const isSelected = selectedTime === time;
                return (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={`flex items-center justify-center gap-1.5 rounded-xl border-2 py-2.5 text-sm font-medium transition-all ${
                      isSelected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-card hover:border-primary/50'
                    }`}
                  >
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    {time}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Step 4: Notes */}
        {selectedTime && (
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              4. Notes (Optional)
            </h2>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any specific concerns or symptoms you want to discuss…"
              rows={3}
              className="rounded-xl resize-none"
            />
          </section>
        )}

        {/* Step 5: Payment method + Booking summary */}
        {selectedDerm && selectedDate && selectedTime && (
          <Card className="border-2 border-primary/20 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">{t('booking.consultation_fee')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Dr. {selectedDerm.name}</span>
                <span className="font-bold text-primary">₦{selectedDerm.consultation_fee_naira.toLocaleString('en-NG')}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-background rounded-xl px-3 py-2 border border-border">
                <Calendar className="h-4 w-4 shrink-0" />
                <span>{formatDateDisplay(selectedDate)} at {selectedTime}</span>
              </div>

              {/* Payment provider selector */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">Choose Payment Method:</p>
                <div className="grid grid-cols-2 gap-2">
                  {(['paystack', 'stripe'] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPaymentProvider(p)}
                      className={`rounded-xl border-2 py-2.5 px-3 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                        paymentProvider === p
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-card hover:border-primary/50'
                      }`}
                    >
                      <CreditCard className="h-4 w-4 shrink-0" />
                      {p === 'paystack' ? 'Paystack' : 'Stripe / Card'}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                className="w-full h-12 text-base font-bold rounded-xl"
                onClick={handleBook}
                disabled={processing}
              >
                {processing
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('booking.processing')}</>
                  : <><CreditCard className="mr-2 h-4 w-4" />{t('booking.book_now')} — ₦{selectedDerm.consultation_fee_naira.toLocaleString('en-NG')}</>}
              </Button>

              <p className="text-xs text-muted-foreground text-center text-pretty">
                Secure payment. You will be redirected to complete payment and your appointment will be confirmed after verification.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
