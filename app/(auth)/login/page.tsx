'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Leaf, Chrome } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { signInWithGoogle, signInWithEmail } from '@/lib/firebase/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleGoogle() {
    setLoading(true);
    try {
      await signInWithGoogle();
      router.push('/dashboard');
    } catch {
      toast.error('Google 로그인에 실패했어요. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      await signInWithEmail(email, password);
      router.push('/dashboard');
    } catch {
      toast.error('이메일 또는 비밀번호가 올바르지 않아요.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md shadow-hover">
      <CardContent className="p-8">
        {/* 로고 */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 mb-3">
            <Leaf className="h-6 w-6 text-primary-500" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">PhotoLog</h1>
          <p className="text-sm text-foreground-muted mt-1">사진으로 만드는 블로그 & 영상</p>
        </div>

        {/* Google 로그인 */}
        <Button
          variant="outline"
          className="w-full border-2 border-border bg-white text-foreground hover:bg-background-subtle gap-3 mb-4"
          onClick={handleGoogle}
          disabled={loading}
        >
          <Chrome className="h-4 w-4" />
          Google로 계속하기
        </Button>

        {/* 구분선 */}
        <div className="flex items-center gap-3 mb-4">
          <Separator className="flex-1" />
          <span className="text-xs text-foreground-subtle">또는</span>
          <Separator className="flex-1" />
        </div>

        {/* 이메일 로그인 */}
        <form onSubmit={handleEmail} className="space-y-3">
          <Input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? '로그인 중...' : '로그인'}
          </Button>
        </form>

        {/* 회원가입 링크 */}
        <p className="text-center text-sm text-foreground-muted mt-6">
          계정이 없으신가요?{' '}
          <Link href="/signup" className="text-primary-500 font-medium hover:underline">
            회원가입
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
