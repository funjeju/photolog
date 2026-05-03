# 14. 블로그 글 SEO 최적화 가이드

> AI가 생성한 블로그 글이 검색 엔진(네이버·구글)에 잘 노출되도록 최적화하는 방법

---

## 0. 핵심 전제

PhotoLog의 블로그 글은 **EXIF·GPS·OCR이라는 사실 데이터**를 가지고 있어서 일반 AI 글보다 SEO에 압도적으로 유리합니다. 이 강점을 최대화하는 게 목표.

---

## 1. SEO에 영향을 주는 4가지 신호

| 신호 | 우리가 가진 무기 |
|---|---|
| **E-E-A-T (경험성)** | EXIF로 "진짜 다녀온 곳" 증명 |
| **Freshness (최신성)** | EXIF 촬영 시각 → 발행일 가까움 |
| **이미지 SEO** | GPS+시간+Vision으로 자동 alt 생성 |
| **롱테일 키워드** | 동선 정보 = 검색 의도 정확 매칭 |

---

## 2. 글 생성 시 자동 적용해야 할 SEO 요소

### 2.1 제목(title) 자동 생성 규칙

LLM 프롬프트에 명시:

```
[제목 생성 규칙]
1. 30~60자 이내 (네이버 검색 결과 노출 기준)
2. 핵심 키워드를 앞부분에 배치
3. 장소명 + 카테고리 + 후기/방문 구조
4. 숫자/감정 단어로 클릭 유도

좋은 예:
- "제주 한림 풍차로 가는길 카페 후기 (오션뷰 루프탑 추천)"
- "성수동 디저트 카페 5곳 코스 — 일요일 오후 동선"

나쁜 예:
- "오늘의 일기" (키워드 없음)
- "카페 후기" (구체성 없음)
```

### 2.2 메타 디스크립션 자동 생성

각 글에 `description` 필드 추가:

```
[메타 디스크립션 규칙]
1. 80~150자 이내
2. 첫 문장에 핵심 정보 (장소·시간·메뉴)
3. 검색자가 클릭하고 싶은 후킹 포함
4. 본문 첫 문단을 그대로 쓰지 말 것 (요약본 별도 생성)
```

### 2.3 본문 구조 (H1, H2, H3 위계)

```
H1: 글 제목 (1개만)
H2: 단락별 제목 (Scene별)
H3: 세부 정보 (메뉴, 가격 등 OCR 추출 텍스트)
```

LLM 프롬프트:
```
- 단락마다 의미 있는 H2 제목 생성
- "도착", "메뉴 살펴보기", "분위기", "총평" 같은 일반적 제목 X
- 구체적 장소·메뉴·감정이 들어간 H2
  좋은 예: "오후 2시, 비 오는 풍차로 가는길 1층 풍경"
  나쁜 예: "도착"
```

### 2.4 이미지 alt 텍스트 (이미지 SEO 핵심)

**우리만의 무기:** EXIF + GPS + Vision으로 자동 생성:

```typescript
// 자동 alt 생성 패턴
const altText = `${capturedDate} ${placeName} ${visionDescription}`;

// 예시
"2025-05-03 14:23 풍차로 가는길 야외 테라스 라떼 클로즈업"
"2025-05-03 16:45 신창 풍차해안로 일몰 풍경"
```

**LLM 프롬프트:**
```
[이미지 alt 생성 규칙]
1. 100자 이내
2. 형식: [날짜] [장소] [내용 5~10단어]
3. 키워드 자연스럽게 포함
4. 메뉴/상품 사진은 가격까지 포함 (OCR 데이터 활용)
```

### 2.5 키워드 추출 & 태그 자동 생성

```
[태그 추출 규칙]
1. 3~5개 태그 자동 생성
2. 종류:
   - 지역 키워드 (제주, 한림, 신창)
   - 카테고리 (카페, 맛집, 여행)
   - 특징 (오션뷰, 루프탑, 인스타감성)
3. 모두 검색량 있는 실제 키워드만
```

---

## 3. 구조화 데이터 (Schema.org)

각 글 페이지에 자동 삽입:

### 3.1 Article 스키마 (필수)

