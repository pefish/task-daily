import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '暖暖online｜每日进步一点点',
  description: '集每日计划、开销记录与热点阅读于一体的温暖成长小助手。',
  openGraph: {
    title: '暖暖online｜每日进步一点点',
    description: '每日计划、开销记录与热点阅读，陪你把普通日子过得闪闪发光。',
    images: [{ url: '/og.png', width: 1672, height: 941, alt: '暖暖online' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '暖暖online｜每日进步一点点',
    description: '每日计划、开销记录与热点阅读，陪你把普通日子过得闪闪发光。',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
