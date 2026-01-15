'use client'

import { useTopicNews } from '@/hooks/useNews'
import NewsCard from '@/components/NewsCard'
import BottomNav from '@/components/BottomNav'
import CategoryTabs from '@/components/CategoryTabs'
import { useParams } from 'next/navigation'

export default function TopicPage() {
  const params = useParams()
  const category = params.category as string
  const { data: news, isLoading, error } = useTopicNews(category)

  const categoryNames: Record<string, string> = {
    general: '종합',
    politics: '정치',
    economy: '경제',
    society: '사회',
    world: '국제',
    tech: 'IT/과학',
    sports: '스포츠',
    entertainment: '연예',
    culture: '문화',
  }

  return (
    <>
      <header className="bg-blue-600 text-white p-4">
        <h1 className="text-xl font-bold">
          {categoryNames[category] || category} 뉴스
        </h1>
      </header>

      <CategoryTabs />

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
          </div>
        )}

        {!isLoading && !error && news && news.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <p>아직 수집된 뉴스가 없습니다.</p>
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