```typescript
// app/post/[postId]/page.tsx
const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": post.title,
  "image": post.scenes[0]?.photoUrls[0],
  "datePublished": post.createdAt,
  "dateModified": post.updatedAt,
  "author": {
    "@type": "Person",
    "name": post.userName
  },
  "publisher": {
    "@type": "Organization",
    "name": "PhotoLog",
    "logo": "https://photolog.app/logo.png"
  }
};
```

### 3.2 LocalBusiness 스키마 (장소 후기 시)

```typescript
// 메뉴판 OCR이 있는 장소 후기에 추가
const placeSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": post.placeName,        // GPS로 매칭한 상호명
  "address": {
    "@type": "PostalAddress",
    "streetAddress": post.address  // Kakao Maps 역지오코딩 결과
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": post.gps.lat,
    "longitude": post.gps.lng
  }
};
```

### 3.3 Review 스키마 (사용자 평점 시)

```typescript
// 별점 매기는 기능 추가하면
const reviewSchema = {
  "@context": "https://schema.org",
  "@type": "Review",
  "reviewBody": post.scenes.map(s => s.narration).join(' '),
  "datePublished": post.createdAt,
  "itemReviewed": placeSchema
};
```

→ **검색 결과에 별점·지도 카드 자동 표시** = 클릭률 폭등

---

## 4. 페이지 메타 태그 자동 생성

### 4.1 Next.js Metadata API 활용

```typescript
// app/post/[postId]/page.tsx
import { Metadata } from 'next';

export async function generateMetadata({ params }): Promise<Metadata> {
  const post = await getPost(params.postId);
  
  return {
    title: `${post.title} | PhotoLog`,
    description: post.metaDescription,  // LLM이 별도 생성
    keywords: post.tags,
    
    // Open Graph (카카오톡·페이스북 공유 시)
    openGraph: {
      title: post.title,
      description: post.metaDescription,
      images: [
        {
          url: post.scenes[0]?.photoUrls[0],
          width: 1200,
          height: 630,
          alt: post.title
        }
      ],
      type: 'article',
      publishedTime: post.createdAt,
      authors: [post.userName],
      tags: post.tags,
      locale: 'ko_KR',
    },
    
    // 트위터 카드
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.metaDescription,
      images: [post.scenes[0]?.photoUrls[0]],
    },
    
    // 검색 엔진용
    alternates: {
      canonical: `https://photolog.app/post/${post.postId}`,
    },
  };
}
```

---

## 5. 본문 텍스트 최적화 규칙

### 5.1 키워드 밀도

```
[LLM 프롬프트 추가 규칙]
1. 핵심 키워드(장소명) → 본문에 3~5회 자연스럽게 배치
2. 첫 문단 100자 이내에 핵심 키워드 1회 등장 (필수)
3. 마지막 문단에 핵심 키워드 1회 등장
4. 키워드 강제 반복(stuffing) 금지 — 자연스럽게
```

### 5.2 단락 길이

```
- 한 단락 4~6문장
- 한 문장 50자 이내 권장
- 짧은 문장 + 긴 문장 섞기 (리듬감)
- 모바일에서 읽히기 좋게
```

### 5.3 LSI 키워드 (관련 키워드)

```
[LLM 프롬프트]
핵심 키워드 외에 의미상 연관된 단어들을 자연스럽게 포함하세요.

예: "제주 카페" 글이라면
- LSI: 협재해변, 한림항, 제주 서쪽, 오션뷰, 카페투어, 차박, 여행 코스
```

### 5.4 절대 피해야 할 표현

LLM 프롬프트에 명시:

```
[금지 표현 — AI 티 나는 어휘]
- "여러분", "독자분들"
- "~인 것 같다", "~로 보입니다", "~듯하다" (추측성)
- "어떠셨나요?", "이상으로..." (마무리 클리셰)
- "오늘은 ~에 대해 알아보겠습니다" (시작 클리셰)
- 이모지 과다 사용
```

---

## 6. URL 구조 최적화

### 6.1 슬러그 생성

```
❌ 나쁜 URL: /post/abc123xyz
✅ 좋은 URL: /post/jeju-pungcharo-cafe-review-2025-05

생성 방법:
1. 글 제목 → 슬러그 변환
2. 한글 → 영문 transliteration 또는 그대로 인코딩
3. 날짜 포함
4. 100자 이내
```

### 6.2 한글 vs 영문 슬러그

```typescript
// 옵션 A. 한글 그대로 (한국 사용자만 대상이면)
/post/제주-풍차로가는길-카페-후기

