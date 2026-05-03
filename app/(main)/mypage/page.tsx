'use client';

import Link from 'next/link';
import { PenLine, BookOpen } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

function EmptyState({ mode }: { mode: 'blog' | 'diary' }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-background-subtle mb-4">
        <BookOpen className="h-6 w-6 text-foreground-subtle" />
      </div>
      <p className="text-base font-medium text-foreground">
        {mode === 'blog' ? '작성된 블로그 글이 없어요' : '작성된 다이어리가 없어요'}
      </p>
      <p className="text-sm text-foreground-muted mt-1 mb-6">
        사진을 올리면 AI가 자동으로 {mode === 'blog' ? '블로그 글' : '다이어리'}을 써드려요
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

export default function MypagePage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">마이페이지</h1>
        <p className="text-sm text-foreground-muted mt-1">내가 만든 글과 영상을 관리하세요</p>
      </div>

      <Tabs defaultValue="blog">
        <TabsList>
          <TabsTrigger value="blog">블로그</TabsTrigger>
          <TabsTrigger value="diary">다이어리</TabsTrigger>
        </TabsList>
        <TabsContent value="blog">
          <EmptyState mode="blog" />
        </TabsContent>
        <TabsContent value="diary">
          <EmptyState mode="diary" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
