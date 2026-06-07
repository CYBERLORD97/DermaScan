import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, XCircle, Loader2, Calendar, Home } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/db/supabase';

type Status = 'verifying' | 'success' | 'failed';

export default function PaymentSuccessPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const sessionId = params.get('session_id');
  const reference = params.get('reference');
  const appointmentId = params.get('appointment_id');
  const provider = (params.get('provider') ?? (sessionId ? 'stripe' : 'paystack')) as 'stripe' | 'paystack';

  const [status, setStatus] = useState<Status>('verifying');
  const [info, setInfo] = useState<{ email?: string | null; amount?: number | null; currency?: string | null }>({});

  useEffect(() => {
    if (!appointmentId) { setStatus('failed'); return; }

    supabase.functions.invoke('verify-appointment-payment', {
      body: {
        provider,
        appointmentId,
        ...(sessionId ? { sessionId } : {}),
        ...(reference ? { reference } : {}),
      },
    }).then(({ data, error }) => {
      if (error || data?.code !== 'SUCCESS') { setStatus('failed'); return; }
      const d = data.data;
      if (d.verified || d.alreadyConfirmed) {
        setStatus('success');
        setInfo({ email: d.customerEmail, amount: d.amount, currency: d.currency });
      } else {
        setStatus('failed');
      }
    }).catch(() => setStatus('failed'));
  }, [appointmentId, sessionId, reference, provider]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-[calc(100%-2rem)] md:max-w-md border-2">
        <CardContent className="pt-10 pb-8 px-6 flex flex-col items-center text-center">
          {status === 'verifying' && (
            <>
              <Loader2 className="h-16 w-16 text-primary animate-spin mb-6" />
              <h1 className="text-xl font-bold text-foreground text-balance">{t('payment.verifying')}</h1>
              <p className="text-muted-foreground text-sm mt-2 text-pretty">Please wait while we confirm your payment…</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <h1 className="text-xl font-bold text-foreground text-balance">{t('payment.success_title')}</h1>
              <p className="text-muted-foreground text-sm mt-2 text-pretty">{t('payment.success_body')}</p>

              {(info.amount || info.email) && (
                <div className="mt-5 w-full bg-muted rounded-xl px-4 py-4 text-left space-y-2">
                  {info.amount && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Amount paid</span>
                      <span className="font-semibold">
                        {info.currency?.toUpperCase() === 'NGN' || !info.currency
                          ? `₦${(info.amount / 100).toLocaleString('en-NG')}`
                          : `${info.currency?.toUpperCase()} ${(info.amount / 100).toLocaleString()}`}
                      </span>
                    </div>
                  )}
                  {info.email && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Confirmation sent to</span>
                      <span className="font-medium text-foreground truncate max-w-[55%]">{info.email}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-3 w-full mt-6">
                <Button className="w-full h-11 rounded-xl font-semibold" onClick={() => navigate('/history')}>
                  <Calendar className="mr-2 h-4 w-4" />{t('payment.view_appointments')}
                </Button>
                <Button variant="outline" className="w-full h-11 rounded-xl" onClick={() => navigate('/')}>
                  <Home className="mr-2 h-4 w-4" />{t('payment.new_scan')}
                </Button>
              </div>
            </>
          )}

          {status === 'failed' && (
            <>
              <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-6">
                <XCircle className="h-10 w-10 text-red-500" />
              </div>
              <h1 className="text-xl font-bold text-foreground text-balance">{t('payment.failed_title')}</h1>
              <p className="text-muted-foreground text-sm mt-2 text-pretty">{t('payment.failed_body')}</p>
              <div className="flex flex-col gap-3 w-full mt-6">
                <Button className="w-full h-11 rounded-xl font-semibold" onClick={() => navigate('/book-appointment')}>
                  <Calendar className="mr-2 h-4 w-4" />Try Booking Again
                </Button>
                <Button variant="outline" className="w-full h-11 rounded-xl" onClick={() => navigate('/')}>
                  <Home className="mr-2 h-4 w-4" />{t('common.back_home')}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
