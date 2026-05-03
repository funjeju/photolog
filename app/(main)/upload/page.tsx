'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useRouter } from 'next/navigation';
import { Upload, ImagePlus, CheckCircle, Circle, Loader2, X, MapPin, Camera, Clock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import exifr from 'exifr';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, auth } from '@/lib/firebase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils/cn';
import type { PostMode } from '@/types/post';

type PhotoFile = {
  file: File;
  preview: string;
  capturedAt: Date | null;
  hasExif: boolean;
  hasGps: boolean;
  gpsAddress: string | null;
  cameraModel: string | null;
};

type Step = 1 | 2 | 3 | 4;

type ProgressStep = {
  label: string;
  done: boolean;
  active: boolean;
};

const TONES = {
  blog: [
    { value: '정보형', label: '정보형 — 사실 위주, 객관적' },
    { value: '감성형', label: '감성형 — 분위기 강조' },
    { value: '리뷰형', label: '리뷰형 — 평가 중심' },
  ],
  diary: [
    { value: '기본', label: '기본 — 자연스러운 일기체' },
    { value: '감성', label: '감성 — 감정 묘사 풍부' },
    { value: '간결', label: '간결 — 짧고 담백' },
  ],
};

export default function UploadPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const [mode, setMode] = useState<PostMode>('blog');
  const [tone, setTone] = useState('정보형');
  const [title, setTitle] = useState('');
  const [generating, setGenerating] = useState(false);
  const [progressSteps, setProgressSteps] = useState<ProgressStep[]>([]);

  // exifr는 GPSLatitude를 [도, 분, 초] 배열 또는 십진수로 반환 — 둘 다 처리
  function dmsToDecimal(val: number | number[] | undefined): number | null {
    if (val == null) return null;
    if (typeof val === 'number') return val;
    if (Array.isArray(val) && val.length >= 3) return val[0] + val[1] / 60 + val[2] / 3600;
    return null;
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const processed = await Promise.all(
      acceptedFiles.slice(0, 30).map(async (file) => {
        const preview = URL.createObjectURL(file);
        try {
          const exif = await exifr.parse(file, {
            pick: ['DateTimeOriginal', 'GPSLatitude', 'GPSLongitude', 'Make', 'Model'],
          });
          const model = exif?.Model ? String(exif.Model).trim() : (exif?.Make ? String(exif.Make).trim() : null);

          const lat = dmsToDecimal(exif?.GPSLatitude);
          const lng = dmsToDecimal(exif?.GPSLongitude);
          const hasGps = lat !== null && lng !== null;

          let gpsAddress: string | null = null;
          if (hasGps) {
            try {
              const geoRes = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ko`,
                { headers: { 'User-Agent': 'PhotoLog/1.0' } }
              );
              if (geoRes.ok) {
                const geo = await geoRes.json();
                const a = geo.address;
                gpsAddress =
                  a?.tourism || a?.amenity || a?.shop ||
                  a?.road ||
                  (a?.city || a?.town || a?.village || a?.county) || null;
              }
            } catch { /* 무시 */ }
          }

          return {
            file,
            preview,
            capturedAt: exif?.DateTimeOriginal ? new Date(exif.DateTimeOriginal) : null,
            hasExif: !!exif?.DateTimeOriginal,
            hasGps,
            gpsAddress,
            cameraModel: model,
          };
        } catch {
          return { file, preview, capturedAt: null, hasExif: false, hasGps: false, gpsAddress: null, cameraModel: null };
        }
      })
    );

    const noExif = processed.filter((p) => !p.hasExif);
    if (noExif.length > 0) {
      toast.warning(`${noExif.length}장의 사진에 EXIF 정보가 없어요. 카메라로 직접 찍은 사진을 올려주세요.`);
    }

    const valid = processed.filter((p) => p.hasExif);
    const sorted = valid.sort((a, b) =>
      (a.capturedAt?.getTime() ?? 0) - (b.capturedAt?.getTime() ?? 0)
    );

    setPhotos(sorted);
    if (sorted.length >= 3) setStep(2);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/heic': [] },
    maxFiles: 30,
  });

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleGenerate() {
    if (photos.length < 3) {
      toast.error('사진을 최소 3장 올려주세요.');
      return;
    }
    setGenerating(true);
    setStep(4);

    const steps: ProgressStep[] = [
      { label: 'EXIF 추출 중...', done: false, active: true },
      { label: '위치 정보 매칭 중...', done: false, active: false },
      { label: 'OCR 분석 중...', done: false, active: false },
      { label: 'AI 글 생성 중...', done: false, active: false },
    ];
    setProgressSteps([...steps]);

    try {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error('로그인이 필요합니다.');

      const postId = `post_${Date.now()}`;

      // 업로드 + URL 수집
      const photoUrls: string[] = [];
      for (let i = 0; i < photos.length; i++) {
        const { file } = photos[i];
        const storageRef = ref(storage, `users/${uid}/posts/${postId}/${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        photoUrls.push(url);
      }

      // EXIF 완료
      steps[0] = { ...steps[0], done: true, active: false };
      steps[1] = { ...steps[1], active: true };
      setProgressSteps([...steps]);

      // API 호출
      const token = await auth.currentUser?.getIdToken();
      steps[1] = { ...steps[1], done: true, active: false };
      steps[2] = { ...steps[2], active: true };
      setProgressSteps([...steps]);

      await new Promise((r) => setTimeout(r, 500));

      steps[2] = { ...steps[2], done: true, active: false };
      steps[3] = { ...steps[3], active: true };
      setProgressSteps([...steps]);

      const res = await fetch('/api/posts/create', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mode, photoUrls, options: { tone, title: title || undefined } }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? '글 생성 실패');
      }

      const { postId: createdPostId } = await res.json();

      steps[3] = { ...steps[3], done: true, active: false };
      setProgressSteps([...steps]);

      toast.success('글이 생성됐어요!');
      router.push(`/post/${createdPostId}`);
    } catch (err) {
      toast.error((err as Error).message || '생성에 실패했어요. 다시 시도해주세요.');
      setGenerating(false);
      setStep(3);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">새 글 작성</h1>
        <p className="text-sm text-foreground-muted mt-1">사진을 올리면 AI가 자동으로 글을 써드려요</p>
      </div>

      {/* Step 1 — 사진 업로드 */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-base font-semibold text-foreground mb-4">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-primary-500 text-xs font-bold mr-2">1</span>
            사진을 올려주세요
          </h2>

          <div
            {...getRootProps()}
            className={cn(
              'border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors',
              isDragActive
                ? 'border-primary-300 bg-primary-50'
                : 'border-border hover:border-primary-200 hover:bg-background-subtle'
            )}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100">
                <ImagePlus className="h-5 w-5 text-primary-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {isDragActive ? '여기에 놓아주세요' : '드래그 앤 드롭 또는 클릭하여 선택'}
                </p>
                <p className="text-xs text-foreground-muted mt-1">
                  JPEG, PNG, HEIC — 최소 3장, 최대 30장
                </p>
              </div>
            </div>
          </div>

          {/* 미리보기 + EXIF */}
          {photos.length > 0 && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-foreground-muted">{photos.length}장 선택됨 (시간순 정렬)</p>
                <div className="flex items-center gap-2 text-xs">
                  <span className="flex items-center gap-1 text-primary-400">
                    <CheckCircle className="h-3 w-3" />
                    EXIF {photos.filter((p) => p.hasExif).length}장
                  </span>
                  {photos.filter((p) => !p.hasExif).length > 0 && (
                    <span className="flex items-center gap-1 text-amber-500">
                      <AlertTriangle className="h-3 w-3" />
                      없음 {photos.filter((p) => !p.hasExif).length}장
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {photos.map((photo, i) => (
                  <div
                    key={i}
                    className={cn(
                      'relative rounded-xl overflow-hidden border-2 bg-white transition-all',
                      photo.hasExif ? 'border-primary-200' : 'border-amber-200'
                    )}
                  >
                    {/* 썸네일 */}
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img
                        src={photo.preview}
                        alt={`photo-${i}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={(e) => { e.stopPropagation(); removePhoto(i); }}
                        className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"
                      >
                        <X className="h-3 w-3 text-white" />
                      </button>
                      <span className="absolute bottom-1.5 left-1.5 text-xs text-white bg-black/60 rounded px-1.5 py-0.5 font-medium">
                        {i + 1}
                      </span>
                    </div>

                    {/* EXIF 정보 */}
                    <div className="p-2.5 space-y-1">
                      {photo.hasExif ? (
                        <>
                          {photo.capturedAt && (
                            <div className="flex items-center gap-1.5 text-xs text-foreground-muted">
                              <Clock className="h-3 w-3 flex-shrink-0 text-primary-300" />
                              <span>
                                {photo.capturedAt.toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })}
                                {' '}
                                {photo.capturedAt.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 text-xs">
                            <MapPin className={cn('h-3 w-3 flex-shrink-0', photo.hasGps ? 'text-primary-300' : 'text-foreground-subtle')} />
                            <span className={cn('truncate', photo.hasGps ? 'text-foreground-muted' : 'text-foreground-subtle')}>
                              {photo.hasGps ? (photo.gpsAddress ?? 'GPS 있음') : 'GPS 없음'}
                            </span>
                          </div>
                          {photo.cameraModel && (
                            <div className="flex items-center gap-1.5 text-xs text-foreground-muted">
                              <Camera className="h-3 w-3 flex-shrink-0 text-primary-300" />
                              <span className="truncate">{photo.cameraModel}</span>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-amber-500">
                          <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                          <span>EXIF 없음 — 제외됩니다</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 2 — 모드 선택 */}
      {step >= 2 && (
        <Card>
          <CardContent className="p-6">
            <h2 className="text-base font-semibold text-foreground mb-4">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-primary-500 text-xs font-bold mr-2">2</span>
              어떤 형태로 만들까요?
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {(['blog', 'diary'] as PostMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setTone(TONES[m][0].value); setStep(3); }}
                  className={cn(
                    'flex flex-col items-center gap-2 p-5 rounded-lg border-2 transition-all',
                    mode === m && step >= 3
                      ? 'border-primary-300 bg-primary-50'
                      : 'border-border hover:border-primary-200'
                  )}
                >
                  <span className="text-2xl">{m === 'blog' ? '📝' : '📔'}</span>
                  <span className="font-semibold text-foreground">
                    {m === 'blog' ? '블로그' : '다이어리'}
                  </span>
                  <span className="text-xs text-foreground-muted">
                    {m === 'blog' ? '부업·발행용' : '개인 기록용'}
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3 — 톤 + 제목 */}
      {step >= 3 && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-base font-semibold text-foreground">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-primary-500 text-xs font-bold mr-2">3</span>
              톤을 선택해주세요
            </h2>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TONES[mode].map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div>
              <Input
                placeholder="제목 (비워두면 AI가 자동 생성)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <Button
              className="w-full gap-2 text-base h-12"
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> 생성 중...</>
              ) : (
                <><Upload className="h-4 w-4" /> AI로 생성하기</>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 4 — 생성 진행 */}
      {step === 4 && progressSteps.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h2 className="text-base font-semibold text-foreground mb-4">글 생성 중...</h2>
            <div className="space-y-3">
              {progressSteps.map((s, i) => (
                <div key={i} className="flex items-center gap-3">
                  {s.done ? (
                    <CheckCircle className="h-4 w-4 text-primary-500 shrink-0" />
                  ) : s.active ? (
                    <Loader2 className="h-4 w-4 text-primary-300 animate-spin shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 text-foreground-subtle shrink-0" />
                  )}
                  <span className={cn(
                    'text-sm',
                    s.done ? 'text-foreground line-through' :
                    s.active ? 'text-foreground font-medium' :
                    'text-foreground-subtle'
                  )}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
