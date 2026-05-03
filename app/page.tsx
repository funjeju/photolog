import Link from 'next/link';
import { Leaf, Camera, FileText, Video, ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const FEATURES = [
  {
    icon: '📸',
    title: '사진이 곧 데이터',
    desc: 'EXIF·GPS·OCR로 시간, 위치, 메뉴판 텍스트까지 추출해 진짜 내 경험을 기록해요.',
    color: 'bg-primary-100',
    iconColor: 'text-primary-500',
  },
  {
    icon: '✍️',
    title: '두 가지 모드',
    desc: '부업·발행용 블로그 모드와 개인 기록용 다이어리 모드. 같은 사진, 다른 글.',
    color: 'bg-sky-200',
    iconColor: 'text-sky-300',
  },
  {
    icon: '🎬',
    title: '영상까지 한 번에',
    desc: '글 JSON이 그대로 Remotion으로 넘어가 숏폼 영상이 자동 생성돼요.',
    color: 'bg-lavender-200',
    iconColor: 'text-lavender-300',
  },
];

const STEPS = [
  { step: '01', title: '사진 업로드', desc: '갤러리에서 사진을 선택해 업로드하세요', icon: Camera },
  { step: '02', title: '모드 선택', desc: '블로그 또는 다이어리 중 선택하세요', icon: FileText },
  { step: '03', title: 'AI 생성', desc: 'EXIF·OCR·Vision AI가 분석해 글을 씁니다', icon: FileText },
  { step: '04', title: '발행 or 영상', desc: '블로그에 발행하거나 숏폼 영상으로 변환하세요', icon: Video },
];

const PLANS = [
  {
    name: 'Free',
    price: '무료',
    desc: '시작해보기',
    features: ['블로그·다이어리 월 5편', '영상 월 1편', 'EXIF·GPS 분석', '기본 톤 3종'],
    cta: '무료로 시작하기',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '₩29,900',
    desc: '/월',
    features: ['무제한 글', '영상 월 30편', 'OCR 분석', '자동 발행', '모든 톤 옵션'],
    cta: 'Pro 시작하기',
    highlight: true,
  },
];

const FAQS = [
  {
    q: 'EXIF 정보가 없는 사진은 어떻게 되나요?',
    a: 'EXIF가 없는 사진은 처리에서 제외됩니다. 카카오톡으로 전달받은 사진이나 스크린샷은 EXIF가 삭제되므로, 카메라로 직접 촬영한 사진을 업로드해주세요.',
  },
  {
    q: '생성된 글을 수정할 수 있나요?',
    a: '네, 글 결과 화면에서 단락별로 자유롭게 수정할 수 있습니다. 자막도 영상 생성 전에 수정 가능해요.',
  },
  {
    q: '영상은 어느 플랫폼에서 쓸 수 있나요?',
    a: '인스타그램 릴스(9:16), 유튜브(16:9), 인스타 피드(1:1) 세 가지 포맷으로 출력됩니다.',
  },
  {
    q: '월 사용량은 언제 초기화되나요?',
    a: '매월 1일 00:00(KST)에 자동으로 초기화됩니다.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur border-b border-border">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-100">
              <Leaf className="h-4 w-4 text-primary-500" />
            </div>
            <span className="font-bold text-foreground">PhotoLog</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">로그인</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">무료 시작</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
        <Badge variant="secondary" className="mb-6 px-4 py-1.5">
          사진 → 블로그 글 + 숏폼 영상 자동 생성
        </Badge>
        <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight mb-6">
          사진만 올리면,
          <br />
          <span className="text-primary-500">블로그 글과 숏폼 영상이 짜잔</span>
        </h1>
        <p className="text-lg text-foreground-muted max-w-xl mx-auto mb-8">
          EXIF·GPS·OCR을 분석해 진짜 내 경험 그대로 콘텐츠로.
          <br />
          Sora가 20초 만들 때, 우리는 3분짜리 진짜 일상을 만듭니다.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link href="/signup">
            <Button size="lg" className="gap-2 shadow-hover">
              무료로 시작하기
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="lg">로그인</Button>
          </Link>
        </div>
      </section>

      {/* Before / After */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-coral-200">
            <CardContent className="p-6 text-center">
              <p className="text-2xl mb-2">😩</p>
              <p className="font-semibold text-foreground">Before</p>
              <p className="text-sm text-foreground-muted mt-2">
                갤러리에 쌓인 사진 587장.
                <br />글 쓰려다 포기하고 그냥 삭제.
              </p>
            </CardContent>
          </Card>
          <Card className="border-primary-200 bg-primary-50">
            <CardContent className="p-6 text-center">
              <p className="text-2xl mb-2">✨</p>
              <p className="font-semibold text-primary-500">PhotoLog</p>
              <p className="text-sm text-foreground-muted mt-2">
                사진 던지면 30초 안에 블로그 글 완성.
                <br />버튼 하나로 숏폼 영상도.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 핵심 기능 */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <h2 className="text-2xl font-bold text-foreground text-center mb-10">
          왜 PhotoLog인가요?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <Card key={f.title} className="hover:-translate-y-0.5 transition-all duration-200">
              <CardContent className="p-6">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${f.color} mb-4`}>
                  <span className="text-lg">{f.icon}</span>
                </div>
                <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-foreground-muted">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-background-subtle py-16">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-foreground text-center mb-10">
            이렇게 사용해요
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map(({ step, title, desc, icon: Icon }) => (
              <div key={step} className="flex flex-col items-center text-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100">
                  <span className="text-sm font-bold text-primary-500">{step}</span>
                </div>
                <h3 className="font-semibold text-foreground">{title}</h3>
                <p className="text-sm text-foreground-muted">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 가격 */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-foreground text-center mb-10">
          합리적인 가격
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {PLANS.map((plan) => (
            <Card key={plan.name} className={plan.highlight ? 'border-primary-300 shadow-hover' : ''}>
              <CardContent className="p-6">
                {plan.highlight && (
                  <Badge className="mb-3">추천</Badge>
                )}
                <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mt-1 mb-4">
                  <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-sm text-foreground-muted">{plan.desc}</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-foreground-muted">
                      <Check className="h-4 w-4 text-primary-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/signup">
                  <Button
                    className="w-full"
                    variant={plan.highlight ? 'default' : 'outline'}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-background-subtle py-16">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-foreground text-center mb-10">
            자주 묻는 질문
          </h2>
          <Accordion type="single" collapsible>
            {FAQS.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger>{faq.q}</AccordionTrigger>
                <AccordionContent>{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary-100">
              <Leaf className="h-3.5 w-3.5 text-primary-500" />
            </div>
            <span className="text-sm font-medium text-foreground">PhotoLog</span>
          </div>
          <p className="text-xs text-foreground-subtle">
            © 2026 PhotoLog. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
