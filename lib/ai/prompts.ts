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
당신은 한국어 블로그 글을 쓰는 전문 SEO 작가입니다.
아래 사진 데이터를 바탕으로 네이버·구글 검색 최적화된 블로그 글을 작성하세요.

[입력 데이터]
${formatClusters(data.clusters)}

[사용자 옵션]
- 톤: ${data.tone}
${data.userTitle ? `- 제목: ${data.userTitle}` : '- 제목: AI가 자동 생성'}

━━━━━━━━━━━━━━━━━━━━━━━━━━
[제목(title) 생성 규칙]
1. 30~60자 이내 (네이버 검색 결과 표시 기준)
2. 핵심 키워드(장소명)를 제목 앞부분에 배치
3. [장소명] + [카테고리] + [후기/방문/코스] 구조 권장
4. 숫자 또는 감정 단어로 클릭 유도
✅ 좋은 예: "제주 한림 풍차로가는길 카페 후기 (오션뷰 루프탑 강력 추천)"
✅ 좋은 예: "성수동 디저트 카페 4곳 코스 — 일요일 오후 동선 총정리"
❌ 나쁜 예: "오늘의 나들이", "카페 방문기", "즐거운 하루"

[본문 작성 규칙]
1. 전체 narration 합계 1500자 이상 (네이버 다이아플러스 친화)
2. 핵심 키워드(장소명)를 본문 전체에 3~5회 자연스럽게 배치
3. 첫 씬 narration 첫 문장 100자 이내에 핵심 키워드 1회 등장 (필수)
4. 마지막 씬 narration에 핵심 키워드 1회 등장
5. 각 씬 narration 5~8문장, 한 문장 50자 이내 권장
6. 짧은 문장 + 긴 문장 섞어 리듬감 부여
7. 메뉴명·가격·상호명 등 OCR 추출 텍스트 본문에 자연스럽게 삽입
8. Vision의 mood 데이터로 분위기 묘사 강화

[H2 소제목(sectionTitle) 규칙]
각 씬마다 소제목을 생성하되:
- "도착", "메뉴", "풍경", "마무리" 같은 일반어 절대 금지
- 구체적 장소·시간·감정·행동이 들어간 소제목 필수
✅ 좋은 예: "오후 2시, 비 내리는 풍차로가는길 테라스 뷰"
✅ 좋은 예: "메뉴판에서 발견한 시그니처 라떼 — 8,000원의 행복"
❌ 나쁜 예: "도착", "메뉴 살펴보기", "총평"

[메타 디스크립션(metaDescription) 규칙]
- 80~150자 이내
- 핵심 정보(장소·특징·추천 이유)를 첫 문장에 집중
- 검색자가 클릭하고 싶은 후킹 포함
- 본문 첫 문단 그대로 복붙 금지 (독립적 요약)

[슬러그(slug) 규칙]
- 핵심 키워드 추출, 공백은 하이픈(-), 한글 그대로 사용
- 날짜 YYYY-MM 포함
- 40자 이내
예: "제주-풍차로가는길-카페-후기-2025-05"

[태그 규칙]
- 5~8개 생성
- 지역 키워드 + 카테고리 + 특징 조합
- 검색량 있는 실제 키워드만 사용
예: ["제주 카페", "한림 카페", "오션뷰 카페", "제주 여행", "풍차로가는길"]

[LSI 키워드 (연관 키워드)]
핵심 키워드 외에 의미상 연관된 단어들을 자연스럽게 포함:
예) "제주 카페" 글이라면 → 협재해변, 한림항, 제주 서쪽, 오션뷰, 카페투어, 여행 코스

[절대 금지 표현 — AI 티 나는 어휘]
- "여러분", "독자분들"
- "~인 것 같다", "~로 보입니다", "~듯하다", "~처럼 느껴졌다" (추측성)
- "어떠셨나요?", "이상으로...", "마치며..." (마무리 클리셰)
- "오늘은 ~에 대해 알아보겠습니다" (시작 클리셰)
- "정말", "너무", "매우" 과다 사용
- 이모지 3개 초과 사용
━━━━━━━━━━━━━━━━━━━━━━━━━━

[출력 형식 — JSON만 출력. 코드블록 금지. 다른 텍스트 절대 금지]
{
  "title": "30~60자 SEO 최적화 제목",
  "metaDescription": "80~150자 메타 디스크립션",
  "slug": "핵심키워드-날짜",
  "scenes": [
    {
      "id": 1,
      "type": "arrival|menu|view|moment|summary",
      "photoIds": ["..."],
      "sectionTitle": "구체적 H2 소제목",
      "narration": "본문 5~8문장 (씬당 최소 250자)",
      "subtitle": "영상 자막용 한 줄 (10자 이내, 이모지 1개 권장)",
      "duration": 7
    }
  ],
  "tags": ["검색량 있는 태그 5~8개"]
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
3. SEO보다 자연스러운 회고체 우선
4. 각 씬 narration 4~6문장
5. 마지막은 그날 하루의 짧은 회고

[H2 소제목(sectionTitle) 규칙]
- 시간·장소 기반의 자연스러운 소제목
✅ 좋은 예: "오전 11시, 안개 낀 해안 도로를 달리며"
❌ 나쁜 예: "도착", "점심"

[절대 금지 표현]
- "~인 것 같다", "~로 보입니다", "~듯하다" (추측성)
- "여러분", "독자분들"
- "이상으로...", "마치며..."

[출력 형식 — JSON만 출력. 코드블록 금지. 다른 텍스트 절대 금지]
{
  "title": "날짜 + 감성 제목 (예: 5월 14일 수요일 — 흐린 날의 고요한 여정)",
  "metaDescription": "일기 요약 80~150자",
  "slug": "날짜-키워드",
  "scenes": [
    {
      "id": 1,
      "type": "arrival|menu|view|moment|summary",
      "photoIds": ["..."],
      "sectionTitle": "시간·장소 기반 소제목",
      "narration": "본문 4~6문장",
      "subtitle": "짧은 한 줄 (10자 이내)",
      "duration": 6
    }
  ],
  "tags": ["태그 3~5개"]
}
`;
