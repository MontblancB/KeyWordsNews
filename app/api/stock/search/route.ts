import { NextRequest, NextResponse } from 'next/server'
import { searchStocks } from '@/lib/scraper/naver-stock'

export const dynamic = 'force-dynamic'

/**
 * 종목 검색 API
 * GET /api/stock/search?q={검색어}
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query || query.trim().length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
      })
    }

    const results = await searchStocks(query.trim())

    return NextResponse.json({
      success: true,
      data: results,
    })
  } catch (error) {
    console.error('Stock search API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to search stocks',
        data: [],
      },
      { status: 500 }
    )
  }
}
