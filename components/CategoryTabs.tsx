'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useColorTheme } from '@/hooks/useColorTheme'

const CATEGORIES = [
  { id: 'politics', label: '정치' },
  { id: 'economy', label: '경제' },
  { id: 'society', label: '사회' },
  { id: 'world', label: '국제' },
  { id: 'tech', label: 'IT' },
  { id: 'crypto', label: '암호화폐' },
  { id: 'global', label: '글로벌' },
  { id: 'sports', label: '스포츠' },
  { id: 'entertainment', label: '연예' },
  { id: 'culture', label: '문화' },
]

export default function CategoryTabs() {
  const router = useRouter()
  const pathname = usePathname()
  const { buttonClasses } = useColorTheme()

  const currentCategory = pathname.split('/').pop() || 'politics'

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
      <div className="flex gap-2 p-2">
        {CATEGORIES.map((category) => (
          <button
            key={category.id}
            onClick={() => router.push(`/topics/${category.id}`)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              currentCategory === category.id
                ? buttonClasses
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>
    </div>
  )
}
