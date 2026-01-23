'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useColorTheme } from '@/hooks/useColorTheme'
import { useCategoryOrder } from '@/hooks/useCategoryOrder'
import { CATEGORY_LABELS } from '@/lib/settings/categoryOrder'

export default function CategoryTabs() {
  const router = useRouter()
  const pathname = usePathname()
  const { buttonClasses } = useColorTheme()
  const { categoryOrder } = useCategoryOrder()

  const currentCategory = pathname.split('/').pop() || 'politics'

  // 사용자 지정 순서대로 카테고리 정렬
  const sortedCategories = categoryOrder.map(id => ({
    id,
    label: CATEGORY_LABELS[id] || id,
  }))

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
      <div className="flex gap-2 p-2">
        {sortedCategories.map((category) => (
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
