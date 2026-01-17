import { useEffect, useRef, useState } from 'react'

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void> | void
  threshold?: number  // 새로고침 트리거 임계값 (픽셀)
  maxPullDown?: number  // 최대 당김 거리 (픽셀)
  resistance?: number  // 저항력 (1보다 크면 당기기 어려움)
}

interface PullToRefreshState {
  isPulling: boolean
  pullDistance: number
  isRefreshing: boolean
}

/**
 * Pull-to-Refresh 훅
 *
 * 네이티브 터치 이벤트를 활용한 당겨서 새로고침 기능
 * - 페이지 최상단에서만 작동
 * - 자연스러운 애니메이션
 * - 백그라운드 갱신
 */
export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  maxPullDown = 150,
  resistance = 2.5,
}: UsePullToRefreshOptions) {
  const [state, setState] = useState<PullToRefreshState>({
    isPulling: false,
    pullDistance: 0,
    isRefreshing: false,
  })

  const touchStartY = useRef<number>(0)
  const touchCurrentY = useRef<number>(0)
  const isPullingRef = useRef<boolean>(false)

  useEffect(() => {
    let mounted = true

    const handleTouchStart = (e: TouchEvent) => {
      // 페이지가 스크롤 최상단에 있을 때만 활성화
      if (window.scrollY === 0) {
        touchStartY.current = e.touches[0].clientY
        isPullingRef.current = true
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPullingRef.current) return

      touchCurrentY.current = e.touches[0].clientY
      const pullDistance = touchCurrentY.current - touchStartY.current

      // 아래로 당길 때만 (위로는 무시)
      if (pullDistance > 0) {
        // 저항력 적용 (당길수록 어려워짐)
        const adjustedDistance = Math.min(
          pullDistance / resistance,
          maxPullDown
        )

        setState({
          isPulling: true,
          pullDistance: adjustedDistance,
          isRefreshing: false,
        })

        // 스크롤 방지 (일정 거리 이상 당겼을 때만)
        if (adjustedDistance > 20) {
          e.preventDefault()
        }
      }
    }

    const handleTouchEnd = async () => {
      if (!isPullingRef.current) return

      isPullingRef.current = false
      const { pullDistance } = state

      // 임계값 이상 당겼으면 새로고침 실행
      if (pullDistance >= threshold) {
        if (!mounted) return

        setState({
          isPulling: false,
          pullDistance: 0,
          isRefreshing: true,
        })

        try {
          await onRefresh()
        } catch (error) {
          console.error('[PullToRefresh] Refresh failed:', error)
        } finally {
          if (mounted) {
            setState({
              isPulling: false,
              pullDistance: 0,
              isRefreshing: false,
            })
          }
        }
      } else {
        // 임계값 미만이면 원래대로 복귀
        setState({
          isPulling: false,
          pullDistance: 0,
          isRefreshing: false,
        })
      }
    }

    // 이벤트 리스너 등록
    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      mounted = false
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [onRefresh, threshold, maxPullDown, resistance, state.pullDistance])

  return {
    ...state,
    // 새로고침 진행률 (0-1)
    progress: Math.min(state.pullDistance / threshold, 1),
    // 임계값 도달 여부
    canRefresh: state.pullDistance >= threshold,
  }
}
