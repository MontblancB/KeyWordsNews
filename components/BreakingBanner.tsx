'use client'

import { useBreakingNews } from '@/hooks/useNews'
import Link from 'next/link'

export default function BreakingBanner() {
  const { data: breaking, isLoading } = useBreakingNews()

  if (isLoading || !breaking || breaking.length === 0) {
    return null
  }

  const latestBreaking = breaking[0]

  return (
    <Link
      href={latestBreaking.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-red-600 text-white p-3 sticky top-0 z-40"
    >
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold flex-shrink-0">🚨 속보</span>
        <p className="text-sm font-medium line-clamp-1 animate-pulse">
          {latestBreaking.title}
        </p>
      </div>
    </Link>
  )
}
