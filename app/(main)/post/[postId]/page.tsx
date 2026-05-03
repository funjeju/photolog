'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/client';
import { toast } from 'sonner';
import { Save, Video, Download, MapPin, Camera, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import type { Post, Scene } from '@/types/post';

const SCENE_TYPE_LABELS: Record<string, string> = {
  arrival: '도착',
  menu: '메뉴',
  view: '풍경',
  moment: '순간',
  summary: '마무리',
};

function SceneCard({ scene, onNarrationChange }: {
  scene: Scene;
  onNarrationChange: (id: number, text: string) => void;
}) {
  return (
    <Card className="hover:-translate-y-0.5 transition-all duration-200">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-xs">
            {SCENE_TYPE_LABELS[scene.type] ?? scene.type}
          </Badge>
          <span className="text-xs text-foreground-subtle">{scene.duration}초</span>
        </div>

        {scene.location && (
          <div className="flex items-center gap-1.5 text-xs text-foreground-muted">
            <MapPin className="h-3 w-3" />
            <span>{scene.location.placeName || scene.location.address}</span>
          </div>
        )}

        <Textarea
          value={scene.narration}
          onChange={(e) => onNarrationChange(scene.id, e.target.value)}
          className="min-h-[120px] text-sm leading-relaxed"
        />

        <div className="pt-1">
          <p className="text-xs text-foreground-subtle mb-1">영상 자막</p>
          <p className="text-sm font-medium text-foreground bg-background-subtle rounded px-2 py-1">
            {scene.subtitle}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PostPage() {
  const { postId } = useParams<{ postId: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const uid = auth.currentUser?.uid;
      if (!uid || !postId) return;
      try {
        const snap = await getDoc(doc(db, `users/${uid}/posts/${postId}`));
        if (snap.exists()) {
          setPost({ postId: snap.id, ...snap.data() } as Post);
        }
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
      scenes: post.scenes.map((s) => s.id === sceneId ? { ...s, narration: text } : s),
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
      if (!res.ok) throw new Error('저장 실패');
      toast.success('저장됐어요!');
    } catch {
      toast.error('저장에 실패했어요.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-6">
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 w-full" />)}
        </div>
        <Skeleton className="h-64 w-full" />
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-6 animate-fade-in">
      {/* 본문 */}
      <div className="space-y-4">
        <Input
          value={post.title}
          onChange={(e) => setPost({ ...post, title: e.target.value })}
          className="text-xl font-bold h-14 border-0 border-b-2 rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary-300"
          placeholder="제목을 입력하세요"
        />

        {post.scenes.map((scene) => (
          <SceneCard
            key={scene.id}
            scene={scene}
            onNarrationChange={handleNarrationChange}
          />
        ))}
      </div>

      {/* 사이드 패널 */}
      <div className="space-y-4">
        <Card className="sticky top-20">
          <CardContent className="p-5 space-y-3">
            <Button className="w-full gap-2" onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4" />
              {saving ? '저장 중...' : '저장하기'}
            </Button>
            <Button variant="outline" className="w-full gap-2" disabled>
              <Video className="h-4 w-4" />
              영상 생성
            </Button>
            <Button variant="ghost" className="w-full gap-2" disabled>
              <Download className="h-4 w-4" />
              내려받기
            </Button>

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
                <span>예상 {post.scenes.reduce((acc, s) => acc + s.duration, 0)}초 영상</span>
              </div>
            </div>

            {post.tags.length > 0 && (
              <>
                <Separator />
                <div className="flex flex-wrap gap-1.5">
                  {post.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">#{tag}</Badge>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
