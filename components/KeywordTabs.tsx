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
    <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
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
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
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
