import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MessageCircle, Trash2, ArrowLeft, Bot, CalendarDays, ExternalLink, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface ChatSession {
  id: string;
  condition_name: string | null;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export default function ChatHistoryPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchSessions();
  }, [user, navigate]);

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('id, condition_name, title, created_at, updated_at')
        .eq('user_id', user?.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching chat history:', error);
      toast.error(t('profile.error'));
    } finally {
      setLoading(false);
    }
  };

  const deleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setSessions((prev) => prev.filter((s) => s.id !== id));
      toast.success(t('chat_history.deleted', 'Chat session deleted'));
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error(t('chat_history.delete_error', 'Failed to delete session'));
    }
  };

  const openThread = (sessionData: ChatSession) => {
    navigate('/dermatologist-chat', {
      state: { sessionId: sessionData.id }
    });
  };

  return (
    <div className="min-h-screen bg-muted/30 pb-20">
      {/* Header */}
      <div className="bg-background border-b border-border/60 sticky top-14 z-30">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="-ml-2 h-9 w-9" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">{t('chat_history.title', 'Chat History')}</h1>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto max-w-3xl p-4 mt-4">
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl bg-muted" />)}
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center py-16 px-5 text-center gap-3">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <MessageCircle className="h-8 w-8 text-primary" />
              </div>
              <p className="text-base font-medium text-foreground">{t('chat_history.empty', 'No chat history found')}</p>
              <p className="text-sm text-muted-foreground max-w-sm mb-4">
                {t('chat_history.empty_desc', 'Ask questions about your skin condition and get expert advice from our AI.')}
              </p>
              <Button
                className="rounded-xl h-11 px-8"
                onClick={() => navigate('/dermatologist-chat')}
              >
                <Bot className="mr-2 h-5 w-5" />
                {t('chat_history.start_chat', 'Start New Chat')}
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {sessions.map((chatSession) => (
                <div key={chatSession.id} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <MessageCircle className="h-5 w-5 text-primary" />
                  </div>
                  
                  <div 
                    className="flex-1 min-w-0 text-left cursor-pointer"
                    onClick={() => openThread(chatSession)}
                  >
                    <p className="text-sm font-semibold text-foreground truncate mb-1">
                      {chatSession.title ?? t('chat_history.thread_title', 'Chat Session')}
                    </p>
                    <div className="flex items-center gap-2">
                      {chatSession.condition_name && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-md font-medium truncate max-w-[140px]">
                          {chatSession.condition_name}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground flex items-center">
                        {new Date(chatSession.updated_at).toLocaleDateString(undefined, {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-primary rounded-xl h-8 px-3"
                      onClick={() => openThread(chatSession)}
                    >
                      {t('chat_history.continue', 'Continue')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8 rounded-full"
                      onClick={(e) => deleteSession(chatSession.id, e)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
