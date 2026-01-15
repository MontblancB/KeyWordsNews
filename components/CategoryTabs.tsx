'use client'

import { useRouter, usePathname } from 'next/navigation'

const CATEGORIES = [
  { id: 'general', label: '종합' },
  { id: 'politics', label: '정치' },
  { id: 'economy', label: '경제' },
  { id: 'society', label: '사회' },
  { id: 'world', label: '국제' },
  { id: 'tech', label: 'IT' },
  { id: 'sports', label: '스포츠' },
  { id: 'entertainment', label: '연예' },
  { id: 'culture', label: '문화' },
]

export default function CategoryTabs() {
  const router = useRouter()
  const pathname = usePathname()

  const currentCategory = pathname.split('/').pop() || 'politics'

  return (
    <div className="sticky top-0 z-40 bg-white border-b border-gray-200 overflow-x-auto">
      <div className="flex gap-2 p-2">
        {CATEGORIES.map((category) => (
          <button
            key={category.id}
            onClick={() => router.push(`/topics/${category.id}`)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              currentCategory === category.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>
    </div>
  )
}
