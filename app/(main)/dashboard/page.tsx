'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { collection, getDocs, orderBy, query, limit, Timestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/client';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { PenLine, FileText, Clapperboard, Clock, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { Post } from '@/types/post';

// ─── StatCard ───────────────────────────────────────────────────────────────

type StatCardProps = {
  title: string;
  value: string;
  sub: string;
  colorClass: string;
  iconBg: string;
  icon: React.ReactNode;
};

function StatCard({ title, value, sub, colorClass, iconBg, icon }: StatCardProps) {
  return (
    <Card className={`border-l-4 ${colorClass}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-foreground-muted">{title}</p>
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${iconBg}`}>
            {icon}
          </div>
        </div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-foreground-subtle mt-1">{sub}</p>
      </CardContent>
    </Card>
  );
}

// ─── TrendChart ─────────────────────────────────────────────────────────────

function buildTrendData(posts: Post[]) {
  const map: Record<string, number> = {};
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = `${d.getMonth() + 1}/${d.getDate()}`;
    map[key] = 0;
  }
  posts.forEach((p) => {
    const ts = p.createdAt instanceof Timestamp ? p.createdAt.toDate() : new Date(p.createdAt as unknown as string);
    const key = `${ts.getMonth() + 1}/${ts.getDate()}`;
    if (key in map) map[key]++;
  });
  return Object.entries(map).map(([date, count]) => ({ date, count }));
}

function TrendChart({ posts }: { posts: Post[] }) {
  const data = buildTrendData(posts);
  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F5EDE0" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: '#A8A096' }}
          tickLine={false}
          interval={6}
        />
        <YAxis tick={{ fontSize: 10, fill: '#A8A096' }} tickLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={{ borderRadius: 8, border: 'none', background: '#fff', fontSize: 12 }}
          itemStyle={{ color: '#7FBF9E' }}
        />
        <Line
          type="monotone"
          dataKey="count"
          stroke="#7FBF9E"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
          name="글 수"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ─── ModeRatioChart ──────────────────────────────────────────────────────────

const PIE_COLORS = ['#7FBF9E', '#7FB0DC'];

function ModeRatioChart({ posts }: { posts: Post[] }) {
  const blog = posts.filter((p) => p.mode === 'blog').length;
  const diary = posts.filter((p) => p.mode === 'diary').length;
  const data = [
    { name: '블로그', value: blog },
    { name: '다이어리', value: diary },
  ].filter((d) => d.value > 0);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[180px] text-sm text-foreground-subtle">
        아직 데이터가 없어요
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="value">
          {data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
        </Pie>
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
        <Tooltip contentStyle={{ borderRadius: 8, border: 'none', fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ─── RecentPostRow ───────────────────────────────────────────────────────────

function RecentPostRow({ post }: { post: Post }) {
  const ts = post.createdAt instanceof Timestamp ? post.createdAt.toDate() : new Date(post.createdAt as unknown as string);
  const dateStr = `${ts.getFullYear()}.${String(ts.getMonth() + 1).padStart(2, '0')}.${String(ts.getDate()).padStart(2, '0')}`;

  return (
    <Link href={`/post/${post.postId}`} className="flex items-center gap-3 py-3 hover:bg-background-subtle rounded-lg px-2 -mx-2 transition-colors group">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background-subtle flex-shrink-0 overflow-hidden">
        {post.thumbnailUrl ? (
          <img src={post.thumbnailUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <FileText className="h-4 w-4 text-foreground-subtle" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate group-hover:text-primary-DEFAULT">{post.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {post.primaryLocation && (
            <span className="flex items-center gap-0.5 text-xs text-foreground-subtle">
              <MapPin className="h-2.5 w-2.5" />{post.primaryLocation}
            </span>
          )}
          <span className="text-xs text-foreground-subtle">{dateStr}</span>
        </div>
      </div>
      <Badge variant="secondary" className="text-xs flex-shrink-0">
        {post.mode === 'blog' ? '블로그' : '다이어리'}
      </Badge>
    </Link>
  );
}

// ─── DashboardPage ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      try {
        const [allSnap, recentSnap] = await Promise.all([
          getDocs(collection(db, `users/${uid}/posts`)),
          getDocs(query(collection(db, `users/${uid}/posts`), orderBy('createdAt', 'desc'), limit(5))),
        ]);
        setPosts(allSnap.docs.map((d) => d.data() as Post));
        setRecentPosts(recentSnap.docs.map((d) => d.data() as Post));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const now = new Date();
  const thisMonth = posts.filter((p) => {
    const ts = p.createdAt instanceof Timestamp ? p.createdAt.toDate() : new Date(p.createdAt as unknown as string);
    return ts.getMonth() === now.getMonth() && ts.getFullYear() === now.getFullYear();
  });

  const stats: StatCardProps[] = [
    {
      title: '이번 달 작성 글',
      value: loading ? '-' : `${thisMonth.length}편`,
      sub: '블로그 + 다이어리',
      colorClass: 'border-l-primary-300',
      iconBg: 'bg-primary-100',
      icon: <FileText className="h-4 w-4 text-primary-400" />,
    },
    {
      title: '누적 글 총 개수',
      value: loading ? '-' : `${posts.length}편`,
      sub: '전체 기간',
      colorClass: 'border-l-sky-300',
      iconBg: 'bg-sky-200',
      icon: <FileText className="h-4 w-4 text-sky-300" />,
    },
    {
      title: '영상 생성 횟수',
      value: loading ? '-' : `${posts.filter((p) => p.videoId).length}편`,
      sub: '전체 기간',
      colorClass: 'border-l-lavender-300',
      iconBg: 'bg-lavender-200',
      icon: <Clapperboard className="h-4 w-4 text-lavender-300" />,
    },
    {
      title: '평균 절약 시간',
      value: loading ? '-' : `${Math.round(posts.length * 1.5)}시간`,
      sub: '글 1편 = 약 1.5시간 절약',
      colorClass: 'border-l-sun-300',
      iconBg: 'bg-sun-200',
      icon: <Clock className="h-4 w-4 text-sun-300" />,
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 헤더 */}
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

      {/* 스탯 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)
          : stats.map((s) => <StatCard key={s.title} {...s} />)}
      </div>

      {/* 차트 + 최근 글 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 트렌드 차트 (2/3) */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">최근 30일 글 작성 추이</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-[180px] w-full" /> : <TrendChart posts={posts} />}
          </CardContent>
        </Card>

        {/* 모드 비율 (1/3) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">블로그 / 다이어리 비율</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-[180px] w-full" /> : <ModeRatioChart posts={posts} />}
          </CardContent>
        </Card>
      </div>

      {/* 최근 글 + 알림 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">최근 작성 글</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : recentPosts.length === 0 ? (
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
            ) : (
              <div className="divide-y divide-background-subtle">
                {recentPosts.map((p) => <RecentPostRow key={p.postId} post={p} />)}
              </div>
            )}
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
