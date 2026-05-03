# 08. AI 프롬프트 설계

## AI 사용 영역

| 단계 | AI | 모델 |
|---|---|---|
| 사진 묘사 | Gemini Vision | gemini-2.0-flash-lite |
| OCR | Naver Clova OCR | (Vision 모델 아님, 별도 API) |
| 글 생성 | Gemini 2.0 Flash 또는 Claude Haiku | 비교 후 결정 |
| TTS | ElevenLabs | (영상용) |

## 1. Gemini Vision — 사진 묘사

### 목적
사진을 픽셀 단위로 분석해 본문에 녹일 수 있는 묘사 추출.

### 프롬프트 (`lib/ai/prompts.ts`)

```typescript
export const VISION_PROMPT = `
당신은 사진을 분석해 한국어로 자연스럽게 묘사하는 전문가입니다.

이 사진을 분석해 다음 JSON으로 응답하세요:

{
  "description": "사진 내용을 5~10단어로 한국어로 묘사 (예: '루프탑에서 바라본 일몰과 라떼 한 잔')",
  "mood": "warm | calm | energetic | cozy | dramatic 중 하나",
  "category": "food | view | interior | exterior | people | object | document 중 하나",
  "details": {
    "subjects": ["사진에 보이는 주요 피사체 배열"],
    "colors": ["주요 색감 한국어로 2~3개"],
    "lighting": "natural_bright | natural_soft | indoor_warm | indoor_cool | golden_hour | etc"
  }
}

JSON만 출력하세요. 다른 텍스트 절대 금지.
`;
```

