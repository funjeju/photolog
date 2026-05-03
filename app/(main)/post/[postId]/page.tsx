'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/client';
import { toast } from 'sonner';
import { Save, Video, Download, MapPin, Camera, Clock, Mic, Layers, Clapperboard, Rocket, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { BGM_BY_CATEGORY, type BgmKey } from '@/lib/video/bgm';
import type { Post, Photo, Scene } from '@/types/post';

const GENERATING_STEPS = [
  { icon: Mic,         label: '목소리를 입히고 있어요',      sub: 'Gemini TTS로 나레이션 생성 중' },
  { icon: Layers,      label: '씬을 구성하고 있어요',        sub: '사진과 음성을 타임라인에 배치 중' },
  { icon: Clapperboard,label: 'Lambda에 렌더링 요청 중',     sub: 'AWS ap-northeast-2 서버 연결 중' },
  { icon: Rocket,      label: '렌더링이 시작됐어요!',        sub: '내 영상 탭에서 완성본을 확인하세요' },
];

function VideoGeneratingOverlay({
  photos,
  totalDuration,
}: {
  photos: Photo[];
  totalDuration: number;
}) {
  const [progress, setProgress] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);
  const stripRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // progress: 0→90 over ~50s (leaves final 90→100 for when API returns)
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 90) return p;
        // faster at start, slows down as we approach 90
        const inc = p < 40 ? 1.2 : p < 70 ? 0.6 : 0.2;
        return Math.min(p + inc, 90);
      });
    }, 600);
    return () => clearInterval(interval);
  }, []);

  // step transitions based on progress
  useEffect(() => {
    if (progress < 35) setStepIdx(0);
    else if (progress < 65) setStepIdx(1);
    else if (progress < 85) setStepIdx(2);
    else setStepIdx(3);
  }, [progress]);

  // film strip infinite scroll
  useEffect(() => {
    const el = stripRef.current;
    if (!el || photos.length === 0) return;
    let offset = 0;
    const frame = () => {
      offset += 0.5;
      const maxScroll = el.scrollWidth / 2;
      if (offset >= maxScroll) offset = 0;
      el.style.transform = `translateX(-${offset}px)`;
      raf = requestAnimationFrame(frame);
    };
    let raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [photos]);

  const step = GENERATING_STEPS[stepIdx];
  const StepIcon = step.icon;
  const thumbnails = [...photos, ...photos]; // duplicate for infinite loop

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex flex-col items-center justify-center gap-8 px-6">
      {/* Film strip */}
      <div className="w-full overflow-hidden">
        <div ref={stripRef} className="flex gap-2 w-max" style={{ willChange: 'transform' }}>
          {thumbnails.map((photo, i) => (
            <div
              key={i}
              className="relative flex-shrink-0 rounded-lg overflow-hidden border-2 border-primary-100"
              style={{ width: 120, height: 80 }}
            >
              <img src={photo.downloadUrl} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
          ))}
        </div>
      </div>

      {/* Step info */}
      <div className="text-center space-y-2 max-w-sm">
        <div className="flex justify-center mb-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-100 animate-pulse">
            <StepIcon className="h-7 w-7 text-primary-500" />
          </div>
        </div>
        <p className="text-xl font-bold text-foreground">{step.label}</p>
        <p className="text-sm text-foreground-muted">{step.sub}</p>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-sm space-y-2">
        <div className="h-2 bg-background-subtle rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-400 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-foreground-subtle">
          <span>{Math.round(progress)}%</span>
          <span>예상 영상 {totalDuration}초</span>
        </div>
      </div>

      {/* Step dots */}
      <div className="flex gap-2">
        {GENERATING_STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === stepIdx
                ? 'w-6 bg-primary-400'
                : i < stepIdx
                ? 'w-1.5 bg-primary-200'
                : 'w-1.5 bg-background-subtle'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function getAltText(photo: Photo): string {
  const parts: string[] = [];
  const dateVal = photo.capturedAt;
  if (dateVal) {
    const d = typeof (dateVal as { toDate?: () => Date }).toDate === 'function'
      ? (dateVal as { toDate: () => Date }).toDate()
      : new Date(dateVal as unknown as string);
    parts.push(d.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }));
  }
  if (photo.placeName) parts.push(photo.placeName);
  else if (photo.address) parts.push(photo.address.split(' ').slice(0, 3).join(' '));
  if (photo.visionDescription) parts.push(photo.visionDescription);
  return parts.join(' ') || '사진';
}

