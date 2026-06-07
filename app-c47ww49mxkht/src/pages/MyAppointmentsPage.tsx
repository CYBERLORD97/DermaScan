import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ArrowLeft, Calendar, Clock, MapPin, User, Loader2, CalendarPlus, X, RefreshCw, Bell, BellRing
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';

interface AppointmentNotification {
  id: string;
  type: string;
  status: string;
  is_read: boolean;
}

interface AppointmentRow {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: 'pending_payment' | 'confirmed' | 'cancelled' | 'completed';
  payment_provider: 'stripe' | 'paystack' | null;
  notes: string | null;
  created_at: string;
  dermatologists: {
    name: string;
    specialization: string;
    location: string;
    consultation_fee_naira: number;
    photo_url: string | null;
  } | null;
}

const STATUS_STYLES: Record<string, string> = {
  pending_payment: 'bg-amber-100 text-amber-800 border-amber-200',
  confirmed:       'bg-green-100 text-green-800 border-green-200',
  cancelled:       'bg-red-100 text-red-800 border-red-200',
  completed:       'bg-blue-100 text-blue-800 border-blue-200',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-NG', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
  });
}

const MyAppointmentsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);

  // Reschedule state
  const [rescheduleAppt, setRescheduleAppt] = useState<AppointmentRow | null>(null);
  const [newDate, setNewDate] = useState<string>('');
  const [newTime, setNewTime] = useState<string>('');
  const [rescheduling, setRescheduling] = useState(false);

  // Notifications state
  const [notifications, setNotifications] = useState<AppointmentNotification[]>([]);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const load = async () => {
    setLoading(true);
    
    // Load notifications
    const { data: notifs } = await supabase
      .from('appointment_notifications')
      .select('id, type, status, is_read')
      .order('created_at', { ascending: false });
    
    if (notifs && notifs.length > 0) {
      setNotifications(notifs);
      const unreads = notifs.filter(n => !n.is_read);
      if (unreads.length > 0) {
        toast(t('appointments.notification_title'), {
          description: t('appointments.notification_desc', { status: unreads[0].status }),
          icon: <BellRing className="h-4 w-4 text-primary" />
        });
        // Mark as read immediately after toasting
        await supabase.from('appointment_notifications').update({ is_read: true }).in('id', unreads.map(n => n.id));
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      }
    }

    const { data, error } = await supabase
      .from('appointments')
      .select(`
        id, appointment_date, appointment_time, status,
        payment_provider, notes, created_at,
        dermatologists!dermatologist_id (
          name, specialization, location, consultation_fee_naira, photo_url
        )
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      toast.error(t('appointments.load_error'));
    } else {
      setAppointments((data as unknown as AppointmentRow[]) ?? []);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCancel = async (id: string) => {
    setCancelling(id);
    const { error } = await supabase
      .from('appointments')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('status', 'pending_payment'); // guard: only cancel pending

    if (error) {
      toast.error(t('appointments.cancel_error'));
    } else {
      toast.success(t('appointments.cancel_success'));
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: 'cancelled' } : a))
      );
    }
    setCancelling(null);
  };

  const handleReschedule = async () => {
    if (!rescheduleAppt || !newDate || !newTime) return;
    setRescheduling(true);

    const { error } = await supabase
      .from('appointments')
      .update({
        appointment_date: newDate,
        appointment_time: newTime,
        updated_at: new Date().toISOString()
      })
      .eq('id', rescheduleAppt.id);

    if (error) {
      toast.error(t('appointments.reschedule_error'));
    } else {
      toast.success(t('appointments.reschedule_success'));
      setAppointments(prev => prev.map(a => 
        a.id === rescheduleAppt.id 
          ? { ...a, appointment_date: newDate, appointment_time: newTime } 
          : a
      ));
      setRescheduleAppt(null);
    }
    setRescheduling(false);
  };

  const today = new Date().toISOString().split('T')[0];
  const nextDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return d.toISOString().split('T')[0];
  });
  const timeSlots = ['09:00 AM', '10:00 AM', '11:00 AM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'];

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
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-white text-balance">{t('appointments.title')}</h1>
              <p className="text-white/70 text-xs text-pretty">{t('appointments.subtitle')}</p>
            </div>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0 hover:bg-white/25 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 text-white ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : appointments.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-foreground">{t('appointments.empty')}</p>
              <p className="text-sm text-muted-foreground mt-1">{t('appointments.empty_desc', 'Book a consultation with a dermatologist.')}</p>
            </div>
            <Button className="rounded-xl h-11 px-6 font-semibold" onClick={() => navigate('/book-appointment')}>
              <CalendarPlus className="mr-2 h-4 w-4" />{t('appointments.book_now')}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appt) => {
              const derm = appt.dermatologists;
              const isPending = appt.status === 'pending_payment';

              return (
                <Card key={appt.id} className="border border-border h-full">
                  <CardContent className="p-4">
                    {/* Derm info row */}
                    <div className="flex gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-muted overflow-hidden shrink-0">
                        {derm?.photo_url
                          ? <img src={derm.photo_url} alt={derm.name} className="w-full h-full object-cover" />
                          : <User className="h-6 w-6 m-3 text-muted-foreground" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-foreground text-balance">
                              {derm?.name ?? t('appointments.derm_label')}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5 text-pretty">
                              {derm?.specialization}
                            </p>
                          </div>
                          <Badge className={`text-xs border shrink-0 ${STATUS_STYLES[appt.status]}`}>
                            {t(`appointments.status_${appt.status}`)}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Details grid */}
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-1.5 bg-muted rounded-lg px-2.5 py-2">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="text-xs font-medium text-foreground truncate">
                          {formatDate(appt.appointment_date)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-muted rounded-lg px-2.5 py-2">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="text-xs font-medium text-foreground">{appt.appointment_time}</span>
                      </div>
                      {derm?.location && (
                        <div className="flex items-center gap-1.5 bg-muted rounded-lg px-2.5 py-2">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="text-xs text-foreground truncate">{derm.location}</span>
                        </div>
                      )}
                      {derm?.consultation_fee_naira != null && (
                        <div className="flex items-center gap-1.5 bg-muted rounded-lg px-2.5 py-2">
                          <span className="text-xs font-bold text-primary">
                            ₦{Number(derm.consultation_fee_naira).toLocaleString('en-NG')}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Notes */}
                    {appt.notes && (
                      <p className="mt-2 text-xs text-muted-foreground bg-muted rounded-lg px-2.5 py-2 text-pretty">
                        {appt.notes}
                      </p>
                    )}

                    {/* Cancel button for pending */}
                    {isPending && (
                      <div className="mt-3">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full rounded-xl h-9 text-red-600 border-red-200 hover:bg-red-50"
                              disabled={cancelling === appt.id}
                            >
                              {cancelling === appt.id
                                ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                                : <X className="mr-2 h-3.5 w-3.5" />}
                              {t('appointments.cancel_btn')}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t('appointments.cancel_btn')}</AlertDialogTitle>
                              <AlertDialogDescription>
                                {t('appointments.cancel_confirm')}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t('booking.cancel')}</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-red-600 hover:bg-red-700 text-white"
                                onClick={() => handleCancel(appt.id)}
                              >
                                {t('appointments.cancel_btn')}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}

                    {/* Reschedule button for confirmed */}
                    {appt.status === 'confirmed' && (
                      <div className="mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full rounded-xl h-9"
                          onClick={() => {
                            setRescheduleAppt(appt);
                            setNewDate(appt.appointment_date);
                            setNewTime(appt.appointment_time);
                          }}
                        >
                          <CalendarPlus className="mr-2 h-3.5 w-3.5" />
                          {t('appointments.reschedule_btn')}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}

            <Button
              variant="outline"
              className="w-full rounded-xl h-11 font-semibold mt-2"
              onClick={() => navigate('/book-appointment')}
            >
              <CalendarPlus className="mr-2 h-4 w-4" />{t('appointments.book_now')}
            </Button>
          </div>
        )}
      </div>

      {/* Reschedule Dialog */}
      <Dialog open={!!rescheduleAppt} onOpenChange={(open) => !open && setRescheduleAppt(null)}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('appointments.reschedule_title')}</DialogTitle>
            <DialogDescription>
              {t('appointments.reschedule_desc')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('booking.select_date')}</label>
              <Select value={newDate} onValueChange={setNewDate}>
                <SelectTrigger className="w-full rounded-xl">
                  <SelectValue placeholder={t('booking.select_date')} />
                </SelectTrigger>
                <SelectContent>
                  {nextDates.map(d => (
                    <SelectItem key={d} value={d}>{formatDate(d)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('booking.select_time')}</label>
              <Select value={newTime} onValueChange={setNewTime}>
                <SelectTrigger className="w-full rounded-xl">
                  <SelectValue placeholder={t('booking.select_time')} />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleAppt(null)} className="rounded-xl">
              {t('booking.cancel')}
            </Button>
            <Button onClick={handleReschedule} disabled={rescheduling || !newDate || !newTime} className="rounded-xl">
              {rescheduling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('appointments.reschedule_btn')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyAppointmentsPage;
