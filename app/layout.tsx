import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/sonner';

export const metadata: Metadata = {
  title: {
    default: 'PhotoLog — 사진으로 만드는 블로그 & 영상',
    template: '%s | PhotoLog',
  },
  description: '사진을 업로드하면 EXIF·GPS·OCR·AI가 블로그 글과 숏폼 영상을 자동으로 만들어드립니다.',
  keywords: ['블로그 자동생성', 'AI 글쓰기', '사진 블로그', '숏폼 영상', 'EXIF'],
  openGraph: {
    title: 'PhotoLog — 사진으로 만드는 블로그 & 영상',
    description: '사진을 업로드하면 EXIF·GPS·OCR·AI가 블로그 글과 숏폼 영상을 자동으로 만들어드립니다.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.css"
        />
      </head>
      <body className="font-sans antialiased">
        <AuthProvider>
          {children}
          <Toaster richColors position="top-right" />
        </AuthProvider>
      </body>
    </html>
  );
}
