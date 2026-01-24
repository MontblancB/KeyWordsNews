'use client'

import { Fragment, useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, InformationCircleIcon } from '@heroicons/react/24/outline'

interface KeywordInfoModalProps {
  isOpen: boolean
  onClose: () => void
  keyword: string
}

export default function KeywordInfoModal({ isOpen, onClose, keyword }: KeywordInfoModalProps) {
  const [info, setInfo] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && keyword) {
      fetchKeywordInfo()
    }
  }, [isOpen, keyword])

  const fetchKeywordInfo = async () => {
    setIsLoading(true)
    setError(null)
    setInfo('')

    try {
      const res = await fetch('/api/keywords/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword }),
      })

      if (!res.ok) {
        throw new Error('키워드 정보를 가져오는데 실패했습니다.')
      }

      const data = await res.json()
      setInfo(data.info)
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-xl transition-all">
                {/* 헤더 */}
                <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <InformationCircleIcon className="w-6 h-6 text-blue-500" />
                    <Dialog.Title className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      키워드 정보
                    </Dialog.Title>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                    aria-label="닫기"
                  >
                    <XMarkIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  </button>
                </div>

                {/* 키워드 */}
                <div className="px-6 pt-4">
                  <div className="inline-block px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      {keyword}
                    </span>
                  </div>
                </div>

                {/* 내용 */}
                <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400 mb-4"></div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        AI가 키워드를 분석하고 있습니다...
                      </p>
                    </div>
                  ) : error ? (
                    <div className="py-8 text-center">
                      <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                      <button
                        onClick={fetchKeywordInfo}
                        className="mt-4 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        다시 시도
                      </button>
                    </div>
                  ) : info ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                        {info}
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* 푸터 */}
                <div className="px-6 pb-6 pt-2">
                  <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
                    🤖 AI 기반 키워드 분석
                  </p>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
