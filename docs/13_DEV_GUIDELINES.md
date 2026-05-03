# 13. 개발 가이드라인 & 주의사항

> 클로드 코드 작업 시 반드시 지켜야 할 원칙

## 보안 원칙

### 1. Firebase 보안 규칙 — 처음부터 엄격하게

**절대 하면 안 됨:**
```javascript
// 모두에게 read/write 허용 — 사고남
allow read, write: if true;
```

**올바른 패턴:**
```javascript
// 본인 것만 read/write
match /users/{uid}/{document=**} {
  allow read, write: if request.auth != null && request.auth.uid == uid;
}
```

자세한 규칙은 [05_DATA_MODEL.md](./05_DATA_MODEL.md) 참조.

### 2. API 키는 절대 클라이언트 노출 X

**금지:**
```typescript
// 클라이언트 코드에 API 키 박기 — 절대 금지
const GEMINI_KEY = "AIza...";
```

**올바른 패턴:**
```typescript
// 환경변수는 서버 전용
// .env.local
GEMINI_API_KEY=...   (NEXT_PUBLIC_ 접두사 없음)

// app/api/posts/create/route.ts (서버에서만 사용)
const apiKey = process.env.GEMINI_API_KEY;
```

`NEXT_PUBLIC_` 접두사는 **Firebase Client SDK에만** 사용 (이건 클라이언트 노출 OK).
**API 키, OCR 시크릿, AWS 키 등은 절대 NEXT_PUBLIC_ 금지.**

### 3. API Routes에서 매번 ID Token 검증

```typescript
export async function POST(request: NextRequest) {
  const { uid, error } = await verifyAuth(request);  // 필수
  if (error) return NextResponse.json({ error }, { status: 401 });
  
  // ... 비즈니스 로직
}
```

### 4. Firestore 데이터 검증
LLM이나 사용자 입력을 그대로 Firestore에 저장하지 말 것:
```typescript
// ❌ 위험
await postRef.set(req.body);

// ✅ 안전
await postRef.set({
  title: sanitize(body.title).slice(0, 100),
  scenes: validateScenes(body.scenes),
  // ...
});
```

## 성능 원칙

### 1. EXIF는 클라이언트에서 미리 파싱
서버 호출 전에 클라이언트에서 EXIF 미리 추출:
```typescript
// 클라이언트
import exifr from 'exifr';

const exif = await exifr.parse(file);
if (!exif?.DateTimeOriginal) {
  alert('EXIF 정보가 없는 사진입니다.');
  return;
}
```

이유: 서버 호출 줄임, 사용자에게 즉시 미리보기 제공.

### 2. 사진 분석은 병렬 처리
```typescript
// ❌ 순차 처리 (느림)
for (const photo of photos) {
  await processPhoto(photo);
}

// ✅ 병렬 처리 (빠름)
await Promise.all(photos.map(processPhoto));
```

### 3. LLM 응답은 항상 JSON 모드 강제
```typescript
const model = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash',
  generationConfig: {
    responseMimeType: 'application/json',  // 필수
    temperature: 0.7,
  },
});
```

JSON 파싱 실패 시 1회 재시도 로직 필수.

### 4. Firestore 쿼리 인덱스 미리 생성
처음 쿼리 날릴 때 콘솔 에러로 인덱스 생성 링크 뜸 → 클릭하면 자동 생성.
또는 `firestore.indexes.json`에 미리 정의:

```json
{
  "indexes": [
    {
      "collectionGroup": "posts",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "mode", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

### 5. 영상 렌더링은 비동기
영상 생성은 30초~2분 걸림. 절대 동기 처리 X.
```typescript
// ❌ 절대 금지
const video = await renderVideo(scenes);  // 응답 타임아웃

// ✅ 비동기 + 폴링
const { videoId } = await queueRender(scenes);
return { videoId, status: 'queued' };
// 클라이언트는 onSnapshot으로 상태 감시
```

## 코드 품질 원칙

### 1. TypeScript 엄격 모드
`tsconfig.json`:
```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

`any` 타입 사용 최소화. 정 필요하면 `unknown` 후 타입 가드.

### 2. 컴포넌트는 단일 책임
```typescript
// ❌ 복잡한 단일 컴포넌트
function PostPage() {
  // 100줄 코드...
}

// ✅ 분리
function PostPage() {
  return (
    <div>
      <PostHeader />
      <SceneList />
      <PostSidebar />
    </div>
  );
}
```

### 3. 클라이언트/서버 컴포넌트 명확히 구분
- 기본은 Server Component
- 상태·이벤트 필요할 때만 `'use client'`

```typescript
// 'use client'  ← 필요 없으면 제거

export default function MyComponent() {
  // 서버에서 렌더링 (더 빠름)
}
```

### 4. shadcn/ui 컴포넌트는 그대로 쓰지 말고 테마 적용
```typescript
// ❌ 기본 그대로
<Button>클릭</Button>

// ✅ Soft & Friendly 테마 적용
<Button className="bg-primary-300 hover:bg-primary-400 text-white rounded-full">
  클릭
</Button>
```

