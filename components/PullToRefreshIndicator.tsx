import { ArrowPathIcon } from '@heroicons/react/24/outline'

interface PullToRefreshIndicatorProps {
  isPulling: boolean
  pullDistance: number
  isRefreshing: boolean
  progress: number
  canRefresh: boolean
}

/**
 * Pull-to-Refresh 인디케이터
 *
 * 화면 상단에 고정되어 당김 정도를 시각적으로 표시
 */
export default function PullToRefreshIndicator({
  isPulling,
  pullDistance,
  isRefreshing,
  progress,
  canRefresh,
}: PullToRefreshIndicatorProps) {
  // 표시 조건: 당기는 중이거나 새로고침 중
  const shouldShow = isPulling || isRefreshing

  if (!shouldShow) return null

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center pointer-events-none"
      style={{
        transform: `translateY(${Math.min(pullDistance, 80)}px)`,
        opacity: Math.min(progress * 1.5, 1),
        transition: isPulling ? 'none' : 'transform 0.3s ease, opacity 0.3s ease',
      }}
    >
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-full p-3 flex items-center justify-center">
        <ArrowPathIcon
          className={`w-6 h-6 ${
            isRefreshing
              ? 'animate-spin text-blue-600 dark:text-blue-400'
              : canRefresh
              ? 'text-green-600 dark:text-green-400'
              : 'text-gray-400 dark:text-gray-500'
          }`}
          style={{
            transform: isPulling && !isRefreshing ? `rotate(${progress * 360}deg)` : undefined,
            transition: isPulling ? 'none' : 'transform 0.3s ease',
          }}
        />
      </div>

      {/* 텍스트 표시 (선택사항) */}
      {!isRefreshing && isPulling && (
        <div className="ml-2 text-sm font-medium text-gray-600 dark:text-gray-400">
          {canRefresh ? '놓아서 새로고침' : '당겨서 새로고침'}
        </div>
      )}
    </div>
  )
}
