import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: '키워드뉴스 - 실시간 뉴스',
  description: 'RSS 기반 실시간 뉴스 서비스',
  manifest: '/manifest.json',
  themeColor: '#1a73e8',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
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
    <html lang="ko">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body>
        <Providers>
          <div className="max-w-2xl mx-auto bg-white min-h-screen">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  )
}
