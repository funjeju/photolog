# 04. 인증 시스템

## 로그인 방식

1. **Google OAuth** (Firebase Auth 기본 제공)
2. **이메일 + 비밀번호** (Firebase Auth 기본 제공)
3. **이메일 인증 메일 발송 후 가입 확정**

> Firebase 콘솔에서 직접 활성화 (개발자가 코드만 연동)

## Firebase Console 설정

### Authentication 탭에서 활성화
- Sign-in method:
  - [x] Google (OAuth client ID 자동 생성)
  - [x] Email/Password
  - [x] Email link (이메일 인증)

### 승인된 도메인
- localhost (개발용)
- photolog.vercel.app (베타용)
- 정식 도메인 (추후)

## 클라이언트 코드 (`lib/firebase/client.ts`)

```typescript
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
```

## 인증 함수 모음 (`lib/firebase/auth.ts`)

```typescript
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { auth, googleProvider, db } from './client';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

// Google 로그인
export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  await ensureUserDocument(result.user, 'google');
  return result.user;
}

// 이메일 회원가입
export async function signUpWithEmail(email: string, password: string, displayName: string) {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  await sendEmailVerification(result.user);
  await ensureUserDocument(result.user, 'email', displayName);
  return result.user;
}

// 이메일 로그인
export async function signInWithEmail(email: string, password: string) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

// 로그아웃
export async function signOut() {
  await firebaseSignOut(auth);
}

// users 문서 보장 생성
async function ensureUserDocument(user: User, provider: 'google' | 'email', displayName?: string) {
  const userRef = doc(db, 'users', user.uid);
  const snapshot = await getDoc(userRef);
  
  if (!snapshot.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      displayName: displayName || user.displayName || user.email?.split('@')[0],
      photoURL: user.photoURL || null,
      provider,
      createdAt: serverTimestamp(),
      plan: 'free',
      usage: {
        blogPostsThisMonth: 0,
        diaryEntriesThisMonth: 0,
        videosThisMonth: 0,
        monthResetAt: serverTimestamp(),
      },
    });
  }
}
```

## Auth Context (`contexts/AuthContext.tsx`)

```typescript
'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';

type AuthContextType = {
  user: User | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

## 보호된 라우트 미들웨어

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedPaths = ['/dashboard', '/upload', '/post', '/mypage', '/settings'];
const authPaths = ['/login', '/signup'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // 클라이언트 측 인증 체크는 useAuth 훅으로 처리
  // 미들웨어는 정적 라우팅만 담당
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/upload/:path*', '/post/:path*', '/mypage/:path*', '/settings/:path*'],
};
```

## 사용 예시 (보호된 페이지)

```typescript
// app/(main)/dashboard/page.tsx
'use client';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) return <div>Loading...</div>;
  if (!user) return null;

  return <div>대시보드</div>;
}
```

## 로그인 화면 컴포넌트 핵심

```typescript
// app/(auth)/login/page.tsx
'use client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { signInWithGoogle, signInWithEmail } from '@/lib/firebase/auth';

export default function LoginPage() {
  // ... 폼 상태 관리
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md p-8">
        <CardContent>
          <h1 className="text-2xl font-bold text-center mb-6">PhotoLog 로그인</h1>
          
          {/* Google 로그인 */}
          <Button 
            onClick={signInWithGoogle}
            className="w-full bg-white border-2 border-background-subtle text-foreground hover:bg-background-subtle rounded-full"
          >
            Google로 계속하기
          </Button>
          
          <div className="my-4 flex items-center">
            <div className="flex-1 h-px bg-background-subtle" />
            <span className="px-3 text-sm text-foreground-muted">또는</span>
            <div className="flex-1 h-px bg-background-subtle" />
          </div>
          
          {/* 이메일 로그인 */}
          <Input type="email" placeholder="이메일" className="mb-3" />
          <Input type="password" placeholder="비밀번호" className="mb-4" />
          <Button className="w-full bg-primary-300 hover:bg-primary-400 text-white rounded-full">
            로그인
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

## 사용량 제한 (MVP)

| 플랜 | 블로그/다이어리 | 영상 |
|---|---|---|
| Free | 월 5편 | 월 1편 |
| Pro (추후) | 무제한 | 월 30편 |

월 사용량 초기화는 Cloud Function (Firebase) 또는 Vercel Cron으로:
```typescript
// 매월 1일 00:00 KST에 monthResetAt 갱신
```

## 보안 체크리스트

- [ ] Firestore 보안 규칙: 본인 uid만 read/write
- [ ] Storage 보안 규칙: 본인 폴더만 접근
- [ ] API Routes: 매 요청마다 ID Token 검증
- [ ] Admin SDK는 절대 클라이언트 노출 X
- [ ] 이메일 인증 미완료 사용자는 글 생성 제한 (선택)
