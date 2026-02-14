'use client'

import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <div className="text-center max-w-md">
        <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
          오류가 발생했습니다
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          일시적인 문제가 발생했습니다. 다시 시도해주세요.
        </p>
        <button
          onClick={reset}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          다시 시도
        </button>
      </div>
    </div>
  )
}
