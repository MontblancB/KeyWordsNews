'use client'

import BottomNav from '@/components/BottomNav'
import RssSourceManager from '@/components/RssSourceManager'
import ThemeToggle from '@/components/ThemeToggle'

export default function SettingsPage() {
  return (
    <>
      <header className="bg-blue-600 dark:bg-blue-700 text-white p-4 sticky top-0 z-50">
        <h1 className="text-xl font-bold">설정</h1>
      </header>

      <main className="pb-20 bg-gray-50 dark:bg-gray-900">
        {/* 테마 설정 섹션 */}
        <section className="p-4 bg-white dark:bg-gray-800 border-b-8 border-gray-100 dark:border-gray-700">
          <ThemeToggle />
        </section>

        {/* 뉴스 소스 관리 섹션 */}
        <section className="bg-white dark:bg-gray-800 border-b-8 border-gray-100 dark:border-gray-700">
          <RssSourceManager />
        </section>

        {/* 앱 정보 섹션 */}
        <section className="p-4 bg-white dark:bg-gray-800">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">앱 정보</h3>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <p>버전: 2.2.0</p>
            <p>마지막 업데이트: 2026-01-16</p>
          </div>
        </section>
      </main>

      <BottomNav />
    </>
  )
}
