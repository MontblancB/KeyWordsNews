import { NextRequest, NextResponse } from 'next/server'
import {
  scrapeStockPrice,
  scrapeCompanyInfo,
  scrapeInvestmentIndicators,
  getStockMarket,
} from '@/lib/scraper/naver-stock'
import {
  scrapeUSStockPrice,
  scrapeUSCompanyInfo,
  scrapeUSInvestmentIndicators,
  scrapeUSFinancialData,
} from '@/lib/scraper/yahoo-stock'
import { scrapeFinancials, scrapeFnGuideIndicators, scrapeFnGuideCompanyInfo } from '@/lib/scraper/fnguide'
import type { StockInfo } from '@/types/stock'

export const dynamic = 'force-dynamic'

// 캐시 (메모리)
const cache = new Map<string, { data: StockInfo; timestamp: number }>()
const CACHE_TTL = 60 * 1000 // 1분

/**
 * 국내/미국 주식 구분
 * - 국내: 6자리 숫자 (005930)
 * - 미국: 알파벳 심볼 (AAPL)
 */
function isKoreanStock(code: string): boolean {
  return /^\d{6}$/.test(code)
}

/**
 * 종목 상세 정보 API
 * GET /api/stock/info?code={종목코드}&market={시장구분}&symbol={전체심볼}
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const market = searchParams.get('market')
    const symbol = searchParams.get('symbol')

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

    // 국내/미국 주식 구분
    const isKorean = isKoreanStock(stockCode)

    let stockInfo: StockInfo

    if (isKorean) {
      // 국내 주식 - 네이버 금융 + FnGuide 스크래핑
      const [priceData, naverCompanyInfo, fnGuideCompanyInfo, naverIndicators, fnGuideIndicators, financials, stockMarket] =
        await Promise.all([
          scrapeStockPrice(stockCode),
          scrapeCompanyInfo(stockCode),
          scrapeFnGuideCompanyInfo(stockCode),
          scrapeInvestmentIndicators(stockCode),
          scrapeFnGuideIndicators(stockCode),
          scrapeFinancials(stockCode),
          getStockMarket(stockCode),
        ])

      stockInfo = {
        code: stockCode,
        name: '', // 검색 결과에서 가져옴
        market: stockMarket,
        symbol: symbol || undefined,
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
          industry: fnGuideCompanyInfo?.industry || naverCompanyInfo?.industry || '-',
          ceo: fnGuideCompanyInfo?.ceo || naverCompanyInfo?.ceo || '-',
          establishedDate: fnGuideCompanyInfo?.establishedDate || naverCompanyInfo?.establishedDate || '-',
          fiscalMonth: fnGuideCompanyInfo?.fiscalMonth || naverCompanyInfo?.fiscalMonth || '-',
          employees: fnGuideCompanyInfo?.employees || naverCompanyInfo?.employees || '-',
          marketCap: naverCompanyInfo?.marketCap || '-',
          headquarters: naverCompanyInfo?.headquarters || '-',
          website: fnGuideCompanyInfo?.website || naverCompanyInfo?.website || '-',
          businessDescription: fnGuideCompanyInfo?.businessDescription || naverCompanyInfo?.businessDescription || '-',
          mainProducts: fnGuideCompanyInfo?.mainProducts || naverCompanyInfo?.mainProducts || '-',
          faceValue: fnGuideCompanyInfo?.faceValue || naverCompanyInfo?.faceValue || '-',
          listedDate: fnGuideCompanyInfo?.listedDate || naverCompanyInfo?.listedDate || '-',
          listedShares: fnGuideCompanyInfo?.listedShares || naverCompanyInfo?.listedShares || '-',
          foreignOwnership: fnGuideCompanyInfo?.foreignOwnership || naverCompanyInfo?.foreignOwnership || '-',
          capital: fnGuideCompanyInfo?.capital || naverCompanyInfo?.capital || '-',
        },
        indicators: {
          per: fnGuideIndicators?.per || naverIndicators?.per || '-',
          pbr: fnGuideIndicators?.pbr || naverIndicators?.pbr || '-',
          eps: fnGuideIndicators?.eps || naverIndicators?.eps || '-',
          bps: fnGuideIndicators?.bps || naverIndicators?.bps || '-',
          roe: fnGuideIndicators?.roe || naverIndicators?.roe || '-',
          roa: fnGuideIndicators?.roa || naverIndicators?.roa || '-',
          dividendYield: fnGuideIndicators?.dividendYield || naverIndicators?.dividendYield || '-',
          week52High: fnGuideIndicators?.week52High || naverIndicators?.week52High || '-',
          week52Low: fnGuideIndicators?.week52Low || naverIndicators?.week52Low || '-',
          psr: fnGuideIndicators?.psr || naverIndicators?.psr || '-',
          dps: fnGuideIndicators?.dps || naverIndicators?.dps || '-',
          currentRatio: fnGuideIndicators?.currentRatio || naverIndicators?.currentRatio || '-',
          quickRatio: fnGuideIndicators?.quickRatio || naverIndicators?.quickRatio || '-',
          beta: fnGuideIndicators?.beta || naverIndicators?.beta || '-',
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
    } else {
      // 미국 주식 - Yahoo Finance API
      const [priceData, companyInfo, indicators, financials] = await Promise.all([
        scrapeUSStockPrice(stockCode),
        scrapeUSCompanyInfo(stockCode),
        scrapeUSInvestmentIndicators(stockCode),
        scrapeUSFinancialData(stockCode),
      ])

      stockInfo = {
        code: stockCode,
        name: '', // 검색 결과에서 가져옴
        market: (market as any) || 'US',
        symbol: symbol || stockCode,
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
        company: companyInfo || {
          industry: '-',
          ceo: '-',
          establishedDate: '-',
          fiscalMonth: '-',
          employees: '-',
          marketCap: '-',
          headquarters: '-',
          website: '-',
          businessDescription: '-',
          mainProducts: '-',
          faceValue: '-',
          listedDate: '-',
          listedShares: '-',
          foreignOwnership: '-',
          capital: '-',
        },
        indicators: indicators || {
          per: '-',
          pbr: '-',
          eps: '-',
          bps: '-',
          roe: '-',
          roa: '-',
          dividendYield: '-',
          week52High: '-',
          week52Low: '-',
          psr: '-',
          dps: '-',
          currentRatio: '-',
          quickRatio: '-',
          beta: '-',
        },
        financials: financials.length > 0 ? financials : [],
        lastUpdated: new Date().toLocaleString('en-US', {
          timeZone: 'America/New_York',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        }),
      }
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