### 호출 코드 (`lib/ai/gemini-vision.ts`)

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';
import { VISION_PROMPT } from './prompts';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function describeImage(imageUrl: string) {
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.0-flash-lite',
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.4,
    },
  });

  // 이미지를 base64로 변환
  const imageData = await fetchImageAsBase64(imageUrl);
  
  const result = await model.generateContent([
    VISION_PROMPT,
    { inlineData: { mimeType: 'image/jpeg', data: imageData } },
  ]);

  return JSON.parse(result.response.text());
}
```

### 비용
- Gemini 2.0 Flash-Lite: 사진 1장당 ~$0.0005 (₩0.7)
- 사진 20장 기준: ~₩15

## 2. LLM — 글 생성

### 블로그 모드 프롬프트

```typescript
export const BLOG_PROMPT = (data: {
  tone: string;
  clusters: Cluster[];
  userTitle?: string;
}) => `
당신은 한국어 블로그 글을 쓰는 전문 작가입니다.
아래 사진 데이터를 바탕으로 SEO 최적화된 블로그 글을 작성하세요.

[입력 데이터]
${formatClusters(data.clusters)}

[사용자 옵션]
- 톤: ${data.tone}
${data.userTitle ? `- 제목: ${data.userTitle}` : '- 제목: AI가 자동 생성'}

[글 작성 규칙]
1. 단락은 시간/장소 흐름에 따라 자연스럽게 분리 (이미 클러스터로 묶여있음)
2. 각 단락은 4~6문장
3. 메뉴명·가격·상호명 등 OCR 추출 텍스트는 본문에 자연스럽게 삽입
4. Vision의 mood 데이터를 참고해 분위기를 글에 반영
5. SEO 키워드를 자연스럽게 포함 (장소명, 카테고리)
6. 단조롭지 않게 — 시작 문장 다양화
7. 마지막 단락은 "마무리/총평" 단락

[출력 형식 — 다른 텍스트 절대 금지]
{
  "title": "...",
  "scenes": [
    {
      "id": 1,
      "type": "arrival|menu|view|moment|summary",
      "photoIds": ["..."],
      "narration": "단락 본문 4~6문장",
      "subtitle": "영상 자막용 짧은 한 줄 (10자 이내)",
      "duration": 7
    }
  ],
  "tags": ["...", "..."]
}
`;
```

### 다이어리 모드 프롬프트

```typescript
export const DIARY_PROMPT = (data: {
  tone: string;
  clusters: Cluster[];
  userTitle?: string;
}) => `
당신은 사용자의 하루를 정리해 일기로 써주는 다정한 기록자입니다.
아래 사진 데이터를 바탕으로 1인칭 시점 일기를 작성하세요.

[입력 데이터]
${formatClusters(data.clusters)}

[사용자 옵션]
- 톤: ${data.tone}

[일기 작성 규칙]
1. 1인칭 시점 ("나는", "오늘은", "~했다")
2. 사실 + 감정 묘사 (Vision의 mood 활용)
3. SEO 키워드 신경쓰지 않음 — 자연스러운 회고체
4. 단락은 짧게 (3~4문장)
5. 마지막은 그날 하루의 짧은 회고

[출력 형식 — 다른 텍스트 절대 금지]
{
  "title": "5월 3일 일요일 — 풍차로 가는길",
  "scenes": [
    {
      "id": 1,
      "type": "arrival|menu|view|moment|summary",
      "photoIds": ["..."],
      "narration": "본문 3~4문장",
      "subtitle": "짧은 한 줄",
      "duration": 6
    }
  ],
  "tags": ["..."]
}
`;
```

### 클러스터 포매팅 헬퍼

```typescript
function formatClusters(clusters: Cluster[]) {
  return clusters.map((cluster, i) => `
[클러스터 ${i + 1}]
- 시간: ${cluster.timeRange.start} ~ ${cluster.timeRange.end}
- 장소: ${cluster.placeName || '미상'} (${cluster.address || '주소 없음'})
- 사진 수: ${cluster.photos.length}장

${cluster.photos.map((p, j) => `
  사진 ${j + 1}:
    - ID: ${p.photoId}
    - 시간: ${p.capturedAt}
    - 묘사: ${p.visionDescription || '없음'}
    - 분위기: ${p.visualMood || '없음'}
    - OCR 텍스트: ${p.ocrText || '없음'}
`).join('')}
`).join('\n');
}
```

### 호출 코드

```typescript
// lib/ai/llm.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { BLOG_PROMPT, DIARY_PROMPT } from './prompts';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generatePost(params: {
  mode: 'blog' | 'diary';
  tone: string;
  clusters: Cluster[];
  title?: string;
}) {
  const prompt = params.mode === 'blog' 
    ? BLOG_PROMPT(params)
    : DIARY_PROMPT(params);

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.7,
    },
  });

  // 1차 시도
  try {
    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text());
  } catch (error) {
    // JSON 파싱 실패 시 1회 재시도
    const retry = await model.generateContent(prompt + '\n\n*JSON만 출력. 다른 설명 금지.*');
    return JSON.parse(retry.response.text());
  }
}
```

## 3. 위치 클러스터링 알고리즘

```typescript
// lib/utils/clustering.ts

type Photo = {
  photoId: string;
  capturedAt: number;
  gps?: { lat: number; lng: number };
  // ... 기타 데이터
};

export function clusterByLocation(photos: Photo[], radiusMeters = 50) {
  // 시간순 정렬
  const sorted = [...photos].sort((a, b) => a.capturedAt - b.capturedAt);
  
  const clusters: Photo[][] = [];
  let currentCluster: Photo[] = [];
  
  for (const photo of sorted) {
    if (currentCluster.length === 0) {
      currentCluster.push(photo);
      continue;
    }
    
    const lastPhoto = currentCluster[currentCluster.length - 1];
    
    // GPS 둘 다 있을 때만 거리 계산
    if (photo.gps && lastPhoto.gps) {
      const distance = haversineDistance(photo.gps, lastPhoto.gps);
      const timeDiff = photo.capturedAt - lastPhoto.capturedAt;
      
      // 50m 이내 + 30분 이내 = 같은 클러스터
      if (distance < radiusMeters && timeDiff < 30 * 60 * 1000) {
        currentCluster.push(photo);
      } else {
        clusters.push(currentCluster);
        currentCluster = [photo];
      }
    } else {
      // GPS 없으면 시간만으로 판단
      const timeDiff = photo.capturedAt - lastPhoto.capturedAt;
      if (timeDiff < 15 * 60 * 1000) {
        currentCluster.push(photo);
      } else {
        clusters.push(currentCluster);
        currentCluster = [photo];
      }
    }
  }
  
  if (currentCluster.length > 0) clusters.push(currentCluster);
  return clusters;
}

