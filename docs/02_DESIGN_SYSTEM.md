# 02. 디자인 시스템 — Soft & Friendly

## 디자인 컨셉

부드러운 컬러와 둥근 카드, 일러스트를 활용해 사용자에게 **친근하고 편안한 느낌**을 주는 시안.
복잡한 콘텐츠 자동화 도구를 **부담 없는 사용성**으로 풀어내는 것이 목표.

## 컬러 시스템

### 베이스 컬러
```
배경 (메인):     #FDF8F0   크림/베이지
배경 (서브):     #FFFFFF   카드 화이트
배경 (보더):     #F5EDE0   연베이지 보더
텍스트 (주):     #2D2A26   다크 브라운 그레이
텍스트 (보조):   #6B6259   미디엄 그레이
텍스트 (희미):   #A8A096   라이트 그레이
```

### 액센트 컬러 (파스텔 톤)
| 이름 | 200 (밝음) | 300 (기본) | 용도 |
|---|---|---|---|
| Primary (Green) | #A8D5BA | #7FBF9E | 브랜드 메인, CTA |
| Coral | #FFB89A | #FF9A75 | 강조, 알림 |
| Sky | #A8C8E8 | #7FB0DC | 정보, 링크 |
| Lavender | #C8B6E2 | #A88FD1 | 보조 강조 |
| Sun | #FFD89A | #FFC470 | 포인트 |

### 시맨틱 컬러
```
Success: #7FBF9E   (Primary 300)
Warning: #FFC470   (Sun 300)
Error:   #FF9A75   (Coral 300)
Info:    #7FB0DC   (Sky 300)
```

## Tailwind 설정 (`tailwind.config.ts`)

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: '#FDF8F0',
          card: '#FFFFFF',
          subtle: '#F5EDE0',
        },
        foreground: {
          DEFAULT: '#2D2A26',
          muted: '#6B6259',
          subtle: '#A8A096',
        },
        primary: {
          50:  '#F0F8F4',
          100: '#D5EDDF',
          200: '#A8D5BA',
          300: '#7FBF9E',
          400: '#5FA982',
          500: '#4A8E6A',
          DEFAULT: '#7FBF9E',
        },
        coral: {
          200: '#FFB89A',
          300: '#FF9A75',
          DEFAULT: '#FFB89A',
        },
        sky: {
          200: '#A8C8E8',
          300: '#7FB0DC',
          DEFAULT: '#A8C8E8',
        },
        lavender: {
          200: '#C8B6E2',
          300: '#A88FD1',
          DEFAULT: '#C8B6E2',
        },
        sun: {
          200: '#FFD89A',
          300: '#FFC470',
          DEFAULT: '#FFD89A',
        },
      },
      borderRadius: {
        sm: '8px',
        DEFAULT: '12px',
        md: '16px',
        lg: '20px',
        xl: '24px',
        '2xl': '32px',
      },
      fontFamily: {
        sans: ['Pretendard', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 2px 8px rgba(45, 42, 38, 0.04)',
        card: '0 4px 16px rgba(45, 42, 38, 0.06)',
        hover: '0 8px 24px rgba(45, 42, 38, 0.10)',
      },
    },
  },
};
export default config;
```

## shadcn/ui CSS 변수 오버라이드 (`globals.css`)

```css
@layer base {
  :root {
    --background: 36 60% 96%;        /* #FDF8F0 */
    --foreground: 30 10% 16%;         /* #2D2A26 */
    --card: 0 0% 100%;
    --card-foreground: 30 10% 16%;
    --primary: 145 32% 62%;           /* #7FBF9E */
    --primary-foreground: 0 0% 100%;
    --secondary: 36 50% 92%;          /* #F5EDE0 */
    --secondary-foreground: 30 10% 16%;
    --muted: 36 50% 92%;
    --muted-foreground: 30 8% 38%;
    --border: 36 40% 88%;
    --input: 36 40% 88%;
    --ring: 145 32% 62%;
    --radius: 1rem;                   /* 16px 기본 */
  }
}
```

## 타이포그래피

### 폰트
**Pretendard** (한국어 최적화 가변 폰트)

```typescript
// app/layout.tsx
import localFont from 'next/font/local';

const pretendard = localFont({
  src: '../public/fonts/PretendardVariable.woff2',
  display: 'swap',
  weight: '45 920',
  variable: '--font-pretendard',
});
```

또는 CDN 사용:
```html
<link rel="stylesheet" 
  href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.css" />
