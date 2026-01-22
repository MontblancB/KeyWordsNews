'use client'

import { useQuery } from '@tanstack/react-query'
import { useState, useEffect, useCallback } from 'react'
import type { StockSearchItem, StockInfo, RecentStock } from '@/types/stock'

const RECENT_STOCKS_KEY = 'recent_stocks'
const MAX_RECENT_STOCKS = 5

/**
 * 종목 검색 훅
 */
export function useStockSearch(query: string) {
  return useQuery<StockSearchItem[]>({
    queryKey: ['stock', 'search', query],
    queryFn: async () => {
      if (!query || query.trim().length === 0) {
        return []
      }

      const response = await fetch(`/api/stock/search?q=${encodeURIComponent(query)}`)
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Search failed')
      }

      return data.data
    },
    enabled: query.length >= 1,
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  })
}

/**
 * 종목 상세 정보 훅
 */
export function useStockInfo(stock: StockSearchItem | null) {
  return useQuery<StockInfo>({
    queryKey: ['stock', 'info', stock?.code, stock?.market, stock?.symbol],
    queryFn: async () => {
      if (!stock) {
        throw new Error('Stock is required')
      }

      const params = new URLSearchParams({
        code: stock.code,
      })

      if (stock.name) {
        params.append('name', stock.name)
      }

      if (stock.market) {
        params.append('market', stock.market)
      }

      if (stock.symbol) {
        params.append('symbol', stock.symbol)
      }

      const response = await fetch(`/api/stock/info?${params.toString()}`)
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch stock info')
      }

      return data.data
    },
    enabled: !!stock,
    staleTime: 1 * 60 * 1000, // 1분
    gcTime: 5 * 60 * 1000, // 5분
  })
}

/**
 * 최근 검색 종목 관리 훅
 */
export function useRecentStocks() {
  const [recentStocks, setRecentStocks] = useState<RecentStock[]>([])

  // 초기 로드
  useEffect(() => {
    if (typeof window === 'undefined') return

    const stored = localStorage.getItem(RECENT_STOCKS_KEY)
    if (stored) {
      try {
        setRecentStocks(JSON.parse(stored))
      } catch {
        setRecentStocks([])
      }
    }
  }, [])

  // 저장
  const saveRecentStocks = useCallback((stocks: RecentStock[]) => {
    setRecentStocks(stocks)
    if (typeof window !== 'undefined') {
      localStorage.setItem(RECENT_STOCKS_KEY, JSON.stringify(stocks))
    }
  }, [])

  // 종목 추가
  const addRecentStock = useCallback(
    (stock: StockSearchItem) => {
      const newStock: RecentStock = {
        code: stock.code,
        name: stock.name,
        market: stock.market,
        symbol: stock.symbol,
        searchedAt: new Date().toISOString(),
      }

      setRecentStocks((prev) => {
        // 중복 제거 후 앞에 추가
        const filtered = prev.filter((s) => s.code !== stock.code)
        const updated = [newStock, ...filtered].slice(0, MAX_RECENT_STOCKS)

        if (typeof window !== 'undefined') {
          localStorage.setItem(RECENT_STOCKS_KEY, JSON.stringify(updated))
        }

        return updated
      })
    },
    []
  )

  // 종목 삭제
  const removeRecentStock = useCallback(
    (code: string) => {
      setRecentStocks((prev) => {
        const updated = prev.filter((s) => s.code !== code)
        if (typeof window !== 'undefined') {
          localStorage.setItem(RECENT_STOCKS_KEY, JSON.stringify(updated))
        }
        return updated
      })
    },
    []
  )

  // 전체 삭제
  const clearRecentStocks = useCallback(() => {
    saveRecentStocks([])
  }, [saveRecentStocks])

  return {
    recentStocks,
    addRecentStock,
    removeRecentStock,
    clearRecentStocks,
  }
}
