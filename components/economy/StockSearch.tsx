'use client'

import { useState, useCallback } from 'react'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'
import type { StockSearchResult, StockInfo } from '@/types/stock'
import StockInfoCard from './StockInfo'

export default function StockSearch() {
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<StockSearchResult[]>([])
  const [selectedStock, setSelectedStock] = useState<StockInfo | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isLoadingInfo, setIsLoadingInfo] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 종목 검색
  const handleSearch = useCallback(async () => {
    if (!query.trim()) return

    setIsSearching(true)
    setError(null)
    setSearchResults([])
    setSelectedStock(null)

    try {
      const res = await fetch(`/api/stock/search?q=${encodeURIComponent(query.trim())}`)
      const data = await res.json()

      if (data.success) {
        setSearchResults(data.data)
        if (data.data.length === 0) {
          setError('검색 결과가 없습니다.')
        }
      } else {
        setError(data.error || '검색에 실패했습니다.')
      }
    } catch {
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setIsSearching(false)
    }
  }, [query])

  // 엔터키 검색
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  // 종목 선택 시 상세 정보 조회
  const handleSelectStock = async (stock: StockSearchResult) => {
    setIsLoadingInfo(true)
    setError(null)
    setSearchResults([]) // 검색 결과 숨기기

    try {
      const res = await fetch(`/api/stock/info?code=${stock.code}`)
      const data = await res.json()

      if (data.success && data.data) {
        setSelectedStock(data.data)
      } else {
        setError(data.error || '종목 정보를 불러오는데 실패했습니다.')
      }
    } catch {
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setIsLoadingInfo(false)
    }
  }

  // 검색 초기화
  const handleClear = () => {
    setQuery('')
    setSearchResults([])
    setSelectedStock(null)
    setError(null)
  }

  return (
    <div className="p-3 space-y-3">
      {/* 검색 입력 */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="종목명 또는 종목코드 검색..."
            className="w-full px-4 py-3 pr-10 rounded-lg border border-gray-300 dark:border-gray-600
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                       placeholder-gray-400 dark:placeholder-gray-500
                       focus:ring-2 focus:ring-green-500 focus:border-transparent
                       transition-colors"
          />
          {query && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1
                         text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
        </div>
        <button
          onClick={handleSearch}
          disabled={isSearching || !query.trim()}
          className="px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400
                     text-white rounded-lg transition-colors flex items-center gap-2
                     disabled:cursor-not-allowed"
        >
          {isSearching ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <MagnifyingGlassIcon className="w-5 h-5" />
          )}
          <span className="hidden sm:inline">검색</span>
        </button>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800
                        rounded-lg text-red-600 dark:text-red-400 text-sm text-center">
          {error}
        </div>
      )}

      {/* 검색 결과 목록 */}
      {searchResults.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700
                        divide-y divide-gray-200 dark:divide-gray-700 overflow-hidden">
          <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700/50 text-xs text-gray-500 dark:text-gray-400">
            검색 결과 ({searchResults.length}개)
          </div>
          {searchResults.map((stock) => (
            <button
              key={stock.code}
              onClick={() => handleSelectStock(stock)}
              className="w-full px-4 py-3 flex items-center justify-between
                         hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
            >
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {stock.name}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {stock.code}
                </div>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded ${
                  stock.market === 'KOSPI'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                }`}
              >
                {stock.market}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* 로딩 중 */}
      {isLoadingInfo && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 dark:border-green-400" />
        </div>
      )}

      {/* 선택된 종목 정보 */}
      {selectedStock && !isLoadingInfo && (
        <StockInfoCard stockInfo={selectedStock} />
      )}

      {/* 초기 안내 메시지 */}
      {!query && !selectedStock && !error && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <MagnifyingGlassIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">종목명 또는 종목코드를 검색하세요</p>
          <p className="text-xs mt-1">예: 삼성전자, 005930</p>
        </div>
      )}
    </div>
  )
}
