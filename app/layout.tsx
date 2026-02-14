import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

export const metadata: Metadata = {
  metadataBase: new URL('https://key-words-news.vercel.app'),
  title: '키워드뉴스 - 실시간 뉴스',
  description:
    '실시간 긴급 속보, 카테고리별 뉴스, AI 요약, 경제 지표를 한눈에 확인하는 뉴스 서비스',
  manifest: '/manifest.json',
  themeColor: '#2563eb',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
  openGraph: {
    title: '키워드뉴스 - 실시간 뉴스',
    description:
      '실시간 긴급 속보, 카테고리별 뉴스, AI 요약, 경제 지표를 한눈에 확인하는 뉴스 서비스',
    url: 'https://key-words-news.vercel.app',
    siteName: '키워드뉴스',
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: '키워드뉴스 - 실시간 뉴스',
    description:
      '실시간 긴급 속보, 카테고리별 뉴스, AI 요약, 경제 지표를 한눈에 확인하는 뉴스 서비스',
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: '키워드뉴스',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        {/* iOS Safari 화면 방향 힌트 (PWA 모드에서만 작동) */}
        <meta name="screen-orientation" content="portrait" />
        <meta name="x5-orientation" content="portrait" />
      </head>
      <body className="bg-white dark:bg-gray-900">
        <Providers>
          <div className="max-w-2xl mx-auto bg-white dark:bg-gray-900 min-h-screen">
            {children}
          </div>
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
