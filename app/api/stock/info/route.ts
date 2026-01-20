import { NextRequest, NextResponse } from 'next/server'
import {
  scrapeStockPrice,
  scrapeCompanyInfo,
  scrapeInvestmentIndicators,
  getStockMarket,
} from '@/lib/scraper/naver-stock'
import { scrapeFinancials, scrapeFnGuideIndicators } from '@/lib/scraper/fnguide'
import type { StockInfo } from '@/types/stock'

export const dynamic = 'force-dynamic'

// 캐시 (메모리)
const cache = new Map<string, { data: StockInfo; timestamp: number }>()
const CACHE_TTL = 60 * 1000 // 1분

/**
 * 종목 상세 정보 API
 * GET /api/stock/info?code={종목코드}
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code || code.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Stock code is required',
        },
        { status: 400 }
      )
    }

    const stockCode = code.trim()

    // 캐시 확인
    const cached = cache.get(stockCode)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({
        success: true,
        data: cached.data,
        cached: true,
      })
    }

    // 병렬로 데이터 수집
    const [priceData, companyInfo, naverIndicators, fnGuideIndicators, financials, market] =
      await Promise.all([
        scrapeStockPrice(stockCode),
        scrapeCompanyInfo(stockCode),
        scrapeInvestmentIndicators(stockCode),
        scrapeFnGuideIndicators(stockCode),
        scrapeFinancials(stockCode),
        getStockMarket(stockCode),
      ])

    // 데이터 병합
    const stockInfo: StockInfo = {
      code: stockCode,
      name: '', // 검색 결과에서 가져옴
      market,
      price: priceData || {
        current: '0',
        change: '0',
        changePercent: '0',
        changeType: 'unchanged',
        high: '0',
        low: '0',
        open: '0',
        volume: '0',
        prevClose: '0',
      },
      company: {
        industry: companyInfo?.industry || '-',
        ceo: companyInfo?.ceo || '-',
        establishedDate: companyInfo?.establishedDate || '-',
        fiscalMonth: companyInfo?.fiscalMonth || '-',
        employees: companyInfo?.employees || '-',
        marketCap: companyInfo?.marketCap || '-',
        headquarters: companyInfo?.headquarters || '-',
        website: companyInfo?.website || '-',
      },
      indicators: {
        per: fnGuideIndicators?.per || naverIndicators?.per || '-',
        pbr: fnGuideIndicators?.pbr || naverIndicators?.pbr || '-',
        eps: fnGuideIndicators?.eps || naverIndicators?.eps || '-',
        bps: fnGuideIndicators?.bps || naverIndicators?.bps || '-',
        roe: fnGuideIndicators?.roe || naverIndicators?.roe || '-',
        dividendYield: fnGuideIndicators?.dividendYield || naverIndicators?.dividendYield || '-',
      },
      financials: financials.length > 0 ? financials : [],
      lastUpdated: new Date().toLocaleString('ko-KR', {
        timeZone: 'Asia/Seoul',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
    }

    // 캐시 저장
    cache.set(stockCode, { data: stockInfo, timestamp: Date.now() })

    return NextResponse.json({
      success: true,
      data: stockInfo,
      cached: false,
    })
  } catch (error) {
    console.error('Stock info API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch stock info',
      },
      { status: 500 }
    )
  }
}
