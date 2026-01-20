import { NextResponse } from 'next/server'
import { searchStocks } from '@/lib/scraper/naver-stock'
import type { StockSearchResponse } from '@/types/stock'

export async function GET(request: Request): Promise<NextResponse<StockSearchResponse>> {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query || query.trim().length === 0) {
      return NextResponse.json({
        success: false,
        data: [],
        error: '검색어를 입력해주세요.',
      })
    }

    const results = await searchStocks(query.trim())

    return NextResponse.json({
      success: true,
      data: results,
    })
  } catch (error) {
    console.error('Stock search API error:', error)
    return NextResponse.json({
      success: false,
      data: [],
      error: '종목 검색에 실패했습니다.',
    })
  }
}
