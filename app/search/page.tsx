'use client'

import { Suspense } from 'react'
import BottomNav from '@/components/BottomNav'
import SearchContent from '@/components/SearchContent'

export default function SearchPage() {
  return (
    <>
      <Suspense fallback={<SearchFallback />}>
        <SearchContent />
      </Suspense>
      <BottomNav />
    </>
  )
}

function SearchFallback() {
  return (
    <>
      <header className="bg-blue-600 text-white p-4 sticky top-0 z-50">
        <h1 className="text-xl font-bold mb-3">뉴스 검색</h1>
        <div className="flex gap-2">
          <input
            type="text"
            disabled
            placeholder="검색어를 입력하세요..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            disabled
            className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors font-medium opacity-50"
          >
            검색
          </button>
        </div>
      </header>
      <main className="pb-20 bg-white dark:bg-gray-900">
        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
          <p className="mt-2">로딩 중...</p>
        </div>
      </main>
    </>
  )
}

