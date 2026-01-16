'use client'

import { useSwipeable } from 'react-swipeable'
import { useRouter, usePathname } from 'next/navigation'
import { ReactNode } from 'react'

interface SwipeableLayoutProps {
  children: ReactNode
}

export default function SwipeableLayout({ children }: SwipeableLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()

  // 탭 순서 정의 (BottomNav와 동일)
  const tabs = [
    '/',                    // 속보
    '/topics/general',      // 토픽
    '/keywords',            // 키워드
    '/economy',             // 경제지표
    '/settings',            // 설정
  ]

  // 현재 탭 인덱스 찾기
  const getCurrentIndex = () => {
    if (pathname === '/') return 0
    if (pathname.startsWith('/topics/')) return 1
    if (pathname.startsWith('/keywords')) return 2
    if (pathname.startsWith('/economy')) return 3
    if (pathname.startsWith('/settings')) return 4
    return -1
  }

  const currentIndex = getCurrentIndex()

  // 스와이프 핸들러
  const handlers = useSwipeable({
    onSwipedLeft: () => {
      // 왼쪽으로 스와이프 = 다음 탭으로 이동
      if (currentIndex >= 0 && currentIndex < tabs.length - 1) {
        router.push(tabs[currentIndex + 1])
      }
    },
    onSwipedRight: () => {
      // 오른쪽으로 스와이프 = 이전 탭으로 이동
      if (currentIndex > 0) {
        router.push(tabs[currentIndex - 1])
      }
    },
    preventScrollOnSwipe: false,  // 세로 스크롤 허용 (뉴스 스크롤 가능)
    trackMouse: false,             // 마우스 드래그 비활성화 (모바일만)
    delta: 50,                     // 최소 50px 이동 필요 (오작동 방지)
  })

  return (
    <div {...handlers} className="min-h-screen">
      {children}
    </div>
  )
}
