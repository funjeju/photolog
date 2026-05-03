'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { collection, getDocs, orderBy, query, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/client';
import { toast } from 'sonner';
import { PenLine, BookOpen, MapPin, Camera, Search, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import type { Post, PostMode } from '@/types/post';

// ─── PostCard ────────────────────────────────────────────────────────────────

function PostCard({ post, onDelete }: { post: Post; onDelete: (id: string) => void }) {
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const ts = post.createdAt instanceof Timestamp
    ? post.createdAt.toDate()
    : new Date(post.createdAt as unknown as string);
  const dateStr = `${ts.getFullYear()}.${String(ts.getMonth() + 1).padStart(2, '0')}.${String(ts.getDate()).padStart(2, '0')}`;

  async function handleDelete() {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    setDeleting(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/posts/${post.postId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      onDelete(post.postId);
      toast.success('글이 삭제됐어요.');
    } catch {
      toast.error('삭제에 실패했어요.');
    } finally {
      setDeleting(false);
      setConfirm(false);
    }
  }

  return (
    <>
      <div className="group relative bg-white rounded-2xl overflow-hidden border border-background-subtle hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
        {/* 썸네일 */}
        <Link href={`/post/${post.postId}`}>
          <div className="aspect-[4/3] bg-background-subtle overflow-hidden">
            {post.thumbnailUrl ? (
              <img
                src={post.thumbnailUrl}
                alt={post.title}
                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <BookOpen className="h-8 w-8 text-foreground-subtle" />
              </div>
            )}
          </div>
        </Link>

        {/* 삭제 버튼 (호버 시) */}
        <button
          onClick={() => setConfirm(true)}
          className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/80 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
        >
          <Trash2 className="h-3.5 w-3.5 text-red-400" />
        </button>

        {/* 내용 */}
        <div className="p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <Link href={`/post/${post.postId}`}>
              <p className="text-sm font-semibold text-foreground line-clamp-2 hover:text-primary-400 transition-colors">
                {post.title}
              </p>
            </Link>
          </div>

          <div className="flex items-center gap-3 text-xs text-foreground-subtle">
            {post.primaryLocation && (
              <span className="flex items-center gap-0.5">
                <MapPin className="h-3 w-3" />{post.primaryLocation}
              </span>
            )}
            <span className="flex items-center gap-0.5">
              <Camera className="h-3 w-3" />{post.totalPhotos}장
            </span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-foreground-subtle">{dateStr}</span>
            {post.tags.length > 0 && (
              <div className="flex gap-1 flex-wrap justify-end">
                {post.tags.slice(0, 2).map((t) => (
                  <Badge key={t} variant="secondary" className="text-xs px-1.5 py-0">#{t}</Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>글을 삭제할까요?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-foreground-muted">삭제한 글은 복구할 수 없어요.</p>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" size="sm">취소</Button>
            </DialogClose>
            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
              {deleting ? '삭제 중...' : '삭제'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── PostGrid ────────────────────────────────────────────────────────────────

function PostGrid({ posts, loading, onDelete }: {
  posts: Post[];
  loading: boolean;
  onDelete: (id: string) => void;
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl overflow-hidden">
            <Skeleton className="aspect-[4/3] w-full" />
            <div className="p-4 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-background-subtle mb-4">
          <BookOpen className="h-6 w-6 text-foreground-subtle" />
        </div>
        <p className="text-base font-medium text-foreground">아직 작성된 글이 없어요</p>
        <p className="text-sm text-foreground-muted mt-1 mb-6">
          사진을 올리면 AI가 자동으로 글을 써드려요
        </p>
        <Link href="/upload">
          <Button className="gap-2">
            <PenLine className="h-4 w-4" />
            첫 글 만들기
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
      {posts.map((p) => <PostCard key={p.postId} post={p} onDelete={onDelete} />)}
    </div>
  );
}

// ─── MypagePage ──────────────────────────────────────────────────────────────

export default function MypagePage() {
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      try {
        const snap = await getDocs(
          query(collection(db, `users/${uid}/posts`), orderBy('createdAt', 'desc'))
        );
        setAllPosts(snap.docs.map((d) => d.data() as Post));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function handleDelete(id: string) {
    setAllPosts((prev) => prev.filter((p) => p.postId !== id));
  }

  function filtered(mode: PostMode) {
    return allPosts
      .filter((p) => p.mode === mode)
      .filter((p) =>
        search === '' ||
        p.title.includes(search) ||
        p.tags.some((t) => t.includes(search)) ||
        (p.primaryLocation ?? '').includes(search)
      );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">마이페이지</h1>
          <p className="text-sm text-foreground-muted mt-1">내가 만든 글을 관리하세요</p>
        </div>
        <Link href="/upload">
          <Button className="gap-2">
            <PenLine className="h-4 w-4" />
            새 글 작성
          </Button>
        </Link>
      </div>

      {/* 검색 */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-subtle" />
        <Input
          placeholder="제목, 태그, 장소 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Tabs defaultValue="blog">
        <TabsList>
          <TabsTrigger value="blog">
            블로그
            {!loading && (
              <Badge variant="secondary" className="ml-1.5 text-xs px-1.5 py-0">
                {filtered('blog').length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="diary">
            다이어리
            {!loading && (
              <Badge variant="secondary" className="ml-1.5 text-xs px-1.5 py-0">
                {filtered('diary').length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="blog">
          <PostGrid posts={filtered('blog')} loading={loading} onDelete={handleDelete} />
        </TabsContent>
        <TabsContent value="diary">
          <PostGrid posts={filtered('diary')} loading={loading} onDelete={handleDelete} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
