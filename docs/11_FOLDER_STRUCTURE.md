# 11. 폴더 구조

## 전체 디렉토리

```
photolog/
├── app/                              # Next.js App Router
│   ├── (auth)/                       # 비로그인 그룹 (사이드바 없음)
│   │   ├── layout.tsx                # 인증 페이지 공통 레이아웃
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── signup/
│   │       └── page.tsx
│   │
│   ├── (main)/                       # 로그인 그룹 (사이드바 + 헤더)
│   │   ├── layout.tsx                # 메인 레이아웃 (Sidebar + Header)
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── upload/
│   │   │   └── page.tsx
│   │   ├── post/
│   │   │   └── [postId]/
│   │   │       └── page.tsx
│   │   ├── mypage/
│   │   │   ├── page.tsx              # 블로그/다이어리 탭
│   │   │   └── videos/
│   │   │       └── page.tsx
│   │   └── settings/
│   │       └── page.tsx
│   │
│   ├── api/                          # API Routes
│   │   ├── posts/
│   │   │   ├── create/
│   │   │   │   └── route.ts
│   │   │   ├── route.ts              # GET (목록)
│   │   │   └── [postId]/
│   │   │       └── route.ts          # GET, PATCH, DELETE
│   │   ├── videos/
│   │   │   ├── create/
│   │   │   │   └── route.ts
│   │   │   └── [videoId]/
│   │   │       └── route.ts
│   │   ├── user/
│   │   │   └── usage/
│   │   │       └── route.ts
│   │   └── webhooks/
│   │       └── remotion/
│   │           └── route.ts          # Lambda 콜백
│   │
│   ├── layout.tsx                    # 루트 레이아웃 (폰트, AuthProvider)
│   ├── page.tsx                      # 랜딩 페이지
│   ├── globals.css                   # Tailwind + 디자인 토큰
│   └── favicon.ico
│
├── components/
│   ├── ui/                           # shadcn/ui (자동 생성)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── ...
│   │
│   ├── layout/
│   │   ├── Sidebar.tsx               # 좌측 사이드바
│   │   ├── Header.tsx                # 상단 헤더
│   │   └── MobileMenu.tsx            # 모바일 햄버거
│   │
│   ├── landing/
│   │   ├── Hero.tsx
│   │   ├── FeatureCards.tsx
│   │   ├── HowItWorks.tsx
│   │   └── FAQ.tsx
│   │
│   ├── upload/
│   │   ├── PhotoDropzone.tsx
│   │   ├── PhotoPreview.tsx
│   │   ├── ModeSelector.tsx
│   │   ├── ToneSelector.tsx
│   │   └── GenerationProgress.tsx
│   │
│   ├── post/
│   │   ├── PostEditor.tsx            # 전체 편집 컨테이너
│   │   ├── SceneCard.tsx             # 단락 1개
│   │   ├── PostSidebar.tsx           # 우측 액션 패널
│   │   └── VideoGenerationDialog.tsx
│   │
│   ├── dashboard/
│   │   ├── StatCard.tsx              # 4개 상단 카드
│   │   ├── TrendChart.tsx            # 작성 추이 라인 차트
│   │   ├── ModeRatioChart.tsx        # 도넛 차트
│   │   ├── RecentPostsList.tsx
│   │   └── NotificationList.tsx
│   │
│   ├── mypage/
│   │   ├── PostGrid.tsx
│   │   ├── PostCard.tsx
│   │   ├── FilterBar.tsx
│   │   └── EmptyState.tsx
│   │
│   └── common/
│       ├── LoadingSpinner.tsx
│       ├── ErrorBoundary.tsx
│       └── Illustration.tsx
│
├── contexts/
│   └── AuthContext.tsx
│
├── hooks/
│   ├── useAuth.ts
│   ├── usePost.ts
│   ├── useVideo.ts
│   └── useUsage.ts
│
├── lib/
│   ├── firebase/
│   │   ├── client.ts                 # Client SDK
│   │   ├── admin.ts                  # Admin SDK
│   │   └── auth.ts                   # 인증 헬퍼
│   │
│   ├── ai/
│   │   ├── gemini-vision.ts
│   │   ├── llm.ts                    # 글 생성
│   │   └── prompts.ts                # 프롬프트 정의
│   │
│   ├── exif/
│   │   └── parser.ts
│   │
│   ├── ocr/
│   │   └── clova.ts
│   │
│   ├── maps/
│   │   └── kakao.ts
│   │
│   ├── tts/
│   │   └── elevenlabs.ts
│   │
│   ├── video/
│   │   └── render.ts                 # Remotion Lambda 호출
│   │
│   ├── api/
│   │   ├── auth.ts                   # API 인증 미들웨어
│   │   └── errors.ts                 # 에러 처리
│   │
│   └── utils/
│       ├── clustering.ts             # 위치 클러스터링
│       ├── format.ts                 # 날짜·숫자 포매팅
│       └── cn.ts                     # className 헬퍼
│
├── remotion/                         # Remotion 영상 컴포넌트
│   ├── Root.tsx
│   ├── Video.tsx
│   ├── scenes/
│   │   ├── ArrivalScene.tsx
│   │   ├── MenuScene.tsx
│   │   ├── ViewScene.tsx
│   │   ├── MomentScene.tsx
│   │   └── SummaryScene.tsx
│   └── assets/
│       └── bgm/
│           ├── lofi.mp3
│           ├── acoustic.mp3
│           └── cinematic.mp3
│
├── types/
│   ├── index.ts                      # 공통 타입
│   ├── post.ts                       # Post, Scene, Photo 타입
│   ├── user.ts                       # User 타입
│   └── video.ts                      # Video 타입
│
├── public/
│   ├── fonts/
│   │   └── PretendardVariable.woff2
│   ├── illustrations/                # Storyset 일러스트
│   │   ├── empty-posts.svg
│   │   ├── upload-photos.svg
│   │   └── ...
│   ├── icons/
│   └── favicon.ico
│
├── docs/                             # 프로젝트 문서 (이 폴더)
│   ├── 01_OVERVIEW.md
│   ├── 02_DESIGN_SYSTEM.md
│   └── ...
│
├── .env.local
├── .env.example                      # 환경변수 템플릿
├── .gitignore
├── README.md
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── components.json                   # shadcn/ui 설정
├── firestore.rules
├── storage.rules
└── package.json
```

