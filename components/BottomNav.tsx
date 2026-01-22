'use client'

import { usePathname, useRouter } from 'next/navigation'
import {
  BoltIcon,
  NewspaperIcon,
  StarIcon,
  PresentationChartLineIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline'
import {
  BoltIcon as BoltIconSolid,
  NewspaperIcon as NewspaperIconSolid,
  StarIcon as StarIconSolid,
  PresentationChartLineIcon as PresentationChartLineIconSolid,
  Cog6ToothIcon as Cog6ToothIconSolid,
} from '@heroicons/react/24/solid'

// 햅틱 피드백 (Android Chrome만 지원, iOS 미지원)
// UX 가이드라인: 버튼 탭 20-30ms 권장
const triggerHaptic = (duration: number = 30) => {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(duration)
    } catch {
      // 진동 실패 시 무시
    }
  }
}

export default function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()

  const handleNavClick = (path: string) => {
    triggerHaptic(30) // 30ms - 버튼 탭 권장 시간
    router.push(path)
  }

  const navItems = [
    {
      icon: BoltIcon,
      iconSolid: BoltIconSolid,
      label: '종합',
      path: '/',
      color: 'text-red-500',
    },
    {
      icon: NewspaperIcon,
      iconSolid: NewspaperIconSolid,
      label: '토픽',
      path: '/topics/politics',
      color: 'text-blue-500',
    },
    {
      icon: StarIcon,
      iconSolid: StarIconSolid,
      label: '키워드',
      path: '/keywords',
      color: 'text-yellow-500',
    },
    {
      icon: PresentationChartLineIcon,
      iconSolid: PresentationChartLineIconSolid,
      label: '경제지표',
      path: '/economy',
      color: 'text-green-500',
    },
    {
      icon: Cog6ToothIcon,
      iconSolid: Cog6ToothIconSolid,
      label: '설정',
      path: '/settings',
      color: 'text-gray-500',
    },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50">
      <div className="max-w-2xl mx-auto flex justify-around">
        {navItems.map((item) => {
          const isActive =
            pathname === item.path ||
            (item.path !== '/' && pathname.startsWith(item.path))
          const Icon = isActive ? item.iconSolid : item.icon

          return (
            <button
              key={item.path}
              onClick={() => handleNavClick(item.path)}
              className={`flex-1 py-3 flex flex-col items-center gap-1 transition-all ${
                isActive ? item.color : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