[02_DESIGN_SYSTEM.md](./02_DESIGN_SYSTEM.md) 참조.

## 사용자 경험 원칙

### 1. 로딩 상태 항상 표시
```typescript
{isLoading ? (
  <Skeleton className="h-32 w-full" />
) : (
  <PostCard post={post} />
)}
```

### 2. 에러는 토스트로 친절하게
```typescript
import { toast } from 'sonner';

try {
  await createPost(data);
  toast.success('글이 생성됐어요!');
} catch (error) {
  toast.error('생성에 실패했어요. 다시 시도해주세요.');
}
```

### 3. 사용량 초과 시 안내
```typescript
if (usage.exceeded) {
  toast.error('이번 달 사용량을 모두 사용했어요. Pro 플랜으로 업그레이드해보세요.');
  return;
}
```

### 4. EXIF 없는 사진 명확히 안내
```typescript
if (!exif?.DateTimeOriginal) {
  alert('EXIF 정보가 없는 사진은 사용할 수 없어요.\n카메라로 직접 찍은 사진을 올려주세요.');
}
```

카카오톡으로 전송된 사진은 EXIF 제거됨 — 사용자에게 안내 필요.

## 테스트 원칙

### 우선순위
1. **글 생성 파이프라인** — EXIF/OCR/Vision/LLM 통합 (최우선)
2. **결제·사용량 카운팅** — 돈 관련은 무조건 테스트
3. **인증 흐름** — 로그인/회원가입

### 권장 도구
- Vitest (유닛 테스트)
- Playwright (E2E, 선택)

## 배포 원칙

### Vercel
- `main` 브랜치 → Production 자동 배포
- PR 생성 → Preview 배포 자동
- 환경변수는 Vercel 대시보드에서 설정 (절대 코드에 박지 말 것)

### Firebase
- `firebase deploy --only firestore:rules`
- `firebase deploy --only storage`
- `firebase deploy --only firestore:indexes`

## 모니터링

### 추천 도구 (선택)
- **Sentry** — 에러 트래킹
- **Vercel Analytics** — 트래픽
- **Google Analytics 4** — 사용자 행동
- **Firebase Performance** — 성능

### 직접 확인할 것
- Gemini API 일일 호출 수 (Google Cloud Console)
- Firebase Storage 사용량 (Firebase Console)
- Lambda 실행 시간 (AWS Console)

## 클로드 코드 작업 팁

### 1. Phase별로 끊어서 작업
한 번에 다 시키면 컨텍스트 흐려짐. Phase 1 → 검증 → Phase 2 순서로.

### 2. 필요한 문서만 던지기
"전체 PRD 보고 만들어줘"보다는:
"02_DESIGN_SYSTEM.md, 06_PAGES_UI.md 읽고 사이드바 만들어줘"

### 3. 검증 먼저
새 기능 추가 후 즉시 테스트. 다음 단계 가기 전에 동작 확인.

### 4. 작은 단위로 커밋
한 PR/커밋에 너무 많은 변경 X. 기능 단위로 분리.

### 5. 막히면 문서 업데이트
PRD가 헌법이 아님. 개발하면서 더 좋은 방법 찾으면 문서도 업데이트.

## 자주 발생하는 실수

### 1. EXIF 없는 사진 처리 누락
대비책: 클라이언트에서 미리 검사, 안내 메시지

### 2. 사용량 카운팅 누락
글 생성 성공 후 반드시 `incrementUsage()` 호출

### 3. Firestore 보안 규칙 느슨하게
배포 직전 반드시 다시 확인

### 4. Storage 파일 삭제 누락
글 삭제 시 연관 사진·영상 파일도 Storage에서 삭제

### 5. 영상 렌더링 실패 시 사용량 차감 안 함
실패 시 `usage` 롤백 로직 필요

## 사진 분석 실패 케이스 처리

### EXIF 없는 사진
- 카카오톡으로 전송된 사진
- 인스타그램 다운로드한 사진
- 스크린샷
→ 사용자에게 명확히 안내, 처리에서 제외

### GPS 없는 사진
- 위치 권한 거부 상태에서 촬영
- EXIF는 있지만 GPS만 없음
→ 시간 기반 클러스터링만 적용

### OCR 텍스트 없는 사진
- 풍경 사진
- 음식 사진 (메뉴판 아님)
→ 정상. OCR 결과 없어도 본문 생성 가능

### Vision 분석 실패
- 너무 어둡거나 흐릿한 사진
- 추상적인 사진
→ 기본 묘사로 대체, 본문 생성은 진행

## 점검 체크리스트 (각 Phase 끝마다)

- [ ] Firestore 보안 규칙 검토
- [ ] 환경변수 누락 없는지 확인
- [ ] 에러 처리 누락 없는지
- [ ] 로딩 상태 표시 누락 없는지
- [ ] 모바일 화면 깨지지 않는지
- [ ] 콘솔 에러 없는지
- [ ] 무거운 함수 병렬 처리 됐는지
