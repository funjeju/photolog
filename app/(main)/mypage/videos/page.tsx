'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { collection, orderBy, query, onSnapshot, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/client';
import { toast } from 'sonner';
import { Clapperboard, PenLine, Download, Clock, CheckCircle, AlertCircle, Loader2, XCircle, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

type VideoStatus = 'pending' | 'rendering' | 'completed' | 'failed' | 'cancelled';

type VideoDoc = {
  videoId: string;
  postId: string;
  uid: string;
  status: VideoStatus;
  bgm: string;
  format: string;
  outputUrl?: string;
  errorMessage?: string;
  createdAt: Timestamp;
};

const STATUS_CONFIG: Record<VideoStatus, { label: string; icon: React.ReactNode; color: string }> = {
  pending:   { label: '준비 중',   icon: <Clock className="h-3 w-3" />,                       color: 'bg-sun-200 text-sun-300' },
  rendering: { label: '렌더링 중', icon: <Loader2 className="h-3 w-3 animate-spin" />,        color: 'bg-sky-200 text-sky-300' },
  completed: { label: '완료',      icon: <CheckCircle className="h-3 w-3" />,                 color: 'bg-primary-100 text-primary-400' },
  failed:    { label: '실패',      icon: <AlertCircle className="h-3 w-3" />,                 color: 'bg-red-50 text-red-400' },
  cancelled: { label: '중지됨',    icon: <XCircle className="h-3 w-3" />,                     color: 'bg-background-subtle text-foreground-subtle' },
};

const FORMAT_LABEL: Record<string, string> = {
  '9:16': '릴스/숏츠',
  '16:9': '유튜브',
  '1:1':  '인스타',
};

function VideoCard({ video }: { video: VideoDoc }) {
  const [cancelling, setCancelling] = useState(false);

  const ts = video.createdAt instanceof Timestamp
    ? video.createdAt.toDate()
    : new Date(video.createdAt as unknown as string);
  const dateStr = `${ts.getFullYear()}.${String(ts.getMonth() + 1).padStart(2, '0')}.${String(ts.getDate()).padStart(2, '0')}`;
  const st = STATUS_CONFIG[video.status] ?? STATUS_CONFIG.failed;
  const isActive = video.status === 'rendering' || video.status === 'pending';

  async function handleCancel() {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    setCancelling(true);
    try {
      await updateDoc(doc(db, `users/${uid}/videos/${video.videoId}`), {
        status: 'cancelled',
        updatedAt: new Date(),
      });
      toast.success('영상 생성을 중지했어요.');
    } catch {
      toast.error('중지에 실패했어요. 다시 시도해주세요.');
    } finally {
      setCancelling(false);
    }
  }

  return (
    <Card className="hover:-translate-y-0.5 transition-all duration-200">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          {/* 아이콘 */}
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-lavender-200 flex-shrink-0">
            <Clapperboard className="h-5 w-5 text-lavender-300" />
          </div>

          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${st.color}`}>
                {st.icon}{st.label}
              </span>
              <Badge variant="secondary" className="text-xs">
                {FORMAT_LABEL[video.format] ?? video.format}
              </Badge>
              <Badge variant="secondary" className="text-xs">BGM: {video.bgm}</Badge>
            </div>

            <p className="text-xs text-foreground-subtle">{dateStr}</p>

            {video.status === 'failed' && video.errorMessage && (
              <p className="text-xs text-red-400">{video.errorMessage}</p>
            )}
          </div>

          <div className="flex flex-col gap-2 flex-shrink-0">
            {/* 다운로드 */}
            {video.status === 'completed' && video.outputUrl && (
              <a href={video.outputUrl} target="_blank" rel="noopener noreferrer" download>
                <Button size="sm" variant="outline" className="gap-1.5">
                  <Download className="h-3.5 w-3.5" />
                  다운로드
                </Button>
              </a>
            )}

            {/* 중지 버튼 — 렌더링·대기 중일 때만 표시 */}
            {isActive && (
              <Button
                size="sm"
                variant="ghost"
                className="gap-1.5 text-foreground-subtle hover:text-red-500 hover:bg-red-50"
                onClick={handleCancel}
                disabled={cancelling}
              >
                {cancelling
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <Square className="h-3.5 w-3.5 fill-current" />
                }
                중지
              </Button>
            )}
          </div>
        </div>

        {/* 원본 글 링크 */}
        <div className="mt-3 pt-3 border-t border-background-subtle">
          <Link href={`/post/${video.postId}`} className="text-xs text-primary-400 hover:underline">
            원본 글 보기 →
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function VideosPage() {
  const [videos, setVideos] = useState<VideoDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) { setLoading(false); return; }

    const unsubscribe = onSnapshot(
      query(collection(db, `users/${uid}/videos`), orderBy('createdAt', 'desc')),
      (snap) => {
        setVideos(snap.docs.map((d) => d.data() as VideoDoc));
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  const rendering = videos.filter((v) => v.status === 'rendering' || v.status === 'pending');

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">내 영상</h1>
        <p className="text-sm text-foreground-muted mt-1">생성한 숏폼 영상을 관리하세요</p>
      </div>

      {rendering.length > 0 && (
        <div className="flex items-center gap-3 rounded-xl bg-sky-50 border border-sky-200 px-4 py-3">
          <Loader2 className="h-4 w-4 text-sky-400 animate-spin flex-shrink-0" />
          <p className="text-sm text-sky-600">
            <span className="font-medium">{rendering.length}개</span> 영상이 렌더링 중이에요.
            완료되면 자동으로 업데이트돼요.
          </p>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
      ) : videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-background-subtle mb-4">
            <Clapperboard className="h-6 w-6 text-foreground-subtle" />
          </div>
          <p className="text-base font-medium text-foreground">아직 생성된 영상이 없어요</p>
          <p className="text-sm text-foreground-muted mt-1 mb-6">글에서 영상 생성 버튼을 눌러보세요</p>
          <Link href="/upload">
            <Button className="gap-2">
              <PenLine className="h-4 w-4" />
              글 작성하기
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {videos.map((v) => <VideoCard key={v.videoId} video={v} />)}
        </div>
      )}
    </div>
  );
}