function haversineDistance(a: GPS, b: GPS): number {
  const R = 6371000; // 지구 반지름 (m)
  const φ1 = a.lat * Math.PI / 180;
  const φ2 = b.lat * Math.PI / 180;
  const Δφ = (b.lat - a.lat) * Math.PI / 180;
  const Δλ = (b.lng - a.lng) * Math.PI / 180;
  
  const x = Math.sin(Δφ/2) ** 2 +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x));
  
  return R * c;
}
```

## 4. 톤 옵션 정의

### 블로그 모드 톤
| 톤 | 설명 | 예시 어조 |
|---|---|---|
| 정보형 | 사실 위주, 객관적 | "오후 2시, OO카페에 도착했다. 매장은..." |
| 감성형 | 분위기 강조 | "비 오는 일요일, 따뜻한 라떼가 필요했다." |
| 리뷰형 | 평가 중심 | "별점 4.5/5. 가격 대비 만족도 높았던..." |

### 다이어리 모드 톤
| 톤 | 설명 |
|---|---|
| 기본 | 자연스러운 일기체 |
| 감성 | 감정 묘사 풍부 |
| 간결 | 짧고 담백 |

## 5. 프롬프트 튜닝 가이드

### 자주 발생하는 문제 & 해결

**문제 1: JSON 파싱 실패**
- 원인: LLM이 마크다운 코드블록(```json```) 추가
- 해결: `responseMimeType: 'application/json'` 강제 + 프롬프트에 "코드블록 금지" 명시

**문제 2: 단락이 너무 길거나 짧음**
- 해결: 프롬프트에 "각 단락 4~6문장" 명시, temperature 0.7 유지

**문제 3: OCR 텍스트가 어색하게 박힘**
- 해결: 프롬프트에 "자연스럽게 본문에 녹여라, 단순 나열 금지" 추가

**문제 4: AI 티 나는 표현 ("~인 것 같다", "이렇게 보입니다")**
- 해결: 프롬프트에 "단정적 표현 사용, 추측성 표현 금지" 추가

**문제 5: 같은 사진을 반복 묘사**
- 해결: scenes의 photoIds 분배를 미리 LLM에게 보여주기

### 모델별 비교 (실측 후 결정)

| 모델 | 1편 비용 | 품질 | 속도 |
|---|---|---|---|
| Gemini 2.0 Flash | ₩5~10 | 보통 | 빠름 |
| Gemini 2.0 Flash-Lite | ₩2~5 | 약간 떨어짐 | 매우 빠름 |
| Claude Haiku | ₩15~25 | 좋음 | 빠름 |
| Claude Sonnet | ₩50~80 | 매우 좋음 | 보통 |

**MVP 추천:** Gemini 2.0 Flash → 품질 모자라면 Claude Haiku로 fallback

## 6. 영상 생성용 자막 별도 처리

scenes의 `subtitle` 필드는 영상 자막용이라 **짧고 임팩트 있게**:

```typescript
// 좋은 예
"오후 2시 도착"
"☕ 라떼 7,000원"
"🌊 풍차해안 뷰"

// 나쁜 예 (너무 김)
"오후 2시쯤 풍차로 가는길에 도착했다"
```

프롬프트에 명시:
```
subtitle: 영상 자막용. 10자 이내, 이모지 1개 사용 권장
```
