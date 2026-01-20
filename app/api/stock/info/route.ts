import { NextRequest, NextResponse } from 'next/server'
import {
  scrapeStockPrice,
  scrapeCompanyInfo,
  scrapeInvestmentIndicators,
  getStockMarket,
} from '@/lib/scraper/naver-stock'
import { scrapeFinancials, scrapeFnGuideIndicators } from '@/lib/scraper/fnguide'
import type { StockInfo, StockBasicInfo, StockMetrics, StockFinancialData } from '@/types/stock'

export const dynamic = 'force-dynamic'

// 캐시 (메모리)
const cache = new Map<string, { data: StockInfo; timestamp: number }>()
const CACHE_TTL = 60 * 1000 // 1분

/**
 * 종목 상세 정보 API
 * GET /api/stock/info?code={종목코드}&name={종목명}
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const name = searchParams.get('name') || ''

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
    const [priceData, companyInfo, naverIndicators, fnGuideIndicators, fnGuideFinancials, market] =
      await Promise.all([
        scrapeStockPrice(stockCode),
        scrapeCompanyInfo(stockCode),
        scrapeInvestmentIndicators(stockCode),
        scrapeFnGuideIndicators(stockCode),
        scrapeFinancials(stockCode),
        getStockMarket(stockCode),
      ])

    // basic 정보 구성
    const basic: StockBasicInfo = {
      code: stockCode,
      name: name,
      market,
      sector: companyInfo?.industry || '-',
      currentPrice: priceData?.current || '0',
      change: priceData?.change || '0',
      changePercent: priceData?.changePercent ? `${priceData.changePercent}%` : '0%',
      changeType: priceData?.changeType || 'unchanged',
      marketCap: companyInfo?.marketCap || '-',
      volume: priceData?.volume || '0',
      high52week: '-', // 네이버 금융에서 별도 스크래핑 필요
      low52week: '-',
    }

    // metrics 정보 구성
    const metrics: StockMetrics = {
      per: fnGuideIndicators?.per || naverIndicators?.per || '-',
      pbr: fnGuideIndicators?.pbr || naverIndicators?.pbr || '-',
      roe: fnGuideIndicators?.roe || naverIndicators?.roe || '-',
      eps: fnGuideIndicators?.eps || naverIndicators?.eps || '-',
      bps: fnGuideIndicators?.bps || naverIndicators?.bps || '-',
      dividendYield: fnGuideIndicators?.dividendYield || naverIndicators?.dividendYield || '-',
    }

    // financials 정보 구성 (연간 데이터만 필터링)
    const financials: StockFinancialData[] = fnGuideFinancials
      .filter(f => f.periodType === 'annual')
      .slice(0, 4) // 최근 4년
      .map(f => ({
        year: f.period.replace(/[^\d]/g, '').slice(0, 4) || f.period, // 연도만 추출
        revenue: f.revenue,
        operatingProfit: f.operatingProfit,
        netIncome: f.netIncome,
        operatingMargin: f.operatingMargin,
      }))

    // 최종 StockInfo 구성
    const stockInfo: StockInfo = {
      basic,
      metrics,
      financials,
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
