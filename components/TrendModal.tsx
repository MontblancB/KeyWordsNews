'use client'

import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, FireIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { useTrends } from '@/hooks/useTrends'
import { useRouter } from 'next/navigation'

interface TrendModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function TrendModal({ isOpen, onClose }: TrendModalProps) {
  const router = useRouter()
  const { data, isLoading, refetch, isRefetching, error } = useTrends()

  const handleKeywordClick = (keyword: string) => {
    router.push(`/search?q=${encodeURIComponent(keyword)}`)
    onClose()
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25 dark:bg-opacity-50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-xl transition-all">
                {/* 헤더 */}
                <div className="flex items-center justify-between p-6 pb-4">
                  <div className="flex items-center gap-2">
                    <FireIcon className="w-6 h-6 text-orange-500" />
                    <Dialog.Title className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      실시간 트렌드
                    </Dialog.Title>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => refetch()}
                      disabled={isRefetching}
                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors disabled:opacity-50"
                      aria-label="새로고침"
                    >
                      <ArrowPathIcon
                        className={`w-5 h-5 text-gray-500 dark:text-gray-400 ${
                          isRefetching ? 'animate-spin' : ''
                        }`}
                      />
                    </button>
                    <button
                      onClick={onClose}
                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                      aria-label="닫기"
                    >
                      <XMarkIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </button>
                  </div>
                </div>

                {/* 트렌드 리스트 */}
                <div className="px-6 pb-6">
                  {isLoading ? (
                    <div className="space-y-1 max-h-[60vh] overflow-y-auto">
                      {/* 스켈레톤 UI - 20개 아이템 */}
                      {Array.from({ length: 20 }).map((_, index) => (
                        <div
                          key={index}
                          className="w-full flex items-center gap-3 p-3 rounded-lg"
                        >
                          <div className="w-8 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse flex-shrink-0" />
                          <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" style={{ width: `${60 + Math.random() * 30}%` }} />
                        </div>
                      ))}
                    </div>
                  ) : error ? (
                    <div className="py-12 text-center">
                      <p className="text-sm text-red-600 dark:text-red-400">
                        트렌드를 불러오는데 실패했습니다.
                      </p>
                      <button
                        onClick={() => refetch()}
                        className="mt-4 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        다시 시도
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1 max-h-[60vh] overflow-y-auto">
                      {data?.data?.map((trend, index) => (
                        <button
                          key={`${trend.keyword}-${index}`}
                          onClick={() => handleKeywordClick(trend.keyword)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors text-left group"
                        >
                          <span className="text-lg font-bold text-orange-500 w-8 flex-shrink-0">
                            {trend.rank}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                              {trend.keyword}
                            </div>
                          </div>
                          <span className="text-xs text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                            클릭하여 관련 뉴스 보기 →
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 출처 및 기준 시간 */}
                <div className="px-6 pb-6 space-y-2">
                  <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
                    {data?.source?.includes('trendspyg')
                      ? '🔥 Google Trends 실시간 검색어'
                      : '📊 최근 24시간 뉴스 키워드 분석'}
                  </p>
                  {data?.collectedAt && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
                      실시간 기준:{' '}
                      {new Date(data.collectedAt).toLocaleString('ko-KR', {
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </p>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
