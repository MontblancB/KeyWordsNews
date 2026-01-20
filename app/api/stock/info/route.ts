import { NextResponse } from 'next/server'
import { getStockInfo } from '@/lib/scraper/naver-stock'
import type { StockInfoResponse } from '@/types/stock'

export async function GET(request: Request): Promise<NextResponse<StockInfoResponse>> {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code || !/^\d{6}$/.test(code)) {
      return NextResponse.json({
        success: false,
        data: null,
        error: '올바른 종목코드를 입력해주세요.',
      })
    }

    const stockInfo = await getStockInfo(code)

    if (!stockInfo) {
      return NextResponse.json({
        success: false,
        data: null,
        error: '종목 정보를 찾을 수 없습니다.',
      })
    }

    return NextResponse.json({
      success: true,
      data: stockInfo,
    })
  } catch (error) {
    console.error('Stock info API error:', error)
    return NextResponse.json({
      success: false,
      data: null,
      error: '종목 정보를 불러오는데 실패했습니다.',
    })
  }
}
