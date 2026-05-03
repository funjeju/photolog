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
import { signInWithGoogle, signUpWithEmail } from '@/lib/firebase/auth';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleGoogle() {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      router.push('/dashboard');
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request') {
        toast.error('Google 로그인에 실패했어요.');
      }
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email || !password) return;
    if (password.length < 6) {
      toast.error('비밀번호는 6자 이상이어야 해요.');
      return;
    }
    setEmailLoading(true);
    try {
      await signUpWithEmail(email, password, name);
      toast.success('가입 완료! 이메일 인증 메일을 확인해주세요.');
      router.push('/dashboard');
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === 'auth/email-already-in-use') {
        toast.error('이미 사용 중인 이메일이에요.');
      } else {
        toast.error('회원가입에 실패했어요. 다시 시도해주세요.');
      }
    } finally {
      setEmailLoading(false);
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
          <h1 className="text-2xl font-bold text-foreground">PhotoLog 시작하기</h1>
          <p className="text-sm text-foreground-muted mt-1">무료로 시작해요</p>
        </div>

        {/* Google */}
        <Button
          variant="outline"
          className="w-full border-2 border-border bg-white text-foreground hover:bg-background-subtle gap-3 mb-4"
          onClick={handleGoogle}
          disabled={googleLoading}
        >
          <Chrome className="h-4 w-4" />
          {googleLoading ? 'Google 연결 중...' : 'Google로 계속하기'}
        </Button>

        <div className="flex items-center gap-3 mb-4">
          <Separator className="flex-1" />
          <span className="text-xs text-foreground-subtle">또는</span>
          <Separator className="flex-1" />
        </div>

        {/* 이메일 가입 */}
        <form onSubmit={handleSignup} className="space-y-3">
          <Input
            type="text"
            placeholder="닉네임"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="비밀번호 (6자 이상)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" className="w-full" disabled={emailLoading}>
            {emailLoading ? '가입 중...' : '무료 시작하기'}
          </Button>
        </form>

        <p className="text-center text-sm text-foreground-muted mt-6">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="text-primary-500 font-medium hover:underline">
            로그인
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
