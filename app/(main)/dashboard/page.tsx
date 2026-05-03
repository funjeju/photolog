'use client';

import Link from 'next/link';
import { PenLine, FileText, Clapperboard, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

type StatCardProps = {
  title: string;
  value: string;
  change: string;
  positive: boolean;
  colorClass: string;
  iconBg: string;
  icon: React.ReactNode;
};

function StatCard({ title, value, change, positive, colorClass, iconBg, icon }: StatCardProps) {
  return (
    <Card className={`border-l-4 ${colorClass}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-foreground-muted">{title}</p>
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${iconBg}`}>
            {icon}
          </div>
        </div>
        <div className="flex items-end justify-between">
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <Badge variant={positive ? 'success' : 'destructive'} className="text-xs">
            {change}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const stats: StatCardProps[] = [
    {
      title: '이번 달 작성 글',
      value: '0편',
      change: '+0%',
      positive: true,
      colorClass: 'border-l-primary-300',
      iconBg: 'bg-primary-100',
      icon: <FileText className="h-4 w-4 text-primary-500" />,
    },
    {
      title: '누적 글 총 개수',
      value: '0편',
      change: '+0%',
      positive: true,
      colorClass: 'border-l-sky-300',
      iconBg: 'bg-sky-200',
      icon: <FileText className="h-4 w-4 text-sky-300" />,
    },
    {
      title: '영상 생성 횟수',
      value: '0편',
      change: '+0%',
      positive: true,
      colorClass: 'border-l-lavender-300',
      iconBg: 'bg-lavender-200',
      icon: <Clapperboard className="h-4 w-4 text-lavender-300" />,
    },
    {
      title: '평균 절약 시간',
      value: '0시간',
      change: '+0%',
      positive: true,
      colorClass: 'border-l-sun-300',
      iconBg: 'bg-sun-200',
      icon: <Clock className="h-4 w-4 text-sun-300" />,
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 상단 CTA */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">대시보드</h1>
          <p className="text-sm text-foreground-muted mt-1">오늘의 콘텐츠 현황을 확인하세요</p>
        </div>
        <Link href="/upload">
          <Button className="gap-2">
            <PenLine className="h-4 w-4" />
            새 글 작성
          </Button>
        </Link>
      </div>

      {/* 스탯 카드 4개 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* 빈 상태 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">최근 작성 글</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-background-subtle mb-3">
                <FileText className="h-5 w-5 text-foreground-subtle" />
              </div>
              <p className="text-sm font-medium text-foreground">아직 작성된 글이 없어요</p>
              <p className="text-xs text-foreground-muted mt-1 mb-4">첫 번째 글을 만들어볼까요?</p>
              <Link href="/upload">
                <Button size="sm">사진 업로드하기</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">알림</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-foreground-muted">새로운 알림이 없어요</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
