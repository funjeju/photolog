'use client';

import { Bell, Menu } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

const greetings = [
  '오늘도 좋은 콘텐츠 만들어보세요!',
  '사진이 글이 되고, 글이 영상이 되는 마법!',
  '오늘은 어떤 순간을 기록할까요?',
];

export function Header() {
  const { user } = useAuth();
  const now = new Date();
  const greeting = greetings[now.getDate() % greetings.length];
  const name = user?.displayName ?? '사용자';
  const initials = name.slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background-card/80 backdrop-blur px-8">
      {/* 인사말 */}
      <div>
        <p className="text-sm font-semibold text-foreground">
          안녕하세요, {name}님 👋
        </p>
        <p className="text-xs text-foreground-muted">{greeting}</p>
      </div>

      {/* 우측 액션 */}
      <div className="flex items-center gap-3">
        <p className="text-xs text-foreground-muted hidden sm:block">
          {format(now, 'yyyy년 M월 d일 EEEE', { locale: ko })}
        </p>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4 text-foreground-muted" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-coral-300" />
        </Button>
        <Avatar className="h-8 w-8 cursor-pointer">
          <AvatarImage src={user?.photoURL ?? ''} alt={name} />
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
