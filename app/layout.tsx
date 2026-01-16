import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import SwipeableLayout from '@/components/SwipeableLayout'

export const metadata: Metadata = {
  title: '키워드뉴스 - 실시간 뉴스',
  description: 'RSS 기반 실시간 뉴스 서비스',
  manifest: '/manifest.json',
  themeColor: '#2563eb',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
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
            <SwipeableLayout>
              {children}
            </SwipeableLayout>
          </div>
        </Providers>
      </body>
    </html>
  )
}
