'use client'

import { useLatestNews } from '@/hooks/useNews'
import NewsCard from '@/components/NewsCard'
import BottomNav from '@/components/BottomNav'
import BreakingBanner from '@/components/BreakingBanner'

export default function HomePage() {
  const { data: news, isLoading, error } = useLatestNews()

  return (
    <>
      <header className="bg-blue-600 text-white p-4 sticky top-0 z-50">
        <h1 className="text-xl font-bold">키워드뉴스</h1>
        <p className="text-sm opacity-90">실시간 뉴스 속보</p>
      </header>

      <BreakingBanner />

      <main className="pb-20">
        {isLoading && (
          <div className="p-8 text-center text-gray-500">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2">뉴스를 불러오는 중...</p>
          </div>
        )}

        {error && (
          <div className="p-8 text-center text-red-600">
            <p>뉴스를 불러오는데 실패했습니다.</p>
            <p className="text-sm mt-2">{(error as Error).message}</p>
          </div>
        )}

        {!isLoading && !error && news && news.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <p>아직 수집된 뉴스가 없습니다.</p>
            <p className="text-sm mt-2">잠시 후 다시 시도해주세요.</p>
          </div>
        )}

        {news && news.length > 0 && (
          <div>
            {news.map((item) => (
              <NewsCard key={item.id} news={item} />
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </>
  )
}