// 옵션 B. 영문 변환 (글로벌 대비)
/post/jeju-pungcharo-cafe-review

→ MVP는 옵션 A 추천 (한국 검색엔진 친화)
```

---

## 7. 사이트맵 동적 생성

```typescript
// app/sitemap.ts
import { MetadataRoute } from 'next';
import { getAllPublishedPosts } from '@/lib/firebase/admin';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getAllPublishedPosts();
  
  return [
    // 정적 페이지
    { url: 'https://photolog.app', priority: 1.0, changeFrequency: 'daily' },
    { url: 'https://photolog.app/login', priority: 0.5 },
    { url: 'https://photolog.app/signup', priority: 0.5 },
    
    // 동적 페이지 (사용자가 발행한 모든 글)
    ...posts.map(post => ({
      url: `https://photolog.app/post/${post.postId}`,
      lastModified: post.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ];
}
```

→ 사용자가 글 1,000개 발행하면 sitemap에 1,000개 페이지 자동 등록 → 구글에 다 노출

---

## 8. 검색 엔진 등록

### 8.1 Google Search Console
- https://search.google.com/search-console
- 도메인 추가 → DNS 또는 HTML 메타 태그로 소유권 확인
- sitemap 제출: `https://photolog.app/sitemap.xml`
- 색인 생성 요청

### 8.2 Naver 웹마스터도구 (한국 시장 필수)
- https://searchadvisor.naver.com
- 사이트 등록 → HTML 태그 확인
- 사이트맵 제출
- RSS 등록 (선택)

### 8.3 Bing Webmaster
- https://www.bing.com/webmasters
- Google Search Console에서 자동 가져오기 가능

---

## 9. 이미지 최적화

### 9.1 Next.js Image 컴포넌트 사용

```typescript
import Image from 'next/image';

<Image
  src={photo.url}
  alt={photo.altText}        // 자동 생성된 alt
  width={1200}
  height={800}
  priority={index === 0}     // 첫 사진은 우선 로딩
  quality={85}
  placeholder="blur"
  blurDataURL={photo.thumbnailBase64}
/>
```

### 9.2 이미지 SEO 추가 작업

```typescript
// figcaption으로 사진 캡션 추가 (SEO 추가 신호)
<figure>
  <Image src={photo.url} alt={photo.altText} />
  <figcaption>
    {photo.placeName} · {format(photo.capturedAt, 'PPp')}
  </figcaption>
</figure>
```

### 9.3 EXIF 정보 노출 (E-E-A-T 강화)

글 하단에 작은 폰트로:
```
📷 촬영 정보: 2025년 5월 3일 14:23 · iPhone 15 Pro
📍 위치: 제주특별자치도 한림읍 신창리
```

→ 검색엔진에게 "진짜 거기 갔다"는 신호

---

## 10. 페이지 속도 최적화

### 10.1 Core Web Vitals 목표

| 지표 | 목표 |
|---|---|
| LCP (Largest Contentful Paint) | < 2.5초 |
| FID (First Input Delay) | < 100ms |
| CLS (Cumulative Layout Shift) | < 0.1 |

### 10.2 실천 방법

```
1. 이미지 lazy loading (Next.js Image 자동)
2. 폰트 preload (Pretendard)
3. 불필요한 JavaScript 제거
4. 정적 페이지는 SSG (generateStaticParams)
5. 동적 페이지는 ISR (revalidate)
```

### 10.3 ISR 설정

```typescript
// app/post/[postId]/page.tsx
export const revalidate = 3600;  // 1시간마다 재생성

// 또는 on-demand revalidation
// app/api/revalidate/route.ts
import { revalidatePath } from 'next/cache';

export async function POST(req: Request) {
  const { postId } = await req.json();
  revalidatePath(`/post/${postId}`);
  return Response.json({ revalidated: true });
}
```

---

## 11. 한국 시장 특화 SEO

### 11.1 네이버 검색 최적화

네이버는 구글과 알고리즘이 다름:

```
[네이버 다이아플러스 친화 요소]
1. 1500자 이상 본문 (긴 글 선호)
2. 사진 5장 이상
3. 영상 첨부 (우리는 자동 생성한 숏폼 임베드 가능!)
4. 본문 내 외부 링크 적당히 (2~3개)
5. 댓글·공감 활성화
```

### 11.2 네이버 블로그 자동 발행 시 추가 최적화

(Phase 2 추가 기능)

```
[네이버 블로그 발행 옵션]
- 카테고리 자동 매칭 (카페·맛집·여행)
- 태그 자동 추가
- 위치 정보 자동 첨부 (GPS → 지도 첨부)
- 동영상 자동 첨부 (생성한 숏폼)
```

### 11.3 카카오톡 공유 최적화

```
[OG 태그 한국 친화]
- og:image 1200×630 (카톡 미리보기 표준)
- og:title 한글 30자 이내
- og:description 100자 이내
```

---

## 12. AI 검색 시대 대응 (GEO/AEO)

### 12.1 llms.txt 작성

```
# /llms.txt
# PhotoLog
> 사진만 올리면 EXIF·GPS·OCR을 분석해 블로그 글과 숏폼 영상을 자동 생성하는 SaaS

## 핵심 기능
- 사진 업로드 → AI 블로그 글 자동 생성 (30초)
- 사진 → 숏폼 영상 자동 생성 (Remotion 기반)
- 블로그 모드 / 다이어리 모드 전환
- EXIF·GPS·OCR로 사실 기반 글

## 차별화
- Sora·Runway가 5~20초 영상 생성 시, PhotoLog는 무제한 길이
- AI가 픽셀을 그리는 게 아니라, 진짜 사진을 조립
- E-E-A-T 자동 충족

## 가격
- Free: 월 5편 무료
- Pro: 월 ₩29,900 (출시 예정)
```

### 12.2 ChatGPT·Perplexity·Claude에 인용되기

```
[전략]
1. 페이지에 명확한 H1, H2, H3
2. FAQ 섹션 추가 (Q&A 형식)
3. 정확한 사실 + 출처
4. 구조화 데이터 풍부
```

---

## 13. 글 생성 직후 자동 SEO 체크

### 13.1 LLM 응답 검증

글 생성 후 백엔드에서 자동 체크:

```typescript
function validateSEO(post: Post): SEOReport {
  const issues: string[] = [];
  
  // 제목 길이
  if (post.title.length < 20 || post.title.length > 60) {
    issues.push('제목 길이 비최적 (20~60자 권장)');
  }
  
  // 메타 디스크립션
  if (!post.metaDescription || post.metaDescription.length < 80) {
    issues.push('메타 디스크립션 부족 (80자 이상 필요)');
  }
  
  // 본문 길이
  const totalLength = post.scenes.reduce((sum, s) => sum + s.narration.length, 0);
  if (totalLength < 800) {
    issues.push('본문 길이 부족 (네이버 권장 1500자+)');
  }
  
  // 이미지 alt 누락
  const missingAlt = post.scenes.filter(s => !s.altText).length;
  if (missingAlt > 0) {
    issues.push(`${missingAlt}개 사진 alt 누락`);
  }
  
  // 키워드
  if (!post.tags || post.tags.length < 3) {
    issues.push('태그 부족 (3개 이상 권장)');
  }
  
  return {
    score: 100 - (issues.length * 10),
    issues,
    suggestions: generateSuggestions(issues),
  };
}
```

### 13.2 사용자 화면에 SEO 점수 표시

```
[글 결과 화면 우측 패널]
SEO 점수: 92/100 ✓

✓ 제목 최적화
✓ 메타 디스크립션
✓ 본문 길이 (1,847자)
✓ 이미지 alt (8/8)
⚠️ 태그 추가 추천

→ "Pro 플랜에서 SEO 자동 개선 사용 가능" (전환 유도)
```

---

## 14. 실행 우선순위

### Phase 3 (글 생성 파이프라인)
- [x] LLM 프롬프트에 SEO 규칙 포함 (제목·본문·태그)
- [x] 이미지 alt 자동 생성
- [x] 메타 디스크립션 별도 생성

### Phase 4 (마이페이지 + 발행)
- [ ] Article 스키마 자동 삽입
- [ ] LocalBusiness 스키마 (장소 후기 시)
- [ ] Next.js Metadata API 동적 적용
- [ ] sitemap.ts 동적 생성
- [ ] SEO 점수 표시 UI

### Phase 5 (영상 + 추가 기능)
- [ ] Review 스키마
- [ ] llms.txt 작성
- [ ] 페이지 속도 최적화 (Core Web Vitals)
- [ ] Google/Naver Search Console 등록

### 출시 후
- [ ] 색인 모니터링
- [ ] 키워드 순위 추적
- [ ] 클릭률(CTR) 분석
- [ ] A/B 테스트 (제목·메타 디스크립션)

---

## 15. 클로드 코드에 던질 프롬프트 모음

### 글 생성 프롬프트 SEO 강화

```
08_AI_PROMPTS.md의 BLOG_PROMPT를 다음 SEO 규칙으로 업데이트:

1. 제목: 30~60자, 핵심 키워드 앞부분, 장소+카테고리 구조
2. 메타 디스크립션 별도 생성 (80~150자)
3. H2 단락 제목 구체적으로 (도착/메뉴 같은 일반어 X)
4. 이미지 alt 자동 생성 ([날짜] [장소] [내용] 형식)
5. 본문 1500자 이상 (네이버 다이아플러스 친화)
6. 태그 3~5개, 지역+카테고리+특징 조합
7. 첫 문단 100자 내 핵심 키워드 1회
8. AI 티 나는 표현 금지 ("여러분", "~듯하다" 등)

JSON 출력 스키마에 추가 필드:
- metaDescription: string
- altTexts: string[] (사진 수만큼)
- slug: string (URL용)
- h1: string (== title)
```

### 메타 태그 셋업

```
app/post/[postId]/page.tsx에 generateMetadata 추가:
- post 데이터 기반 동적 title, description
- Open Graph 태그
- 트위터 카드
- 한국어 locale
- canonical URL
```

### Schema.org 구조화 데이터

```
components/seo/StructuredData.tsx 컴포넌트 생성:
- Article 스키마 자동 생성
- LocalBusiness 스키마 (post.placeName 있을 때)
- Review 스키마 (post.rating 있을 때)
- JSON-LD <script> 태그로 head에 삽입
```

### 사이트맵

```
app/sitemap.ts 생성:
- 정적 페이지 (랜딩, 로그인, 회원가입)
- 동적 페이지 (모든 발행된 post)
- Firestore에서 published === true인 글만
- lastModified는 post.updatedAt
```

### SEO 점수 검증

```
lib/seo/validator.ts 생성:
- validateSEO(post) 함수
- 13.1의 체크 항목 모두 구현
- score, issues, suggestions 반환

components/post/SEOScore.tsx:
- 글 결과 화면 우측 패널에 표시
- 점수 + 개선 제안
- Pro 플랜 전환 CTA
```

---

## 부록 A. 핵심 키워드 풀 (한국 시장)

### 카페 후기
```
[지역] [카페명] 후기, [지역] 카페 추천, 인스타 감성 카페, 
오션뷰 카페, 루프탑 카페, 디저트 카페, 데이트 카페
```

### 맛집 후기
```
[지역] 맛집, [지역] [메뉴] 맛집, 점심 추천, 분위기 맛집,
가족 외식, 데이트 맛집, 회식 장소, 가성비 맛집
```

### 여행
```
[지역] 여행 코스, [지역] 가볼 만한 곳, [지역] 1박2일,
당일치기, 주말 나들이, 힐링 여행, 인생샷 명소
```

### 검색량 확인 도구
- 네이버: 키워드도구 (https://manage.searchad.naver.com)
- 구글: Google Trends, Keyword Planner
- 유료: 블랙키위, 키랩

---

## 부록 B. 반드시 피해야 할 SEO 함정

1. **키워드 스터핑** — 같은 키워드 부자연스럽게 반복 → 페널티
2. **얇은 콘텐츠(Thin Content)** — 본문 500자 미만 → 색인 안 됨
3. **중복 콘텐츠** — 같은 글 여러 URL → 캐노니컬 태그 필수
4. **AI 자동 생성 티 명백** — 구글 SpamBrain 알고리즘이 감지
5. **클로킹** — 검색봇과 사용자에게 다른 콘텐츠 제공 → 즉시 페널티
6. **백링크 구매** — 한국에선 흔하지만 위험. 자연스러운 백링크만

---

**문서 버전**: v1.0
**작성일**: 2026-05-04
**적용 시점**: Phase 3 글 생성 파이프라인 구현 시
