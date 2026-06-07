import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Send, Bot, User, Loader2, Stethoscope, AlertTriangle, Calendar, Mic, StopCircle, Volume2, Pause, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { sendStreamRequest } from '@/lib/sse';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { AnalysisResult } from '@/types/index';
import { toast } from 'sonner';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  pending?: boolean;
  created_at?: string;
}

function buildScanContext(result?: AnalysisResult): string | undefined {
  if (!result) return undefined;
  const meds = result.medication_recommendations?.map((m) => m.name).join(', ') || 'none listed';
  return [
    `Condition: ${result.condition_name}`,
    `Severity: ${result.severity}`,
    `AI Confidence: ${result.confidence_score}%`,
    `Next Steps: ${result.next_steps}`,
    `Treatment: ${result.treatment_recommendations}`,
    `Medications: ${meds}`,
  ].join('\n');
}

function buildContents(messages: Message[]) {
  return messages
    .filter((m) => !m.pending)
    .map((m) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));
}

export default function DermatologistChatPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile } = useAuth();
  
  const state = location.state as { result?: AnalysisResult; sessionId?: string } | null;
  const scanResult = state?.result;
  const existingSessionId = state?.sessionId;
  const scanContext = buildScanContext(scanResult);

  const welcomeMsg: Message = {
    id: 'welcome',
    role: 'assistant',
    content: scanContext 
      ? t('chat.welcome_context', { name: profile?.full_name || user?.user_metadata?.full_name || 'User' }) 
      : t('chat.welcome_general', { name: profile?.full_name || user?.user_metadata?.full_name || 'User' }),
    created_at: new Date().toISOString(),
  };

  const [messages, setMessages] = useState<Message[]>(existingSessionId ? [] : [welcomeMsg]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [isTranscribing, setIsTranscribing] = useState(false);

  // TTS playing state
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // DB session tracking
  const sessionIdRef = useRef<string | null>(existingSessionId ?? null);

  // Load existing session if present
  useEffect(() => {
    if (!existingSessionId) return;
    const loadSession = async () => {
      const { data } = await supabase
        .from('chat_messages')
        .select('id, role, content, created_at')
        .eq('session_id', existingSessionId)
        .order('created_at', { ascending: true });
      if (data && data.length > 0) {
        setMessages(data as Message[]);
      } else {
        setMessages([welcomeMsg]);
      }
    };
    loadSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingSessionId]);

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setIsTranscribing(true);
        try {
          const formData = new FormData();
          formData.append('file', audioBlob, 'audio.webm');
          
          const { data, error } = await supabase.functions.invoke('speech-to-text', {
            body: formData,
          });

          if (error) throw error;
          if (data?.text) {
            setInput((prev) => prev ? `${prev} ${data.text}` : data.text);
          } else {
            toast.error('Could not transcribe audio');
          }
        } catch (error) {
          console.error('Transcription error:', error);
          toast.error('Failed to transcribe audio. Please try again.');
        } finally {
          setIsTranscribing(false);
          stream.getTracks().forEach(t => t.stop());
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Microphone error:', error);
      toast.error('Could not access microphone.');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handlePlayVoice = async (msg: Message) => {
    if (playingId === msg.id && audioRef.current) {
      const currentAudio = audioRef.current as HTMLAudioElement;
      if (isPaused) {
        currentAudio.play();
        setIsPaused(false);
      } else {
        currentAudio.pause();
        setIsPaused(true);
      }
      return;
    }

    // Stop current audio if playing a different one
    if (audioRef.current) {
      const currentAudio = audioRef.current as HTMLAudioElement;
      currentAudio.pause();
      try {
        currentAudio.src = "";
      } catch (e) {
        // ignore
      }
      audioRef.current = null;
    }

    try {
      setPlayingId(msg.id);
      setIsPaused(false);
      setIsAudioLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      let voiceId = '7fc631fd-bdc0-5d51-bda8-71f73db08ab9'; // Toluwa — warm, reassuring Nigerian female voice
      if (i18n.language === 'pcm') {
        voiceId = 'b0290b0f-85fd-5cae-aec8-f795135d6aa9'; // Femi — confident Nigerian male voice with dialect support
      }

      const res = await fetch(`${SUPABASE_URL}/functions/v1/aethex-tts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token || SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'X-Aethex-Key': 'ae_live_b9662ca3976f017141b3225bfbbef68e'
        },
        body: JSON.stringify({ input: msg.content, voice: voiceId })
      });

      if (!res.ok) throw new Error('Failed to generate audio');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      
      if (audioRef.current) {
        const currentAudio = audioRef.current as HTMLAudioElement;
        currentAudio.pause();
        try { currentAudio.src = ""; } catch (e) { /* ignore */ }
        audioRef.current = null;
      }
      
      const audio = new Audio(url);
      audioRef.current = audio;
      
      audio.onplay = () => setIsPaused(false);
      audio.onpause = () => setIsPaused(true);
      
      audio.onended = () => {
        setPlayingId(null);
        setIsPaused(false);
        URL.revokeObjectURL(url);
      };
      
      await audio.play();
      setIsAudioLoading(false);
    } catch (error) {
      console.error('TTS error:', error);
      toast.error('Failed to play voice response.');
      setPlayingId(null);
      setIsAudioLoading(false);
    }
  };

  const persistSession = useCallback(async (userMsg: Message, assistantMsg: Message) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return; // Not logged in — no persistence

    // Create session on first real message
    if (!sessionIdRef.current) {
      const title = userMsg.content.slice(0, 80);
      const { data } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: session.user.id,
          condition_name: scanResult?.condition_name ?? null,
          scan_context: scanContext ?? null,
          title,
        })
        .select('id')
        .single();
      if (data?.id) sessionIdRef.current = data.id;
    }

    const sid = sessionIdRef.current;
    if (!sid) return;

    // Persist both messages
    await supabase.from('chat_messages').insert([
      { session_id: sid, user_id: session.user.id, role: 'user',      content: userMsg.content },
      { session_id: sid, user_id: session.user.id, role: 'assistant', content: assistantMsg.content },
    ]);
  }, [scanContext, scanResult]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || streaming) return;
    setInput('');

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: text, created_at: new Date().toISOString() };
    const assistantMsg: Message = { id: crypto.randomUUID(), role: 'assistant', content: '', pending: true, created_at: new Date().toISOString() };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setStreaming(true);

    abortRef.current = new AbortController();

    // Build history excluding welcome and pending
    const history = buildContents([...messages, userMsg]);

    let accumulated = '';

    await sendStreamRequest({
      functionUrl: `${SUPABASE_URL}/functions/v1/dermatologist-chat`,
      requestBody: { contents: history, scanContext },
      supabaseAnonKey: SUPABASE_ANON_KEY,
      signal: abortRef.current.signal,
      onData: (data) => {
        try {
          const parsed = JSON.parse(data);
          const chunk = parsed?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
          accumulated += chunk;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsg.id ? { ...m, content: accumulated, pending: false } : m
            )
          );
        } catch { /* skip incomplete frame */ }
      },
      onComplete: () => {
        setStreaming(false);
        setMessages((prev) => {
          const updated = prev.map((m) =>
            m.id === assistantMsg.id ? { ...m, pending: false } : m
          );
          // Persist after state is finalized
          const finalAssistant = updated.find((m) => m.id === assistantMsg.id);
          if (finalAssistant) {
            persistSession(userMsg, finalAssistant);
          }
          return updated;
        });
      },
      onError: (err) => {
        console.error('Chat error:', err);
        setStreaming(false);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id
              ? { ...m, content: t('chat.error'), pending: false }
              : m
          )
        );
      },
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const exportChat = () => {
    // Dynamic import to avoid missing dependency error
    import('jspdf').then(({ default: jsPDF }) => {
      const doc = new jsPDF();
      let y = 10;
      doc.setFontSize(16);
      doc.text('DermaScan AI - Chat Transcript', 10, y);
      y += 10;
      
      doc.setFontSize(10);
      messages.forEach((msg) => {
        if (y > 280) {
          doc.addPage();
          y = 10;
        }
        const role = msg.role === 'user' ? 'You' : 'AI';
        const time = msg.created_at ? new Date(msg.created_at).toLocaleString() : '';
        doc.setFont('helvetica', 'bold');
        doc.text(`${role} (${time}):`, 10, y);
        y += 5;
        
        doc.setFont('helvetica', 'normal');
        const lines = doc.splitTextToSize(msg.content, 180);
        doc.text(lines, 10, y);
        y += lines.length * 5 + 5;
      });
      
      doc.save('chat-transcript.pdf');
    }).catch(err => {
      console.error('Failed to load jsPDF', err);
      toast.error('Failed to export chat transcript');
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="gradient-hero px-4 pt-6 pb-5 shrink-0 relative">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-white/80 hover:text-white text-sm mb-3 transition-colors"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />{t('booking.back')}
        </button>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-white text-balance leading-tight">{t('chat.title')}</h1>
              <p className="text-white/70 text-xs text-pretty">{t('chat.subtitle')}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white/80 hover:text-white hover:bg-white/10 h-9 w-9 rounded-full"
            onClick={exportChat}
            title="Export Chat"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
        {scanResult && (
          <div className="mt-3 bg-white/10 rounded-xl px-3 py-2 flex items-center gap-2">
            <Stethoscope className="h-3.5 w-3.5 text-white/80 shrink-0" />
            <span className="text-white/90 text-xs font-medium truncate">
              {scanResult.condition_name} — {scanResult.severity}
            </span>
            <Badge className="ml-auto bg-white/20 text-white text-xs border-0 shrink-0">
              {scanResult.confidence_score}%
            </Badge>
          </div>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-4">
        <div className="max-w-2xl mx-auto space-y-4 pb-2">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                msg.role === 'user' ? 'bg-primary' : 'bg-muted border border-border'
              }`}>
                {msg.role === 'user'
                  ? <User className="h-3.5 w-3.5 text-primary-foreground" />
                  : <Bot className="h-3.5 w-3.5 text-muted-foreground" />}
              </div>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-tr-sm'
                  : 'bg-card border border-border text-foreground rounded-tl-sm'
              }`}>
                {msg.pending && !msg.content
                  ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  : <span className="whitespace-pre-wrap text-pretty">{msg.content}</span>}
              </div>
              
              {/* Voice play button for assistant */}
              {msg.role === 'assistant' && !msg.pending && (
                <div className="flex items-center self-end mt-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handlePlayVoice(msg)}
                    className="h-6 w-6 rounded-full text-muted-foreground hover:bg-muted/50"
                  >
                    {playingId === msg.id 
                      ? (isAudioLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : (isPaused ? <Volume2 className="h-3 w-3" /> : <Pause className="h-3 w-3" />))
                      : <Volume2 className="h-3 w-3" />}
                  </Button>
                </div>
              )}
              
              {!msg.pending && msg.created_at && (
                <div className={`text-[10px] text-muted-foreground/60 ${msg.role === 'user' ? 'text-right mt-0.5' : 'text-left mt-0.5'}`}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Disclaimer + Book CTA */}
      <div className="px-4 pb-2 max-w-2xl mx-auto w-full shrink-0">
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 flex items-start gap-2 mb-3">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-700">{t('chat.disclaimer')}</p>
        </div>
        <Button
          variant="outline"
          className="w-full rounded-xl h-10 font-semibold mb-3 border-primary text-primary hover:bg-primary/5"
          onClick={() => navigate('/book-appointment', { state: { result: scanResult } })}
        >
          <Calendar className="mr-2 h-4 w-4" />
          {t('chat.book_appointment')}
        </Button>
      </div>

      {/* Input */}
      <div className="px-4 pb-6 pt-1 border-t border-border bg-background shrink-0">
        <div className="max-w-2xl mx-auto flex gap-2 items-end">
          <Button
            variant="outline"
            size="icon"
            className={`h-11 w-11 rounded-xl shrink-0 border-border ${
              isRecording ? 'bg-red-50 border-red-200 text-red-500' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            disabled={streaming || isTranscribing}
          >
            {isTranscribing ? <Loader2 className="h-5 w-5 animate-spin" /> :
             isRecording ? <StopCircle className="h-5 w-5 animate-pulse" /> :
             <Mic className="h-5 w-5" />}
          </Button>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isRecording ? 'Recording...' : t('chat.placeholder')}
            rows={1}
            className="resize-none rounded-xl text-sm flex-1 min-h-[44px] max-h-32 overflow-y-auto"
            disabled={streaming}
          />
          <Button
            size="icon"
            className="h-11 w-11 rounded-xl shrink-0"
            onClick={sendMessage}
            disabled={streaming || !input.trim()}
          >
            {streaming
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <Send className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-2">
          Enter ↵ to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
