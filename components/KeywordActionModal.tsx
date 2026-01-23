'use client'

import { useState } from 'react'
import {
  XMarkIcon,
  BookOpenIcon,
  PlusCircleIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'
import { useKeywords } from '@/hooks/useKeywords'

interface KeywordActionModalProps {
  keyword: string
  onClose: () => void
}

export default function KeywordActionModal({
  keyword,
  onClose,
}: KeywordActionModalProps) {
  const [selectedAction, setSelectedAction] = useState<
    'main' | 'explain' | 'add'
  >('main')
  const [explanation, setExplanation] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [addSuccess, setAddSuccess] = useState(false)

  const { addKeyword } = useKeywords()

  // 용어 설명 가져오기
  const handleExplain = async () => {
    setSelectedAction('explain')
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/keyword/explain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ keyword }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`)
      }

      if (data.success) {
        setExplanation(data.data.explanation)
      } else {
        throw new Error(data.error || '용어 설명을 가져오지 못했습니다.')
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
      setError(errorMessage)
      console.error('Keyword explain error:', err)
    } finally {
      setLoading(false)
    }
  }

  // 키워드 추가
  const handleAddKeyword = () => {
    setSelectedAction('add')
    const result = addKeyword(keyword)

    if (result.success) {
      setAddSuccess(true)
      // 2초 후 모달 닫기
      setTimeout(() => {
        onClose()
      }, 2000)
    } else {
      setError(result.error || '키워드 추가에 실패했습니다.')
    }
  }

  // 뒤로 가기
  const handleBack = () => {
    setSelectedAction('main')
    setError(null)
  }

  // 설명 내용 렌더링
  const renderExplanation = () => {
    if (!explanation) return null

    const lines = explanation.split('\n').filter((line) => line.trim())

    return (
      <div className="space-y-3">
        {lines.map((line, index) => {
          // 섹션 헤더 (이모지 포함)
          if (
            line.match(/^[📌📚💡⚠️]/) ||
            line.includes('**') ||
            line.match(/^(핵심|상세|실생활|주의)/)
          ) {
            return (
              <div
                key={index}
                className="font-semibold text-purple-700 dark:text-purple-300 text-sm mt-3 first:mt-0"
              >
                {line.replace(/\*\*/g, '')}
              </div>
            )
          }
          // 불릿 포인트
          if (line.startsWith('•')) {
            return (
              <div
                key={index}
                className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
              >
                <span className="text-purple-500 dark:text-purple-400 font-bold flex-shrink-0">
                  •
                </span>
                <span className="leading-relaxed">
                  {line.replace('•', '').trim()}
                </span>
              </div>
            )
          }
          // 일반 텍스트
          return (
            <p
              key={index}
              className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed"
            >
              {line}
            </p>
          )
        })}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            {selectedAction !== 'main' && (
              <button
                onClick={handleBack}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ←
              </button>
            )}
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {selectedAction === 'main' && `키워드: ${keyword}`}
              {selectedAction === 'explain' && '용어 설명'}
              {selectedAction === 'add' && '키워드 추가'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* 내용 */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* 메인 화면 */}
          {selectedAction === 'main' && (
            <div className="space-y-3">
              <button
                onClick={handleExplain}
                className="w-full flex items-center gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-colors text-left"
              >
                <BookOpenIcon className="w-6 h-6 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    용어 설명
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    이 키워드에 대해 자세히 알아보기
                  </div>
                </div>
              </button>

              <button
                onClick={handleAddKeyword}
                className="w-full flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors text-left"
              >
                <PlusCircleIcon className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    키워드 추가
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    키워드 탭에 추가하여 관련 뉴스 구독
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* 용어 설명 화면 */}
          {selectedAction === 'explain' && (
            <div>
              {loading && (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-12 h-12 border-4 border-purple-600 dark:border-purple-400 border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    AI가 용어를 분석하고 있습니다...
                  </p>
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}

              {explanation && !loading && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-2 mb-3 pb-3 border-b border-purple-200 dark:border-purple-700">
                    <SparklesIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <span className="font-semibold text-purple-700 dark:text-purple-300">
                      AI 용어 설명
                    </span>
                  </div>
                  {renderExplanation()}
                </div>
              )}
            </div>
          )}

          {/* 키워드 추가 화면 */}
          {selectedAction === 'add' && (
            <div>
              {addSuccess ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
                    <svg
                      className="w-8 h-8 text-green-600 dark:text-green-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                    키워드 추가 완료!
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-center">
                    "{keyword}" 키워드가 키워드 탭에 추가되었습니다.
                    <br />
                    이제 관련 뉴스를 확인할 수 있습니다.
                  </p>
                </div>
              ) : (
                error && (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-yellow-700 dark:text-yellow-400">
                    {error}
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
