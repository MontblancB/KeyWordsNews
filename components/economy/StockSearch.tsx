'use client'

import { useState, useRef, useEffect } from 'react'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useStockSearch } from '@/hooks/useStock'
import type { StockSearchItem } from '@/types/stock'

interface StockSearchProps {
  onSelect: (stock: StockSearchItem) => void
}

export default function StockSearch({ onSelect }: StockSearchProps) {
  const [query, setQuery] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // 검색 결과 (버튼 클릭 시에만 검색)
  const { data: results = [], isLoading, refetch } = useStockSearch(searchQuery)

  // 검색 실행
  const handleSearch = () => {
    if (query.trim().length >= 1) {
      setSearchQuery(query.trim())
      setIsOpen(true)
    }
  }

  // Enter 키로 검색
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  // 검색 결과가 있으면 드롭다운 열기
  useEffect(() => {
    if (searchQuery && results.length > 0) {
      setIsOpen(true)
    }
  }, [searchQuery, results])

  // 외부 클릭 시 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 종목 선택
  const handleSelect = (stock: StockSearchItem) => {
    onSelect(stock)
    setQuery('')
    setSearchQuery('')
    setIsOpen(false)
  }

  // 입력 초기화
  const handleClear = () => {
    setQuery('')
    setSearchQuery('')
    setIsOpen(false)
    inputRef.current?.focus()
  }

  // 시장 배지 색상
  const getMarketBadgeClass = (market: string) => {
    switch (market) {
      case 'KOSPI':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      case 'KOSDAQ':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
    }
  }

  return (
    <div ref={containerRef} className="relative">
      {/* 검색 입력 */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (results.length > 0 && searchQuery) setIsOpen(true)
            }}
            placeholder="종목명 또는 종목코드 검색"
            className="w-full px-4 py-3 pl-10 pr-10 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400"
          />
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

          {/* 삭제 버튼 */}
          {query && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <XMarkIcon className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>

        {/* 검색 버튼 */}
        <button
          onClick={handleSearch}
          disabled={isLoading || query.trim().length < 1}
          className="px-4 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <MagnifyingGlassIcon className="w-5 h-5" />
          )}
          <span className="hidden sm:inline">검색</span>
        </button>
      </div>

      {/* 자동완성 드롭다운 */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {results.map((stock) => (
            <button
              key={stock.code}
              onClick={() => handleSelect(stock)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0"
            >
              <div className="flex items-center gap-3">
                <div className="text-left">
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {stock.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {stock.code}
                  </div>
                </div>
              </div>
              <span
                className={`px-2 py-0.5 text-xs font-medium rounded ${getMarketBadgeClass(stock.market)}`}
              >
                {stock.market}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* 검색 결과 없음 */}
      {isOpen && query.length >= 1 && !isLoading && results.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
          검색 결과가 없습니다
        </div>
      )}
    </div>
  )
}
