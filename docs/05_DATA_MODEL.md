# 05. 데이터 모델 (Firestore)

## 컬렉션 구조

```
users/{uid}                          # 사용자 프로필
  └─ posts/{postId}                  # 블로그 또는 다이어리 글
       └─ photos/{photoId}           # 첨부 사진 메타데이터
  └─ videos/{videoId}                # 생성된 영상 메타데이터
```

## users/{uid}

```typescript
type User = {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  provider: 'google' | 'email';
  createdAt: Timestamp;
  
  plan: 'free' | 'pro' | 'business';
  
  usage: {
    blogPostsThisMonth: number;
    diaryEntriesThisMonth: number;
    videosThisMonth: number;
    monthResetAt: Timestamp;
  };
  
  // 추후 추가
  preferences?: {
    defaultMode: 'blog' | 'diary';
    defaultTone: string;
    locale: 'ko' | 'en';
  };
};
```

## users/{uid}/posts/{postId}

```typescript
type Post = {
  postId: string;
  userId: string;
  
  mode: 'blog' | 'diary';                 // 모드 — 마이페이지 탭 분리 기준
  title: string;
  status: 'draft' | 'completed' | 'failed';
  
  // 단락별 JSON — 영상 생성에 그대로 사용됨
  scenes: Scene[];
  
  // 메타데이터
  totalPhotos: number;
  primaryLocation?: string;               // 대표 장소
  dateRange: {
    start: Timestamp;
    end: Timestamp;
  };
  tags: string[];
  
  // AI 생성 옵션 기록
  generationOptions?: {
    tone: string;
    titleSource: 'auto' | 'user';
  };
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // 영상 연결
  videoId?: string;
};

type Scene = {
  id: number;
  type: 'arrival' | 'menu' | 'view' | 'moment' | 'summary';
  photoIds: string[];                     // 단락에 포함된 사진 ID들
  narration: string;                      // 단락 본문 (TTS용 + 화면 표시)
  subtitle: string;                       // 영상 자막용 짧은 텍스트
  duration: number;                       // 영상 초단위 (5~10초)
  timestamp: Timestamp;                   // 단락의 대표 시간 (EXIF)
  location?: {
    lat: number;
    lng: number;
    address: string;
    placeName: string;
  };
};
```

## users/{uid}/posts/{postId}/photos/{photoId}

```typescript
type Photo = {
  photoId: string;
  postId: string;
  
  // Storage
  storagePath: string;                    // gs://bucket/users/{uid}/posts/{postId}/{photoId}.jpg
  downloadUrl: string;
  thumbnailUrl?: string;                  // 작은 사이즈 미리보기
  
  // EXIF
  capturedAt: Timestamp;
  gps?: {
    lat: number;
    lng: number;
  };
  cameraInfo?: {
    make: string;                         // Apple, Samsung 등
    model: string;                        // iPhone 15 Pro 등
  };
  imageSize?: {
    width: number;
    height: number;
  };
  
  // GPS → 주소 (Kakao Maps)
  address?: string;                       // 제주특별자치도 한림읍...
  placeName?: string;                     // 풍차로 가는길
  
  // OCR (Clova)
  ocrText?: string;                       // 전체 텍스트
  ocrItems?: Array<{
    text: string;
    confidence: number;
  }>;
  
  // Vision AI (Gemini)
  visionDescription?: string;             // 사진 내용 묘사 5~10단어
  visualMood?: string;                    // warm, calm, energetic 등
  
  order: number;                          // 단락 내 순서 (시간순)
};
```

## users/{uid}/videos/{videoId}

