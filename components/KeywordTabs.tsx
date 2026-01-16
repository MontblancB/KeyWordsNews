// components/KeywordTabs.tsx
'use client'

import { SavedKeyword } from '@/lib/keywords'

interface KeywordTabsProps {
  keywords: SavedKeyword[]
  activeKeyword: string | null
  onSelectKeyword: (keyword: string) => void
}

export default function KeywordTabs({
  keywords,
  activeKeyword,
  onSelectKeyword
}: KeywordTabsProps) {
  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-16 z-40">
      <div className="flex overflow-x-auto scrollbar-hide">
        {keywords.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelectKeyword(item.keyword)}
            className={`
              px-4 py-3 text-sm font-medium whitespace-nowrap
              border-b-2 transition-colors
              ${
                activeKeyword === item.keyword
                  ? 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }
            `}
          >
            {item.keyword}
          </button>
        ))}
      </div>
    </div>
  )
}
