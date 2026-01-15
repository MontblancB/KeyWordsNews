'use client'

import BottomNav from '@/components/BottomNav'
import RssSourceManager from '@/components/RssSourceManager'

export default function SettingsPage() {
  return (
    <>
      <header className="bg-blue-600 text-white p-4 sticky top-0 z-50">
        <h1 className="text-xl font-bold">설정</h1>
      </header>

      <main className="pb-20">
        {/* RSS 소스 관리 섹션 */}
        <section className="bg-white border-b-8 border-gray-100">
          <RssSourceManager />
        </section>

        {/* 추가 설정 섹션 (향후 확장 가능) */}
        <section className="p-4 bg-white">
          <h3 className="text-lg font-bold text-gray-900 mb-3">앱 정보</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>버전: 1.0.1</p>
            <p>마지막 업데이트: 2026-01-16</p>
          </div>
        </section>
      </main>

      <BottomNav />
    </>
  )
}
