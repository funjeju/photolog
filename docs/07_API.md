# 07. API 엔드포인트

## 개요

모든 API는 Next.js API Routes (`app/api/*`)로 구현.
인증된 요청만 허용 — 매 요청 Firebase ID Token 검증.

## 인증 미들웨어

모든 보호된 API에서 사용:

```typescript
// lib/api/auth.ts
import { getAuth } from 'firebase-admin/auth';
import { adminApp } from '@/lib/firebase/admin';
import { NextRequest } from 'next/server';

export async function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: 'Unauthorized', uid: null };
  }
  
  const token = authHeader.substring(7);
  try {
    const decoded = await getAuth(adminApp).verifyIdToken(token);
    return { uid: decoded.uid, error: null };
  } catch {
    return { error: 'Invalid token', uid: null };
  }
}
```

클라이언트 호출:
```typescript
const token = await auth.currentUser?.getIdToken();
const res = await fetch('/api/posts/create', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ ... }),
});
```

## 엔드포인트 목록

### Posts (글)

#### `POST /api/posts/create` — 글 생성 (메인 파이프라인)

**Request:**
```typescript
{
  mode: 'blog' | 'diary';
  photoUrls: string[];                    // Storage 업로드 후 URL 배열
  options: {
    tone: string;                          // '정보형' | '감성형' | '리뷰형' 등
    title?: string;                        // 비우면 AI 자동 생성
  };
}
```

**Response:**
```typescript
{
  postId: string;
  status: 'processing' | 'completed';
}
```

**내부 처리 순서:**
1. 사용량 체크 (이번 달 한도 초과 시 거부)
2. 각 사진별 EXIF 파싱 (`exifr`)
3. GPS → Kakao Maps 역지오코딩 (병렬)
4. 사진별 Clova OCR (병렬)
5. 사진별 Gemini Vision 묘사 (병렬)
6. 시간순 정렬 → 위치 클러스터링 (50m 이내 = 같은 단락)
7. LLM에게 단락별 글 + scenes JSON 생성 요청
8. Firestore에 posts/{postId} + photos/{photoId} 저장
9. 사용량 카운트 증가
10. postId 반환

**에러 응답:**
- 401 — 인증 실패
- 403 — 사용량 초과
- 400 — 사진 부족 (3장 미만) 또는 EXIF 없음
- 500 — AI API 오류 (재시도 1회 후 실패)

#### `GET /api/posts` — 사용자 글 목록

**Query Params:**
```
?mode=blog | diary | all   (기본: all)
?limit=20                  (기본: 20, 최대: 50)
?cursor=...                (페이지네이션 커서)
?orderBy=createdAt         (createdAt | updatedAt)
?order=desc                (asc | desc)
```

**Response:**
```typescript
{
  posts: Post[];
  nextCursor?: string;
}
```

#### `GET /api/posts/[postId]` — 글 상세

**Response:**
```typescript
{
  post: Post;
  photos: Photo[];
  video?: Video;
}
```

#### `PATCH /api/posts/[postId]` — 글 수정

**Request:**
```typescript
{
  title?: string;
  scenes?: Scene[];
  tags?: string[];
}
```

#### `DELETE /api/posts/[postId]` — 글 삭제

연관된 photos, videos, Storage 파일도 함께 삭제.

### Videos (영상)

#### `POST /api/videos/create` — 영상 생성

**Request:**
```typescript
{
  postId: string;
  format: '9:16' | '16:9' | '1:1';
  bgm?: 'lofi' | 'acoustic' | 'cinematic';
}
```

**Response:**
```typescript
{
  videoId: string;
  status: 'queued';
}
```

**내부 처리:**
1. 사용량 체크
2. Firestore에서 post.scenes 가져오기
3. 각 scene.narration → ElevenLabs TTS 호출 → mp3 파일 생성 → Storage 업로드
4. videos/{videoId} 문서 생성 (status: 'rendering')
5. Remotion Lambda에 렌더링 요청 (props: scenes + ttsUrls + bgm + format)
6. Webhook URL 등록 (완료 시 콜백)
7. videoId 반환

> 클라이언트는 polling 또는 onSnapshot으로 status 변화 감지.

#### `GET /api/videos/[videoId]` — 영상 상태/다운로드 URL

**Response:**
```typescript
{
  video: Video;
}
```

#### `POST /api/webhooks/remotion` — Remotion Lambda 완료 콜백

