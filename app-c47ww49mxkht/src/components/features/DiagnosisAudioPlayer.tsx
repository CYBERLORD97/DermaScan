import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/db/supabase';
import type { AnalysisResult } from '@/types/index';
import { Volume2, Loader2, Play, Pause, RotateCcw, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AudioLang {
  code: string;
  label: string;
  flag: string;
}

const AUDIO_LANGUAGES: AudioLang[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'yo', label: 'Yorùbá', flag: '🇳🇬' },
  { code: 'ig', label: 'Igbo', flag: '🇳🇬' },
  { code: 'ha', label: 'Hausa', flag: '🇳🇬' },
];

/** Build a concise spoken diagnosis summary per language */
function buildDiagnosisScript(result: AnalysisResult, langCode: string): string {
  const medNames = result.medication_recommendations.slice(0, 3).map((m) => m.name).join(', ');

  switch (langCode) {
    case 'yo':
      return (
        `Itupalẹ awọ ara fihan pe o le ni ${result.condition_name}. ` +
        `Ipele ti o le to: ${result.severity === 'mild' ? 'irẹlẹ' : result.severity === 'moderate' ? 'dede' : 'le'}. ` +
        `Ipele igbagbọ AI: ogorun ${result.confidence_score}. ` +
        `Awọn igbesẹ ti o tẹle: ${result.next_steps}. ` +
        `Itọju ti a ṣeduro: ${result.treatment_recommendations}. ` +
        (medNames ? `Awọn oogun ti a daba: ${medNames}.` : '') +
        ` Jọwọ kan si dokita fun ayẹwo deede.`
      );
    case 'ig':
      return (
        `Nyocha akpụkpọ ahụ gị gosipụtara na ọnọdụ gị nwere ike bụ ${result.condition_name}. ` +
        `Ogo ike ya: ${result.severity === 'mild' ? 'obere' : result.severity === 'moderate' ? 'nke nkezi' : 'ike nnọọ'}. ` +
        `Ntụkwasị obi AI: pasent ${result.confidence_score}. ` +
        `Ihe iga gaa n'ihu: ${result.next_steps}. ` +
        `Ọgwụgwọ a na-atụ aro: ${result.treatment_recommendations}. ` +
        (medNames ? `Ọgwụ a tụpụtara: ${medNames}.` : '') +
        ` Biko hụ dọkịta maka nyocha ziri ezi.`
      );
    case 'ha':
      return (
        `Nazarin fatar ku ya nuna cewa kuna iya fama da ${result.condition_name}. ` +
        `Matakin tsanani: ${result.severity === 'mild' ? 'mai sauƙi' : result.severity === 'moderate' ? 'matsakaici' : 'mai tsanani'}. ` +
        `Matakin tabbacin AI: kashi ${result.confidence_score}. ` +
        `Matakin gaba: ${result.next_steps}. ` +
        `Maganin da ake ba da shawarar: ${result.treatment_recommendations}. ` +
        (medNames ? `Magunguna da aka ba da shawara: ${medNames}.` : '') +
        ` Da fatan za a tuntubi likita don bincike daidai.`
      );
    default: // 'en'
      return (
        `Your skin analysis indicates a possible condition of ${result.condition_name}. ` +
        `Severity level: ${result.severity}. ` +
        `AI confidence score: ${result.confidence_score} percent. ` +
        `Next steps: ${result.next_steps}. ` +
        `Recommended treatment: ${result.treatment_recommendations}. ` +
        (medNames ? `Suggested medications: ${medNames}.` : '') +
        ` Please consult a dermatologist for a professional diagnosis.`
      );
  }
}

interface DiagnosisAudioPlayerProps {
  result: AnalysisResult;
}