```typescript
type Video = {
  videoId: string;
  postId: string;
  userId: string;
  
  status: 'queued' | 'rendering' | 'completed' | 'failed';
  
  format: '9:16' | '16:9' | '1:1';
  duration: number;                       // 초
  
  // 생성 결과
  storagePath?: string;
  downloadUrl?: string;
  thumbnailUrl?: string;
  fileSize?: number;                      // bytes
  
  // BGM 옵션
  bgm?: 'lofi' | 'acoustic' | 'cinematic';
  
  // 렌더링 메타
  renderStartedAt?: Timestamp;
  renderCompletedAt?: Timestamp;
  errorMessage?: string;
  lambdaRequestId?: string;               // Remotion Lambda 추적용
  
  createdAt: Timestamp;
};
```

## Storage 구조

```
gs://photolog-{env}/
  └─ users/{uid}/
       └─ posts/{postId}/
            ├─ photos/
            │    ├─ {photoId}.jpg         # 원본
            │    └─ {photoId}_thumb.jpg   # 썸네일
            ├─ tts/
            │    └─ scene_{id}.mp3        # 영상 내레이션
            └─ videos/
                 └─ {videoId}.mp4         # 최종 영상
```

## 인덱스 (Firestore Composite Index)

처음부터 만들어둘 인덱스:

### posts 컬렉션
```
컬렉션: users/{uid}/posts
인덱스 1: mode (asc) + createdAt (desc)        # 마이페이지 탭별 정렬
인덱스 2: status (asc) + createdAt (desc)      # 작성 중인 글 모아보기
```

### videos 컬렉션
```
컬렉션: users/{uid}/videos
인덱스 1: status (asc) + createdAt (desc)      # 진행 중인 영상 조회
```

> Firestore 콘솔에서 미리 생성하거나, 첫 쿼리 시 콘솔 에러로 표시되는 링크 클릭으로 자동 생성.

## 보안 규칙 (`firestore.rules`)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // users — 본인만 read/write
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
      
      // posts — 본인 것만
      match /posts/{postId} {
        allow read, write: if request.auth != null && request.auth.uid == uid;
        
        // photos — 본인 것만
        match /photos/{photoId} {
          allow read, write: if request.auth != null && request.auth.uid == uid;
        }
      }
      
      // videos — 본인 것만
      match /videos/{videoId} {
        allow read, write: if request.auth != null && request.auth.uid == uid;
      }
    }
  }
}
```

## Storage 보안 규칙 (`storage.rules`)

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{uid}/{allPaths=**} {
      allow read: if request.auth != null && request.auth.uid == uid;
      allow write: if request.auth != null 
                   && request.auth.uid == uid
                   && request.resource.size < 20 * 1024 * 1024; // 20MB 제한
    }
  }
}
```

## 핵심 쿼리 예시

### 마이페이지 — 블로그 탭
```typescript
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

const q = query(
  collection(db, `users/${uid}/posts`),
  where('mode', '==', 'blog'),
  orderBy('createdAt', 'desc'),
  limit(20)
);
const snapshot = await getDocs(q);
```

### 사용량 카운팅 (글 생성 후)
```typescript
import { doc, updateDoc, increment } from 'firebase/firestore';

await updateDoc(doc(db, 'users', uid), {
  'usage.blogPostsThisMonth': increment(1),
});
```

## 데이터 흐름 다이어그램

```
[클라이언트 사진 업로드]
     ↓
Storage: users/{uid}/posts/{postId}/photos/{photoId}.jpg
     ↓
[API: /api/posts/create]
     ↓
EXIF 파싱 → Kakao 역지오코딩 → Clova OCR → Gemini Vision
     ↓
photos/{photoId} 메타데이터 저장
     ↓
LLM (Gemini/Claude) 호출 → scenes JSON 생성
     ↓
posts/{postId} 저장 (scenes 포함)
     ↓
[클라이언트로 postId 반환]
```

## 마이그레이션 노트

스키마 변경 시:
- 기존 문서에 새 필드 추가 → 옵셔널로 두고 점진적 마이그레이션
- 필드명 변경 → Cloud Function으로 일괄 마이그레이션
- 절대 직접 수정 X (백업 먼저)
