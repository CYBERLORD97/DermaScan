import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Camera, Upload, X, Loader2, ImagePlus, MessageSquare } from 'lucide-react';
import { ProcessingOverlay, type OverlayMode } from '@/components/common/ProcessingOverlay';
import { useTranslation } from 'react-i18next';

type ProcessStep = -1 | 0 | 1 | 2;

export default function PhotoInputPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [processStep, setProcessStep] = useState<ProcessStep>(-1);
  const [overlayMode, setOverlayMode] = useState<OverlayMode>('image');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const isProcessing = processStep >= 0;

  const processFile = (selected: File) => {
    if (!['image/jpeg','image/png','image/webp','image/gif','image/avif'].includes(selected.type)) {
      toast.error(t('photo.error_format')); return;
    }
    if (selected.size > 5 * 1024 * 1024) { toast.error(t('photo.error_size')); return; }
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sel = e.target.files?.[0];
    if (sel) processFile(sel);
  };

  const compressImage = async (f: File): Promise<File> => {
    if (f.size <= 1024 * 1024) return f;
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(f);
      img.onload = () => {
        URL.revokeObjectURL(url);
        let { width, height } = img;
        const maxDim = 1080;
        if (width > maxDim || height > maxDim) {
          const scale = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Canvas not supported')); return; }
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (!blob) { reject(new Error('Compression failed')); return; }
          resolve(new File([blob], f.name.replace(/\.[^.]+$/, '.webp'), { type: 'image/webp' }));
        }, 'image/webp', 0.8);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = url;
    });
  };

  const clearImage = () => {
    setPreviewUrl(null); setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!user) return;
    const hasImage = !!file;
    const hasText = description.trim().length > 0;
    if (!hasImage && !hasText) { toast.error(t('photo.error_empty')); return; }
    setOverlayMode(hasImage ? 'image' : 'text');
    try {
      let imageUrl: string | undefined;
      setProcessStep(0);
      if (hasImage && file) {
        let uploadFile = file;
        if (file.size > 1024 * 1024) uploadFile = await compressImage(file);
        const ext = uploadFile.name.split('.').pop()?.toLowerCase() || 'jpg';
        const fileName = `skin_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
        const { data: uploadData, error: uploadError } = await supabase.storage.from('skin-images').upload(fileName, uploadFile, { contentType: uploadFile.type });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('skin-images').getPublicUrl(uploadData.path);
        imageUrl = urlData.publicUrl;
      } else {
        await new Promise((r) => setTimeout(r, 600));
      }
      setProcessStep(1);
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke('analyze-skin', { body: { imageUrl, description: description.trim() || undefined } });
      if (analysisError) {
        let msg = analysisError.message;
        try {
          const raw = await analysisError.context?.text();
          if (raw) {
            const parsed = JSON.parse(raw);
            msg = parsed?.error?.message || parsed?.error || raw;
          }
        } catch { /* keep original message */ }
        throw new Error(msg);
      }
      if (analysisData?.error) {
        const errField = analysisData.error;
        throw new Error(typeof errField === 'object' ? (errField?.message || t('photo.error_analysis')) : errField);
      }
      setProcessStep(2);
      await supabase.from('analyses').insert({
        user_id: user.id,
        image_url: imageUrl ?? null,
        condition_name: analysisData.condition_name,
        severity: analysisData.severity,
        confidence_score: analysisData.confidence_score,
        treatment_recommendations: analysisData.treatment_recommendations,
        medication_recommendations: analysisData.medication_recommendations,
      });
      await new Promise((r) => setTimeout(r, 700));
      setProcessStep(-1);
      navigate('/analysis-results', { state: { result: analysisData, imageUrl } });
    } catch (err: unknown) {
      setProcessStep(-1);
      const msg = (err as Error).message || '';
      // Rate limit: show friendly translated message
      if (msg.includes('429') || msg.includes('request limit') || msg.includes('请求数限制') || msg.toLowerCase().includes('rate limit')) {
        toast.error(t('photo.error_rate_limit'));
      } else {
        toast.error(msg || t('photo.error_analysis'));
      }
    }
  };

  return (
    <>
      {isProcessing && <ProcessingOverlay step={processStep} mode={overlayMode} />}
      <div className="min-h-screen bg-background">
        <div className="gradient-hero px-4 pt-8 pb-12 text-center">
          <h1 className="text-2xl font-bold text-white text-balance">{t('photo.title')}</h1>
          <p className="text-white/75 text-sm mt-1 text-pretty">{t('photo.subtitle')}</p>
        </div>
        <div className="max-w-lg mx-auto px-4 -mt-6 pb-10">
          <div className="bg-card rounded-2xl shadow-md border border-border overflow-hidden">
            <Tabs defaultValue="image" className="w-full">
              <TabsList className="w-full rounded-none border-b border-border h-12 bg-card p-0 gap-0">
                <TabsTrigger value="image" className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=inactive]:text-muted-foreground font-medium text-sm">
                  <Camera className="mr-2 h-4 w-4" />{t('photo.tab_photo')}
                </TabsTrigger>
                <TabsTrigger value="text" className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=inactive]:text-muted-foreground font-medium text-sm">
                  <MessageSquare className="mr-2 h-4 w-4" />{t('photo.tab_describe')}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="image" className="mt-0 p-5 space-y-4">
                {!previewUrl ? (
                  <>
                    <div className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:bg-muted/40 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                      onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) processFile(f); }}
                      onDragOver={(e) => e.preventDefault()}>
                      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                        <ImagePlus className="h-7 w-7 text-primary" />
                      </div>
                      <p className="text-sm font-semibold text-foreground">{t('photo.click_drag')}</p>
                      <p className="text-xs text-muted-foreground mt-1">{t('photo.format_hint')}</p>
                    </div>
                    {/* Gallery input — no capture, opens file picker / gallery */}
                    <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" className="hidden" onChange={handleFileChange} />
                    {/* Camera input — capture="environment" opens rear camera directly on mobile */}
                    <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="h-px flex-1 bg-border" /><span>{t('photo.or')}</span><span className="h-px flex-1 bg-border" />
                    </div>
                    <Button variant="outline" className="w-full rounded-xl h-11" onClick={() => cameraInputRef.current?.click()}>
                      <Camera className="mr-2 h-4 w-4" />{t('photo.open_camera')}
                    </Button>
                  </>
                ) : (
                  <div className="relative">
                    <img src={previewUrl} alt="Skin preview" className="w-full aspect-square object-cover rounded-xl border" />
                    <button onClick={clearImage} className="absolute top-2 right-2 p-1.5 bg-background/90 rounded-full shadow hover:bg-background">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="desc-image" className="text-xs font-normal text-muted-foreground">{t('photo.optional_label')}</Label>
                  <Textarea id="desc-image" placeholder={t('photo.optional_placeholder')} value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="resize-none text-sm rounded-xl" />
                </div>
                <Button className="w-full rounded-xl h-11 font-semibold" onClick={handleSubmit} disabled={isProcessing || (!file && !description.trim())}>
                  {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                  {file ? t('photo.analyze_photo') : t('photo.analyze_desc')}
                </Button>
              </TabsContent>
              <TabsContent value="text" className="mt-0 p-5 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="desc-text" className="text-sm font-medium text-foreground">{t('photo.describe_label')}</Label>
                  <Textarea id="desc-text" placeholder={t('photo.describe_placeholder')} value={description} onChange={(e) => setDescription(e.target.value)} rows={7} className="resize-none text-sm rounded-xl" />
                  <p className="text-xs text-muted-foreground">{t('photo.describe_hint')}</p>
                </div>
                <Button className="w-full rounded-xl h-11 font-semibold" onClick={handleSubmit} disabled={isProcessing || !description.trim()}>
                  <MessageSquare className="mr-2 h-4 w-4" />{t('photo.analyze_desc')}
                </Button>
              </TabsContent>
            </Tabs>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-4">{t('common.not_substitute')}</p>
        </div>
      </div>
    </>
  );
}
