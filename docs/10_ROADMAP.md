# 10. 개발 로드맵 (8주 MVP)

## 전체 일정

| Phase | 기간 | 핵심 산출물 |
|---|---|---|
| Phase 1 | 1주 | 프로젝트 셋업 + 디자인 시스템 |
| Phase 2 | 1주 | 인증 + 공통 레이아웃 + 랜딩 |
| Phase 3 | 2주 | 사진 업로드 + AI 글 생성 파이프라인 |
| Phase 4 | 1주 | 마이페이지 + 대시보드 |
| Phase 5 | 2주 | Remotion 영상 생성 |
| Phase 6 | 1주 | 마무리 + 베타 배포 |

> **클로드 코드 1인 풀타임 기준**. 다른 일과 병행 시 1.5~2배 잡으세요.

---

## Phase 1: 프로젝트 셋업 (1주)

### 목표
Next.js + Firebase + shadcn 환경 완성, Soft & Friendly 테마 적용 끝.

### 작업 목록
- [ ] Next.js 14 프로젝트 생성 (`create-next-app`)
- [ ] TypeScript 설정
- [ ] Tailwind CSS + Soft & Friendly 컬러 토큰 적용
- [ ] Pretendard 폰트 로딩
- [ ] shadcn/ui 초기화 + 기본 컴포넌트 설치
- [ ] shadcn CSS 변수 → Soft & Friendly 테마로 오버라이드
- [ ] Firebase 프로젝트 생성 (콘솔)
- [ ] Firebase Client/Admin SDK 연동
- [ ] Firestore + Storage 보안 규칙 작성
- [ ] Vercel 프로젝트 연결 + 환경변수 설정
- [ ] GitHub 리포 초기화

### 클로드 코드 프롬프트 예시
```
다음 문서를 참조해서 PhotoLog 프로젝트를 셋업해줘:
- 01_OVERVIEW.md
- 02_DESIGN_SYSTEM.md
- 03_TECH_STACK.md

요구사항:
1. Next.js 14 App Router + TypeScript
2. Tailwind에 Soft & Friendly 컬러 토큰 적용
3. shadcn/ui 초기화 (button, card, input, tabs, dialog, sheet, avatar, badge, sonner)
4. Firebase Client + Admin 셋업 (env 변수는 placeholder로)
5. globals.css에 디자인 시스템 변수 박기
```

### 검증 기준
- [ ] `npm run dev` 실행 시 베이지 배경 페이지 보임
- [ ] shadcn Button을 화면에 띄웠을 때 primary-300 그린 색상
- [ ] Pretendard 폰트 로딩 확인

---

## Phase 2: 인증 + 공통 레이아웃 + 랜딩 (1주)

### 목표
로그인 흐름 완성, 사이드바 + 헤더 공통 레이아웃 완성, 랜딩 페이지 띄우기.

### 작업 목록
- [ ] Firebase Auth 활성화 (Google + Email/Password)
- [ ] AuthContext 구현 (`contexts/AuthContext.tsx`)
- [ ] 로그인 페이지 (`/login`)
- [ ] 회원가입 페이지 (`/signup`) + 이메일 인증
- [ ] 보호된 라우트 처리
- [ ] Sidebar 컴포넌트 (시안 기반)
- [ ] Header 컴포넌트 (인사말 + 알림 + 프로필)
- [ ] `(main)` 레이아웃 (Sidebar + Header)
- [ ] 랜딩 페이지 (`/`) — Hero, 기능 카드, FAQ
- [ ] users/{uid} 자동 생성 로직

### 클로드 코드 프롬프트
```
04_AUTH.md, 06_PAGES_UI.md 참조해서:
1. Firebase Auth 연동 (Google + Email)
2. AuthContext 구현
3. 로그인/회원가입 화면 (Soft & Friendly 톤)
4. 사이드바 + 헤더 공통 레이아웃
5. 랜딩 페이지 Hero 섹션
```

### 검증 기준
- [ ] Google 로그인 시 users/{uid} 문서 자동 생성
- [ ] 로그인 후 /dashboard로 자동 이동
- [ ] 사이드바 활성 메뉴 인디케이터 작동

---

## Phase 3: 사진 업로드 + AI 글 생성 (2주)

### 목표
**프로젝트 핵심 기능.** 사진 업로드부터 글 생성까지 완성.

### Week 1
- [ ] PhotoDropzone 컴포넌트 (`react-dropzone`)
- [ ] 클라이언트 EXIF 미리 파싱 (`exifr`)
- [ ] 사진 시간순 미리보기
- [ ] Storage 업로드 (병렬)
- [ ] ModeSelector + ToneSelector 컴포넌트
- [ ] 업로드 화면 (`/upload`) 완성

### Week 2
- [ ] EXIF 파싱 라이브러리 (`lib/exif/parser.ts`)
- [ ] Kakao 역지오코딩 (`lib/maps/kakao.ts`)
- [ ] Clova OCR 연동 (`lib/ocr/clova.ts`)
- [ ] Gemini Vision 연동 (`lib/ai/gemini-vision.ts`)
- [ ] 위치 클러스터링 알고리즘 (`lib/utils/clustering.ts`)
- [ ] LLM 글 생성 (`lib/ai/llm.ts`) — 블로그/다이어리 모드
- [ ] `POST /api/posts/create` 엔드포인트
- [ ] 글 결과 화면 (`/post/[postId]`) — Scene 카드 + 편집