function BlogSection({
  scene,
  photos,
  onNarrationChange,
}: {
  scene: Scene;
  photos: Photo[];
  onNarrationChange: (id: number, text: string) => void;
}) {
  const scenePhotos = photos.filter((p) => scene.photoIds.includes(p.photoId));

  return (
    <div className="space-y-4">
      {/* H2 소제목 */}
      {scene.sectionTitle && (
        <h2 className="text-lg font-semibold text-foreground leading-snug">
          {scene.sectionTitle}
        </h2>
      )}

      {scenePhotos.length > 0 && (
        <div className={`grid gap-2 ${scenePhotos.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {scenePhotos.map((photo) => (
            <figure key={photo.photoId} className="m-0">
              <div className="rounded-xl overflow-hidden bg-background-subtle" style={{ aspectRatio: '4/3' }}>
                <img
                  src={photo.downloadUrl}
                  alt={getAltText(photo)}
                  className="w-full h-full object-cover"
                />
              </div>
              {(photo.placeName || photo.capturedAt) && (
                <figcaption className="text-xs text-foreground-subtle mt-1 px-0.5">
                  {photo.placeName && <span>{photo.placeName}</span>}
                  {photo.placeName && photo.capturedAt && <span> · </span>}
                  {photo.capturedAt && (
                    <span>
                      {(() => {
                        const d = typeof (photo.capturedAt as { toDate?: () => Date }).toDate === 'function'
                          ? (photo.capturedAt as { toDate: () => Date }).toDate()
                          : new Date(photo.capturedAt as unknown as string);
                        return d.toLocaleString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                      })()}
                    </span>
                  )}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      )}

      <Textarea
        value={scene.narration}
        onChange={(e) => onNarrationChange(scene.id, e.target.value)}
        className="min-h-[120px] text-base leading-loose border-0 bg-transparent px-0 resize-none focus-visible:ring-0 text-foreground"
        placeholder="내용을 입력하세요..."
      />

      {scene.location && (
        <div className="flex items-center gap-1.5 text-xs text-foreground-subtle">
          <MapPin className="h-3 w-3" />
          <span>{scene.location.placeName || scene.location.address}</span>
        </div>
      )}
    </div>
  );
}

export default function PostPage() {
  const { postId } = useParams<{ postId: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [bgm, setBgm] = useState<BgmKey>('a_stroll');
  const [format, setFormat] = useState<'9:16' | '16:9' | '1:1'>('9:16');

  useEffect(() => {
    async function load() {
      const uid = auth.currentUser?.uid;
      if (!uid || !postId) return;
      try {
        const snap = await getDoc(doc(db, `users/${uid}/posts/${postId}`));
        if (snap.exists()) {
          setPost({ postId: snap.id, ...snap.data() } as Post);
        }

        const photosSnap = await getDocs(
          collection(db, `users/${uid}/posts/${postId}/photos`)
        );
        const list = photosSnap.docs
          .map((d) => ({ photoId: d.id, ...d.data() } as Photo))
          .sort((a, b) => a.order - b.order);
        setPhotos(list);
      } catch {
        toast.error('글을 불러오지 못했어요.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [postId]);

  function handleNarrationChange(sceneId: number, text: string) {
    if (!post) return;
    setPost({
      ...post,
      scenes: post.scenes.map((s) => (s.id === sceneId ? { ...s, narration: text } : s)),
    });
  }

  async function handleSave() {
    if (!post) return;
    setSaving(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: post.title, scenes: post.scenes }),
      });
      if (!res.ok) throw new Error();
      toast.success('저장됐어요!');
    } catch {
      toast.error('저장에 실패했어요.');
    } finally {
      setSaving(false);
    }
  }

  async function handleRegenerate() {
    if (!post) return;
    const targetMode = post.mode === 'blog' ? 'diary' : 'blog';
    const targetLabel = targetMode === 'blog' ? '블로그' : '다이어리';
    setRegenerating(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/posts/${postId}/regenerate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: targetMode }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      // 글 다시 로드
      const uid = auth.currentUser?.uid;
      if (uid) {
        const snap = await (await import('firebase/firestore')).getDoc(
          (await import('firebase/firestore')).doc(db, `users/${uid}/posts/${postId}`)
        );
        if (snap.exists()) setPost({ postId: snap.id, ...snap.data() } as Post);
      }
      toast.success(`${targetLabel} 형식으로 재생성됐어요!`);
    } catch {
      toast.error('재생성에 실패했어요. 다시 시도해주세요.');
    } finally {
      setRegenerating(false);
    }
  }

  async function handleGenerateVideo() {
    if (!post) return;
    setGenerating(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/videos/create', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.postId, bgm, format }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message ?? '영상 생성에 실패했어요.');
        return;
      }
      toast.success('영상 생성이 시작됐어요! 내 영상 탭에서 확인하세요.');
    } catch {
      toast.error('영상 생성에 실패했어요.');
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6">
        <div className="space-y-6">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-foreground-muted">글을 찾을 수 없어요.</p>
      </div>
    );
  }

  const totalDuration = post.scenes.reduce((acc, s) => acc + s.duration, 0);

  return (
    <>
      {generating && (
        <VideoGeneratingOverlay photos={photos} totalDuration={totalDuration} />
      )}

      {regenerating && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex flex-col items-center justify-center gap-6 px-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-100">
            <RefreshCw className="h-8 w-8 text-primary-500 animate-spin" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-xl font-bold text-foreground">
              {post?.mode === 'blog' ? '다이어리' : '블로그'}로 재생성 중...
            </p>
            <p className="text-sm text-foreground-muted">
              같은 사진, 다른 감성으로 글을 다시 써드릴게요
            </p>
          </div>
          <div className="h-1.5 w-64 bg-background-subtle rounded-full overflow-hidden">
            <div className="h-full bg-primary-400 rounded-full animate-pulse w-3/4" />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6 animate-fade-in">
        {/* 블로그 본문 */}
        <div className="space-y-8">
          <Input
            value={post.title}
            onChange={(e) => setPost({ ...post, title: e.target.value })}
            className="text-xl font-bold h-14 border-0 border-b-2 rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary-300"
            placeholder="제목을 입력하세요"
          />

          {post.scenes.map((scene, i) => (
            <div key={scene.id}>
              {i > 0 && <Separator className="mb-8" />}
              <BlogSection
                scene={scene}
                photos={photos}
                onNarrationChange={handleNarrationChange}
              />
            </div>
          ))}

          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {post.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* 사이드 패널 */}
        <div className="space-y-4">
          <Card className="sticky top-20">
            <CardContent className="p-5 space-y-3">
              <Button className="w-full gap-2" onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4" />
                {saving ? '저장 중...' : '저장하기'}
              </Button>

              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={handleRegenerate}
                disabled={regenerating}
              >
                <RefreshCw className={`h-4 w-4 ${regenerating ? 'animate-spin' : ''}`} />
                {regenerating
                  ? '재생성 중...'
                  : post.mode === 'blog'
                  ? '다이어리로 재생성'
                  : '블로그로 재생성'}
              </Button>

              <Separator />

              <div className="space-y-2">
                <p className="text-xs font-medium text-foreground-muted">영상 포맷</p>
                <Select value={format} onValueChange={(v) => setFormat(v as typeof format)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="9:16">9:16 릴스/숏츠</SelectItem>
                    <SelectItem value="16:9">16:9 유튜브</SelectItem>
                    <SelectItem value="1:1">1:1 인스타</SelectItem>
                  </SelectContent>
                </Select>

                <p className="text-xs font-medium text-foreground-muted">BGM</p>
                <Select value={bgm} onValueChange={(v) => setBgm(v as BgmKey)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel className="text-xs">☕ Lo-Fi (카페·일상)</SelectLabel>
                      {BGM_BY_CATEGORY.lofi.map((t) => (
                        <SelectItem key={t.key} value={t.key} className="text-xs">
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel className="text-xs">🎸 어쿠스틱 (다이어리)</SelectLabel>
                      {BGM_BY_CATEGORY.acoustic.map((t) => (
                        <SelectItem key={t.key} value={t.key} className="text-xs">
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel className="text-xs">🎬 시네마틱 (여행·풍경)</SelectLabel>
                      {BGM_BY_CATEGORY.cinematic.map((t) => (
                        <SelectItem key={t.key} value={t.key} className="text-xs">
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={handleGenerateVideo}
                disabled={generating}
              >
                <Video className="h-4 w-4" />
                {generating ? '생성 요청 중...' : '영상 생성'}
              </Button>

              {post.videoId && (
                <Link href="/mypage/videos">
                  <Button variant="ghost" className="w-full gap-2 text-xs">
                    <Download className="h-4 w-4" />
                    내 영상 보러 가기
                  </Button>
                </Link>
              )}

              <Separator />

              <div className="space-y-2 text-xs text-foreground-muted">
                <div className="flex items-center gap-2">
                  <Camera className="h-3 w-3" />
                  <span>사진 {post.totalPhotos}장</span>
                </div>
                {post.primaryLocation && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3 w-3" />
                    <span>{post.primaryLocation}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  <span>예상 {totalDuration}초 영상</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