Remotion에서 렌더링 완료 시 호출:
```typescript
{
  renderId: string;
  outputUrl: string;
  duration: number;
}
```

처리:
1. videos/{videoId} 찾기 (lambdaRequestId로)
2. Storage에 결과 mp4 복사
3. status: 'completed' + downloadUrl 업데이트
4. 사용량 카운트 증가

### User

#### `GET /api/user/usage` — 사용량 조회

**Response:**
```typescript
{
  blogPostsThisMonth: number;
  diaryEntriesThisMonth: number;
  videosThisMonth: number;
  limits: {
    posts: number;     // Free: 5
    videos: number;    // Free: 1
  };
  resetAt: string;     // ISO date
}
```

## 핵심 파이프라인 코드 예시

### 글 생성 API 핵심 (`app/api/posts/create/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/api/auth';
import { extractExif } from '@/lib/exif/parser';
import { reverseGeocode } from '@/lib/maps/kakao';
import { extractOCR } from '@/lib/ocr/clova';
import { describeImage } from '@/lib/ai/gemini-vision';
import { generatePost } from '@/lib/ai/llm';
import { adminDb } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  const { uid, error } = await verifyAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });

  const { mode, photoUrls, options } = await request.json();

  // 1. 사용량 체크
  const usage = await checkUsage(uid, mode);
  if (!usage.allowed) {
    return NextResponse.json({ error: 'Usage limit exceeded' }, { status: 403 });
  }

  // 2~5. 사진별 데이터 추출 (병렬)
  const photosData = await Promise.all(
    photoUrls.map(async (url) => {
      const exif = await extractExif(url);
      const [address, ocr, vision] = await Promise.all([
        exif.gps ? reverseGeocode(exif.gps) : null,
        extractOCR(url),
        describeImage(url),
      ]);
      return { url, exif, address, ocr, vision };
    })
  );

  // 6. 시간순 정렬 + 위치 클러스터링
  const sorted = photosData.sort((a, b) => 
    a.exif.capturedAt - b.exif.capturedAt
  );
  const clusters = clusterByLocation(sorted, 50); // 50m 반경

  // 7. LLM 글 생성
  const generated = await generatePost({
    mode,
    tone: options.tone,
    clusters,
    title: options.title,
  });

  // 8. Firestore 저장
  const postRef = adminDb.collection('users').doc(uid).collection('posts').doc();
  await postRef.set({
    postId: postRef.id,
    userId: uid,
    mode,
    title: generated.title,
    scenes: generated.scenes,
    status: 'completed',
    totalPhotos: photoUrls.length,
    tags: generated.tags,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // photos 서브컬렉션 저장 (병렬)
  await Promise.all(
    photosData.map((data, i) => 
      postRef.collection('photos').doc().set({
        ...mapPhotoData(data),
        order: i,
      })
    )
  );

  // 9. 사용량 증가
  await incrementUsage(uid, mode);

  // 10. postId 반환
  return NextResponse.json({
    postId: postRef.id,
    status: 'completed',
  });
}
```

## 에러 처리 표준

```typescript
{
  error: string;          // 사용자에게 표시할 메시지
  code?: string;          // 'USAGE_EXCEEDED', 'NO_EXIF' 등
  details?: any;          // 디버깅용
}
```

상태 코드:
- 200 — 성공
- 400 — 잘못된 요청
- 401 — 인증 실패
- 403 — 권한 없음 (사용량 초과 포함)
- 404 — 리소스 없음
- 429 — Rate limit
- 500 — 서버 오류

## Rate Limiting (추후)

Upstash Redis로 IP/User 기반 Rate limit:
- 글 생성: 10회/분
- 영상 생성: 5회/분
- 일반 조회: 100회/분

## 비동기 처리 패턴

영상 생성은 비동기:
1. POST `/api/videos/create` → `videoId` + status: queued 즉시 반환
2. 클라이언트는 Firestore `videos/{videoId}` onSnapshot으로 실시간 감지
3. status: 'completed' 되면 다운로드 URL 사용 가능

```typescript
// 클라이언트
import { onSnapshot, doc } from 'firebase/firestore';

const unsub = onSnapshot(doc(db, `users/${uid}/videos/${videoId}`), (snap) => {
  const video = snap.data();
  if (video.status === 'completed') {
    // 다운로드 URL 표시
  }
});
```