### 클로드 코드 프롬프트 (분할)
```
1차 세션: "06_PAGES_UI.md, 07_API.md 참조. 사진 업로드 화면 + Storage 업로드 구현"
2차 세션: "08_AI_PROMPTS.md 참조. EXIF + 역지오코딩 + OCR + Vision 통합 함수 작성"
3차 세션: "08_AI_PROMPTS.md 참조. LLM 글 생성 함수 + 글 생성 API 엔드포인트"
4차 세션: "06_PAGES_UI.md 참조. 글 결과 화면 + Scene 카드 컴포넌트"
```

### 검증 기준
- [ ] 사진 5장 던지면 30~60초 내 글 생성됨
- [ ] scenes JSON에 timestamp, location, narration 정상 포함
- [ ] 사용량 카운트 정상 증가

---

## Phase 4: 마이페이지 + 대시보드 (1주)

### 목표
글 목록 + 통계 시각화 완성.

### 작업 목록
- [ ] 마이페이지 (`/mypage`) — 블로그/다이어리 탭
- [ ] PostGrid 컴포넌트
- [ ] PostCard 컴포넌트
- [ ] 검색·정렬·필터
- [ ] 빈 상태 (Empty State) 디자인
- [ ] 대시보드 (`/dashboard`) — 4개 StatCard
- [ ] TrendChart (Recharts LineChart)
- [ ] ModeRatioChart (Recharts PieChart)
- [ ] 최근 글 + 알림 카드
- [ ] 글 편집 기능 (단락 수정, 순서 변경)
- [ ] 글 삭제 기능

### 클로드 코드 프롬프트
```
06_PAGES_UI.md 참조해서:
1. 마이페이지 탭 분리 (블로그/다이어리)
2. PostGrid + PostCard 카드 디자인 (Soft & Friendly)
3. 대시보드 4-카드 + Recharts 차트
4. 빈 상태 일러스트 (storyset 활용 안내)
```

---

## Phase 5: Remotion 영상 생성 (2주)

### 목표
글 → 영상 자동 변환 완성.

### Week 1 — Remotion 셋업 + 컴포넌트
- [ ] Remotion 설치
- [ ] `/remotion` 폴더 + Root.tsx + Video.tsx
- [ ] Scene 컴포넌트 5종 (arrival, menu, view, moment, summary)
- [ ] Ken Burns 효과
- [ ] 자막 디자인 (Soft & Friendly 톤)
- [ ] 트랜지션 (페이드 + 슬라이드)
- [ ] BGM 3종 추가
- [ ] Remotion Studio로 로컬 테스트

### Week 2 — TTS + Lambda
- [ ] ElevenLabs TTS 연동 (`lib/tts/elevenlabs.ts`)
- [ ] AWS 계정 + Lambda IAM 설정
- [ ] Remotion Lambda 배포
- [ ] `POST /api/videos/create` 엔드포인트
- [ ] Webhook 엔드포인트 (`/api/webhooks/remotion`)
- [ ] 영상 목록 페이지 (`/mypage/videos`)
- [ ] 클라이언트 폴링/실시간 감지 (Firestore onSnapshot)

### 클로드 코드 프롬프트 (분할)
```
1차: "09_VIDEO_REMOTION.md 참조. Remotion 컴포넌트 5종 + Video.tsx 작성"
2차: "09_VIDEO_REMOTION.md 참조. ElevenLabs TTS + Lambda 렌더링 API"
3차: "06_PAGES_UI.md 참조. 영상 목록 화면 + 진행 상태 표시"
```

### 검증 기준
- [ ] Studio에서 30초 영상 미리보기 가능
- [ ] Lambda 렌더링 후 mp4 다운로드 가능
- [ ] 자막·BGM·TTS 정상 작동

---

## Phase 6: 마무리 + 베타 배포 (1주)

### 작업 목록
- [ ] 사용량 제한 로직 정밀화
- [ ] 에러 처리 + Sonner 토스트
- [ ] 로딩 상태 (Skeleton)
- [ ] 반응형 (모바일 대응)
- [ ] SEO 메타 태그
- [ ] Google Analytics 연동
- [ ] Sentry 에러 트래킹 (선택)
- [ ] 베타 사용자 5~10명 모집
- [ ] 피드백 수집 폼

---

## Phase별 우선순위 핵심

### 절대 빠지면 안 되는 것
1. Phase 1 — Soft & Friendly 디자인 토큰 (이거 안 박으면 나중에 다 다시 함)
2. Phase 3 — 글 생성 파이프라인 (프로젝트의 본질)
3. Phase 5 — Remotion (차별화의 핵심)

### 미루거나 줄여도 되는 것
- 대시보드 차트 → 단순 카드로만 시작 가능
- 빈 상태 일러스트 → 텍스트로 대체 가능
- 다이어리 모드 → 블로그 모드만으로 MVP 가능 (Phase 4까지 미룰 수 있음)
- 자동 발행 → 다운로드 + 복사 기능만으로 시작

## 체크 포인트

### Phase 3 끝 (4주차)
**핵심 검증:** 사진 5장 → 블로그 글 정상 생성?
- 안 되면 Phase 5(영상)는 의미 없음. 여기서 다 잡고 가야 함.

### Phase 5 끝 (8주차)
**핵심 검증:** 글 → 영상 한 번에 나오는가?
- 베타 5명에게 던져보고 피드백 받기

## 일정 늦어질 때 대응

### 우선순위 컷
가장 먼저 자르는 순서:
1. 영상 BGM 3종 → 1종으로
2. 다이어리 모드 → Phase 6으로 미루기
3. 대시보드 차트 → 카드만
4. 자동 발행 기능 → 다음 버전

### 절대 자르면 안 됨
- 글 생성 핵심 파이프라인 (EXIF/OCR/Vision/LLM)
- 영상 생성 (Remotion 기본)
- 인증
