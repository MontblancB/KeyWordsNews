'use client'

import BottomNav from '@/components/BottomNav'
import BreakingTabSourceManager from '@/components/BreakingTabSourceManager'
import ThemeToggle from '@/components/ThemeToggle'
import ColorThemeSelector from '@/components/ColorThemeSelector'
import AISummaryToggle from '@/components/AISummaryToggle'
import NewsInsightToggle from '@/components/NewsInsightToggle'
import FontSizeControl from '@/components/FontSizeControl'
import CategoryOrderManager from '@/components/CategoryOrderManager'
import { useColorTheme } from '@/hooks/useColorTheme'
import { InformationCircleIcon } from '@heroicons/react/24/outline'

export default function SettingsPage() {
  const { headerClasses } = useColorTheme()

  return (
    <>
      <header className={`${headerClasses} text-white p-4 sticky top-0 z-50`}>
        <h1 className="text-xl font-bold">설정</h1>
      </header>

      <main className="pb-20 p-4 bg-gray-50 dark:bg-gray-900 space-y-4">
        {/* 다크 모드 설정 */}
        <ThemeToggle />

        {/* AI 요약 설정 */}
        <AISummaryToggle />

        {/* 전문가 의견 설정 */}
        <NewsInsightToggle />

        {/* 색상 테마 설정 */}
        <ColorThemeSelector />

        {/* 폰트 크기 설정 */}
        <FontSizeControl />

        {/* 카테고리 순서 관리 */}
        <CategoryOrderManager />

        {/* 뉴스 소스 관리 */}
        <BreakingTabSourceManager />

        {/* 앱 정보 */}
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <InformationCircleIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              앱 정보
            </h3>
          </div>
          <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
            <p>버전: 2.30.3</p>
            <p>마지막 업데이트: 2026-01-23</p>
          </div>
        </div>
      </main>

      <BottomNav />
    </>
  )
}