```

### 크기 위계
| 용도 | 클래스 | 크기 |
|---|---|---|
| Display | `font-bold text-4xl` | 32px — 헤드라인 |
| Heading 1 | `font-bold text-2xl` | 24px — 페이지 제목 |
| Heading 2 | `font-semibold text-xl` | 20px — 섹션 제목 |
| Heading 3 | `font-semibold text-lg` | 18px — 카드 제목 |
| Body | `font-normal text-base` | 16px — 본문 |
| Caption | `font-normal text-sm` | 14px — 보조 텍스트 |
| Tiny | `font-normal text-xs` | 12px — 라벨, 메타정보 |

## 컴포넌트 스타일 가이드

### 카드 (Card)
```
배경: #FFFFFF (background-card)
보더: 1px solid #F5EDE0 또는 보더 없이 shadow-card
모서리: rounded-lg (20px)
패딩: p-6 (24px)
호버: shadow-hover + 살짝 위로 (hover:-translate-y-0.5)
트랜지션: transition-all duration-200
```

### 버튼 (Button)
```
Primary:   bg-primary-300 text-white hover:bg-primary-400
           rounded-full px-6 py-3
Secondary: bg-background-subtle text-foreground hover:bg-primary-100
           rounded-full
Ghost:     text-foreground hover:bg-background-subtle
           rounded-full
Outline:   border-2 border-primary-200 text-primary-500
           rounded-full hover:bg-primary-50
```

### 입력 필드 (Input)
```
배경: #FFFFFF
보더: 1px solid #F5EDE0
포커스: ring-2 ring-primary-200 border-transparent
모서리: rounded-md (16px)
패딩: px-4 py-3
```

### 사이드바
```
배경: #FFFFFF
너비: 240px
아이템:
  - 기본: rounded-md, 호버 bg-background-subtle
  - 활성: bg-primary-100 text-primary-500
         + 좌측 4px primary 인디케이터
패딩: px-3 py-2.5
간격: space-y-1
```

### 스탯 카드 (대시보드)
시안 참조 — 상단 4개 컬러 카드:
```
배경: 화이트 + 좌측 4px 컬러 보더 OR 컬러 50 톤 배경
아이콘: 컬러 200 톤 배경 박스 + 컬러 500 아이콘
숫자: text-2xl font-bold
변화율 뱃지: rounded-full px-2 py-0.5 text-xs
  - 양수: bg-primary-100 text-primary-500
  - 음수: bg-coral-100 text-coral-500 (있을 경우)
```

## 일러스트 가이드

### 스타일
- 식물·인물·자연 요소 활용
- 컬러 팔레트와 조화되는 파스텔톤
- 둥글고 부드러운 라인

### 추천 소스
- **Storyset** (storyset.com) — 무료, 컬러 커스터마이징 가능
- **unDraw** (undraw.co) — 무료, SVG
- **IconScout** — 유료/무료 혼합

### 사용 위치
- 빈 상태(empty state) — "아직 글이 없어요"
- 대시보드 우하단 — 시안처럼 인물 일러스트
- 사이드바 하단 — 식물 아이콘
- 온보딩 페이지

## 마이크로 인터랙션

```
버튼 호버:   scale(1.02) + 색상 진해짐
카드 호버:   -translate-y-0.5 + shadow-hover
페이지 전환: fade-in 200ms
모달 등장:   scale 95% → 100% + opacity 0 → 1, 200ms
로딩:        부드러운 스피너 (primary 컬러) 또는 Skeleton
토스트:      슬라이드 + fade-in
```

## 시안 추출 핵심 요소 (BrightBoard 시안 기반)

- 베이지/크림 배경 + 화이트 카드 조합
- 파스텔 그린/오렌지/블루/퍼플 4종 액센트
- 둥근 카드 (border-radius 16~20px)
- 하단 좌우 일러스트 (식물, 인물)
- 사이드바: 화이트 + 활성 메뉴만 컬러
- 통계 카드: 컬러풀한 아이콘 + 큰 숫자 + 작은 변화율 뱃지

## 영감 사이트
- **Stripe Dashboard** — 정보 밀도
- **Linear** — 마이크로 인터랙션
- **Notion** — 친근한 일러스트
- **Storyset** — 일러스트 소스
