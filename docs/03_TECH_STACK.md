# 03. 기술 스택

## 확정 스택

| 영역 | 기술 | 비고 |
|---|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript | |
| Styling | Tailwind CSS + shadcn/ui | Soft & Friendly 테마 적용 |
| Backend | Next.js API Routes | |
| Database | Firebase Firestore | |
| Storage | Firebase Storage | 사진·영상·TTS 음성 |
| Auth | Firebase Authentication | Google + Email/Password |
| Hosting | Vercel | |
| Video Render | Remotion + AWS Lambda | Remotion Lambda |

## 외부 API

| 용도 | API | 비용 |
|---|---|---|
| 사진 분석 | Gemini Vision API (Flash-Lite) | 단가 최저, 속도 빠름 |
| 글 생성 | Gemini 2.0 Flash 또는 Claude Haiku | 비교 후 결정 |
| OCR | Naver Clova OCR | 한국어 OCR 최강 |
| 역지오코딩 | Kakao Maps API | 무료 |
| TTS | ElevenLabs 또는 Naver Clova Voice | 영상 내레이션 |
| EXIF 파싱 | exifr (npm 라이브러리) | 무료 |

## 설치 명령어

### Next.js + TypeScript
```bash
npx create-next-app@latest photolog --typescript --tailwind --app --src-dir=false
cd photolog
```

### shadcn/ui
```bash
npx shadcn@latest init
npx shadcn@latest add button card input textarea tabs dialog sheet avatar badge progress skeleton sonner dropdown-menu accordion select separator tooltip
```

### Firebase
```bash
npm install firebase firebase-admin
```

### 기타 라이브러리
```bash
npm install exifr                          # EXIF 파싱
npm install @google/generative-ai          # Gemini
npm install @anthropic-ai/sdk              # Claude
npm install recharts                       # 대시보드 차트
npm install react-dropzone                 # 사진 업로드
npm install date-fns                       # 날짜 포매팅
npm install lucide-react                   # 아이콘
```

### Remotion (Phase 5에서)
```bash
npm install remotion @remotion/cli @remotion/lambda
```

## 환경변수 (.env.local)

```bash
# Firebase Client
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin (Server)
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=

# AI APIs
GEMINI_API_KEY=
CLAUDE_API_KEY=

# OCR
CLOVA_OCR_SECRET=
CLOVA_OCR_INVOKE_URL=

# Maps
KAKAO_REST_API_KEY=

# TTS
ELEVENLABS_API_KEY=

# Remotion Lambda (Phase 5)
REMOTION_AWS_ACCESS_KEY_ID=
REMOTION_AWS_SECRET_ACCESS_KEY=
REMOTION_AWS_REGION=ap-northeast-2
REMOTION_LAMBDA_FUNCTION_NAME=
```

## 외부 서비스 가입 체크리스트

### Phase 1 (필수)
- [ ] Firebase 콘솔 프로젝트 생성
- [ ] Vercel 계정 + GitHub 연동
- [ ] Google Cloud 프로젝트 (Gemini API)
- [ ] Anthropic Console (Claude API)

### Phase 3 (글 생성 시점)
- [ ] Naver Cloud Platform 가입 + Clova OCR 활성화
- [ ] Kakao Developers 가입 + Maps API 키 발급

### Phase 5 (영상 생성 시점)
- [ ] AWS 계정 + Lambda 권한 설정
- [ ] ElevenLabs 계정 + API 키

## 버전 권장사항

```json
{
  "node": ">=20.0.0",
  "next": "^14.2.0",
  "react": "^18.3.0",
  "typescript": "^5.5.0",
  "tailwindcss": "^3.4.0"
}
```

## 배포 환경

### Vercel
- Production: `main` 브랜치 자동 배포
- Preview: PR 생성 시 자동 배포
- 환경변수는 Vercel Dashboard에서 설정

### Firebase
- Firestore 보안 규칙은 [13_DEV_GUIDELINES.md](./13_DEV_GUIDELINES.md) 참조
- Storage 보안 규칙도 동일

### Domain (추후)
- 베타: `photolog.vercel.app`
- 정식: 별도 도메인 구매