export default function DiagnosisAudioPlayer({ result }: DiagnosisAudioPlayerProps) {
  const { t } = useTranslation();
  const [selectedLang, setSelectedLang] = useState<AudioLang>(AUDIO_LANGUAGES[0]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Cache per language so we don't re-generate on re-select
  const cacheRef = useRef<Record<string, string>>({});

  const handleGenerate = async (lang: AudioLang) => {
    setSelectedLang(lang);
    setError(null);
    setIsPlaying(false);
    setProgress(0);

    // Use cached URL if available
    if (cacheRef.current[lang.code]) {
      setAudioUrl(cacheRef.current[lang.code]);
      return;
    }

    setGenerating(true);
    setAudioUrl(null);
    try {
      const text = buildDiagnosisScript(result, lang.code);
      const { data, error: fnError } = await supabase.functions.invoke('text-to-speech', {
        body: { input: text, voice: 'heart', response_format: 'mp3' },
      });
      if (fnError) {
        const msg = await fnError?.context?.text?.();
        throw new Error(msg || fnError.message);
      }
      cacheRef.current[lang.code] = data.audioUrl;
      setAudioUrl(data.audioUrl);
    } catch (e) {
      setError(t('audio.error_generate'));
      console.error('TTS error:', e);
    } finally {
      setGenerating(false);
    }
  };

  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
  };

  const handleRestart = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    audio.play();
  };

  const handleLangSelect = (lang: AudioLang) => {
    if (lang.code === selectedLang.code && audioUrl) return; // already loaded
    handleGenerate(lang);
  };

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Volume2 className="h-4 w-4 text-primary shrink-0" />
        <h2 className="font-bold text-sm text-foreground">{t('audio.title')}</h2>
      </div>

      {/* Language selector + Generate button */}
      <div className="flex items-center gap-2 mb-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="flex items-center gap-1.5 rounded-xl h-10 px-3 min-w-0"
              disabled={generating}
            >
              <span className="text-base leading-none">{selectedLang.flag}</span>
              <span className="text-sm font-medium">{selectedLang.label}</span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground ml-0.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="rounded-xl">
            {AUDIO_LANGUAGES.map((lang) => (
              <DropdownMenuItem
                key={lang.code}
                className="flex items-center gap-2 cursor-pointer"
                onSelect={() => handleLangSelect(lang)}
              >
                <span className="text-base">{lang.flag}</span>
                <span className="text-sm">{lang.label}</span>
                {cacheRef.current[lang.code] && (
                  <span className="ml-auto text-xs text-primary">✓</span>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          className="rounded-xl h-10 px-4 font-semibold flex-1"
          onClick={() => handleGenerate(selectedLang)}
          disabled={generating}
        >
          {generating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('audio.generating')}
            </>
          ) : (
            <>
              <Volume2 className="mr-2 h-4 w-4" />
              {audioUrl ? t('audio.regenerate') : t('audio.listen')}
            </>
          )}
        </Button>
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-destructive mb-3">{error}</p>
      )}

      {/* Audio player */}
      {audioUrl && !generating && (
        <div className="space-y-2">
          {/* Hidden native audio element */}
          <audio
            ref={audioRef}
            src={audioUrl}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => { setIsPlaying(false); setProgress(100); }}
            onTimeUpdate={() => {
              const audio = audioRef.current;
              if (audio && audio.duration) {
                setProgress((audio.currentTime / audio.duration) * 100);
              }
            }}
          />
          {/* Custom playback controls */}
          <div className="flex items-center gap-3">
            <Button
              size="icon"
              className="h-10 w-10 rounded-full shrink-0"
              onClick={handlePlayPause}
            >
              {isPlaying
                ? <Pause className="h-4 w-4" />
                : <Play className="h-4 w-4 ml-0.5" />}
            </Button>
            {/* Progress bar */}
            <div
              className="flex-1 h-2 bg-muted rounded-full overflow-hidden cursor-pointer"
              onClick={(e) => {
                const audio = audioRef.current;
                if (!audio || !audio.duration) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const ratio = (e.clientX - rect.left) / rect.width;
                audio.currentTime = ratio * audio.duration;
              }}
            >
              <div
                className="h-full bg-primary rounded-full transition-all duration-150"
                style={{ width: `${progress}%` }}
              />
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 rounded-full shrink-0 text-muted-foreground hover:text-foreground"
              onClick={handleRestart}
              title={t('audio.restart')}
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {t('audio.playing_in')} <span className="font-medium text-foreground">{selectedLang.flag} {selectedLang.label}</span>
          </p>
        </div>
      )}
    </div>
  );
}
