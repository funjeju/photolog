'use client';

import Link from 'next/link';
import { Clapperboard, PenLine } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function VideosPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">내 영상</h1>
        <p className="text-sm text-foreground-muted mt-1">생성한 숏폼 영상을 관리하세요</p>
      </div>

      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-background-subtle mb-4">
          <Clapperboard className="h-6 w-6 text-foreground-subtle" />
        </div>
        <p className="text-base font-medium text-foreground">아직 생성된 영상이 없어요</p>
        <p className="text-sm text-foreground-muted mt-1 mb-6">
          글을 작성하고 숏폼 영상으로 변환해보세요
        </p>
        <Link href="/upload">
          <Button className="gap-2">
            <PenLine className="h-4 w-4" />
            글 작성하기
          </Button>
        </Link>
      </div>
    </div>
  );
}
