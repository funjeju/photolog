'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  PenLine,
  BookOpen,
  Clapperboard,
  Bell,
  Settings,
  LogOut,
  Leaf,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useAuth } from '@/contexts/AuthContext';
import { signOut } from '@/lib/firebase/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

const navItems = [
  { href: '/dashboard', label: '대시보드', icon: LayoutDashboard },
  { href: '/upload',    label: '새 글 작성',  icon: PenLine },
  { href: '/mypage',    label: '마이페이지', icon: BookOpen },
  { href: '/mypage/videos', label: '내 영상',  icon: Clapperboard },
  { href: '/settings',  label: '설정',      icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const initials = user?.displayName
    ? user.displayName.slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() ?? 'PL';

  return (
    <aside className="fixed left-0 top-0 h-full w-60 bg-background-card border-r border-border flex flex-col z-30">
      {/* 로고 */}
      <div className="flex items-center gap-2.5 px-5 py-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100">
          <Leaf className="h-4 w-4 text-primary-500" />
        </div>
        <span className="font-bold text-lg text-foreground">PhotoLog</span>
      </div>

      <Separator />

      {/* 네비게이션 */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'relative flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all duration-200',
                isActive
                  ? 'bg-primary-100 text-primary-500 font-medium'
                  : 'text-foreground-muted hover:bg-background-subtle hover:text-foreground'
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-primary-400 rounded-r-full" />
              )}
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <Separator />

      {/* 프로필 영역 */}
      <div className="px-3 py-4">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-md">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.photoURL ?? ''} alt={user?.displayName ?? ''} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {user?.displayName ?? '사용자'}
            </p>
            <p className="text-xs text-foreground-muted truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={() => signOut()}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-foreground-muted hover:bg-background-subtle hover:text-foreground transition-all duration-200 mt-1"
        >
          <LogOut className="h-4 w-4" />
          로그아웃
        </button>
      </div>
    </aside>
  );
}
