import type { Cluster } from '@/lib/utils/clustering';

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

JSON만 출력하세요. 코드블록 금지. 다른 텍스트 절대 금지.
`;

export function formatClusters(clusters: Cluster[]): string {
  return clusters
    .map(
      (cluster, i) => `
[클러스터 ${i + 1}]
- 시간: ${cluster.timeRange.start} ~ ${cluster.timeRange.end}
- 장소: ${cluster.placeName ?? '미상'} (${cluster.address ?? '주소 없음'})
- 사진 수: ${cluster.photos.length}장

${cluster.photos
  .map(
    (p, j) => `  사진 ${j + 1}:
    - ID: ${p.photoId}
    - 시간: ${p.exif.capturedAt?.toLocaleString('ko-KR') ?? '미상'}
    - 묘사: ${p.vision?.description ?? '없음'}
    - 분위기: ${p.vision?.mood ?? '없음'}
    - OCR 텍스트: ${p.ocr?.text ?? '없음'}
    - 주소: ${p.location?.address ?? '없음'}`
  )
  .join('\n')}`
    )
    .join('\n\n');
}

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
1. 단락은 시간/장소 흐름에 따라 자연스럽게 분리
2. 각 단락은 4~6문장
3. 메뉴명·가격·상호명 등 OCR 추출 텍스트는 본문에 자연스럽게 삽입
4. Vision의 mood 데이터를 참고해 분위기를 글에 반영
5. SEO 키워드를 자연스럽게 포함 (장소명, 카테고리)
6. 단조롭지 않게 — 시작 문장 다양화
7. 마지막 단락은 "마무리/총평" 단락
8. 단정적 표현 사용, 추측성 표현 금지 ("인 것 같다", "보입니다" 금지)

[출력 형식 — JSON만 출력. 코드블록 금지. 다른 텍스트 절대 금지]
{
  "title": "...",
  "scenes": [
    {
      "id": 1,
      "type": "arrival|menu|view|moment|summary",
      "photoIds": ["..."],
      "narration": "단락 본문 4~6문장",
      "subtitle": "영상 자막용 짧은 한 줄 (10자 이내, 이모지 1개 권장)",
      "duration": 7
    }
  ],
  "tags": ["...", "..."]
}
`;

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
${data.userTitle ? `- 제목: ${data.userTitle}` : ''}

[일기 작성 규칙]
1. 1인칭 시점 ("나는", "오늘은", "~했다")
2. 사실 + 감정 묘사 (Vision의 mood 활용)
3. SEO 키워드 신경쓰지 않음 — 자연스러운 회고체
4. 단락은 짧게 (3~4문장)
5. 마지막은 그날 하루의 짧은 회고

[출력 형식 — JSON만 출력. 코드블록 금지. 다른 텍스트 절대 금지]
{
  "title": "5월 4일 일요일 — 풍차로 가는길",
  "scenes": [
    {
      "id": 1,
      "type": "arrival|menu|view|moment|summary",
      "photoIds": ["..."],
      "narration": "본문 3~4문장",
      "subtitle": "짧은 한 줄 (10자 이내)",
      "duration": 6
    }
  ],
  "tags": ["..."]
}
`;