## 파일 명명 규칙

### 컴포넌트
- **PascalCase**: `Sidebar.tsx`, `PostCard.tsx`
- 단일 파일에 단일 컴포넌트 (export default)

### 유틸/헬퍼
- **camelCase**: `parser.ts`, `clustering.ts`
- 함수 export

### API Routes
- **route.ts** 고정 (Next.js 규칙)
- HTTP 메서드별 함수 export: `GET`, `POST`, `PATCH`, `DELETE`

### 타입
- 인터페이스/타입은 **PascalCase**: `Post`, `Scene`
- 파일은 **lowercase**: `post.ts`, `user.ts`

## 라우트 그룹 활용

### `(auth)` 그룹
인증 페이지 공통 레이아웃 (사이드바 X):
```typescript
// app/(auth)/layout.tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      {children}
    </div>
  );
}
```

### `(main)` 그룹
로그인 후 페이지 공통 레이아웃 (사이드바 + 헤더):
```typescript
// app/(main)/layout.tsx
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 ml-60">
        <Header />
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
```

## Import 경로 규칙

### tsconfig.json `paths` 설정
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"],
      "@/components/*": ["./components/*"],
      "@/lib/*": ["./lib/*"],
      "@/types/*": ["./types/*"],
      "@/hooks/*": ["./hooks/*"]
    }
  }
}
```

### 사용 예
```typescript
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/firebase/client';
import type { Post } from '@/types/post';
import { useAuth } from '@/hooks/useAuth';
```

상대경로 (`../../../`) 사용 금지.

## .gitignore

```
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/

# Next.js
.next/
out/

# Production
build/
dist/

# Environment
.env*.local

# Vercel
.vercel/

# IDE
.vscode/
.idea/

# Logs
*.log
npm-debug.log*

# OS
.DS_Store
Thumbs.db

# Firebase
.firebase/
firebase-debug.log

# Remotion
remotion-output/
```

## .env.example (템플릿)

```bash
# Firebase Client (NEXT_PUBLIC_*는 클라이언트 노출 OK)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin (SERVER ONLY — 절대 NEXT_PUBLIC_ 금지)
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=

# AI APIs
GEMINI_API_KEY=
CLAUDE_API_KEY=

# OCR / Maps / TTS
CLOVA_OCR_SECRET=
CLOVA_OCR_INVOKE_URL=
KAKAO_REST_API_KEY=
ELEVENLABS_API_KEY=

# Remotion Lambda
REMOTION_AWS_ACCESS_KEY_ID=
REMOTION_AWS_SECRET_ACCESS_KEY=
REMOTION_AWS_REGION=ap-northeast-2
REMOTION_LAMBDA_FUNCTION_NAME=
REMOTION_SITE_NAME=
REMOTION_S3_BUCKET=
REMOTION_WEBHOOK_SECRET=
```
