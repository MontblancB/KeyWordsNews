'use client'

import { usePathname, useRouter } from 'next/navigation'
import {
  BoltIcon,
  NewspaperIcon,
  StarIcon,
  MagnifyingGlassIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline'
import {
  BoltIcon as BoltIconSolid,
  NewspaperIcon as NewspaperIconSolid,
  StarIcon as StarIconSolid,
  MagnifyingGlassIcon as MagnifyingGlassIconSolid,
  Cog6ToothIcon as Cog6ToothIconSolid,
} from '@heroicons/react/24/solid'

export default function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()

  const navItems = [
    {
      icon: BoltIcon,
      iconSolid: BoltIconSolid,
      label: '속보',
      path: '/',
      color: 'text-red-500',
    },
    {
      icon: NewspaperIcon,
      iconSolid: NewspaperIconSolid,
      label: '토픽',
      path: '/topics/general',
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
      icon: MagnifyingGlassIcon,
      iconSolid: MagnifyingGlassIconSolid,
      label: '검색',
      path: '/search',
      color: 'text-purple-500',
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
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="max-w-2xl mx-auto flex justify-around">
        {navItems.map((item) => {
          const isActive =
            pathname === item.path ||
            (item.path !== '/' && pathname.startsWith(item.path))
          const Icon = isActive ? item.iconSolid : item.icon

          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`flex-1 py-3 flex flex-col items-center gap-1 transition-all ${
                isActive ? item.color : 'text-gray-400'
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
