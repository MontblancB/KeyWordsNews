// components/KeywordManager.tsx
'use client'

import { useState } from 'react'
import { SavedKeyword } from '@/lib/keywords'
import { useColorTheme } from '@/hooks/useColorTheme'

interface KeywordManagerProps {
  keywords: SavedKeyword[]
  onAdd: (keyword: string) => { success: boolean; error?: string }
  onDelete: (id: string) => void
  onMoveUp: (id: string) => void
  onMoveDown: (id: string) => void
}

export default function KeywordManager({
  keywords,
  onAdd,
  onDelete,
  onMoveUp,
  onMoveDown
}: KeywordManagerProps) {
  const { buttonClasses, textClasses } = useColorTheme()
  const [input, setInput] = useState('')
  const [showList, setShowList] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!input.trim()) {
      setError('키워드를 입력해주세요.')
      return
    }

    const result = onAdd(input.trim())

    if (result.success) {
      setInput('')
      setError('')
      setShowList(false)
    } else {
      setError(result.error || '키워드 추가 실패')
    }
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700">
      {/* 키워드 추가 폼 */}
      <form onSubmit={handleSubmit} className="mb-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="새 키워드 추가..."
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            maxLength={30}
          />
          <button
            type="submit"
            className={`px-4 py-2 rounded-lg transition-colors ${buttonClasses}`}
          >
            추가
          </button>
        </div>
        {error && (
          <p className="text-red-500 dark:text-red-400 text-sm mt-1">{error}</p>
        )}
      </form>

      {/* 키워드 관리 버튼 */}
      {keywords.length > 0 && (
        <button
          onClick={() => setShowList(!showList)}
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
        >
          {showList ? '△' : '▽'} 키워드 관리 ({keywords.length}개)
        </button>
      )}

      {/* 키워드 리스트 */}
      {showList && keywords.length > 0 && (
        <div className="mt-3 space-y-2">
          {keywords.map((item, index) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-2 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600"
            >
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.keyword}</span>
              <div className="flex items-center gap-2">
                {/* 위로 이동 버튼 */}
                <button
                  onClick={() => onMoveUp(item.id)}
                  disabled={index === 0}
                  className={`px-2 py-1 text-sm ${
                    index === 0
                      ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                      : textClasses
                  }`}
                  title="위로 이동"
                >
                  ▲
                </button>
                {/* 아래로 이동 버튼 */}
                <button
                  onClick={() => onMoveDown(item.id)}
                  disabled={index === keywords.length - 1}
                  className={`px-2 py-1 text-sm ${
                    index === keywords.length - 1
                      ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                      : textClasses
                  }`}
                  title="아래로 이동"
                >
                  ▼
                </button>
                {/* 삭제 버튼 */}
                <button
                  onClick={() => {
                    if (confirm(`"${item.keyword}" 키워드를 삭제하시겠습니까?`)) {
                      onDelete(item.id)
                    }
                  }}
                  className="px-2 py-1 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm"
                  title="삭제"
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
