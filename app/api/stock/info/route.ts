import { NextRequest, NextResponse } from 'next/server'
import { scrapeKoreanStockPrice, scrapeUSStockPrice, scrapeUSCompanyInfo, scrapeUSInvestmentIndicators, scrapeUSFinancialData } from '@/lib/scraper/yahoo-stock'
import { scrapeCompanyInfo, scrapeInvestmentIndicators, scrapeFinancialData as scrapeNaverFinancials } from '@/lib/scraper/naver-stock'
import { getDartCompanyInfo, getDartFinancials } from '@/lib/api/dart'
import { scrapeFinancials as scrapeFnGuideFinancials } from '@/lib/scraper/fnguide'
import { fetchUSFinancialStatements } from '@/lib/api/finnhub'
import { scrapeAdvancedIndicators } from '@/lib/scraper/naver-investment-indicators'
import { scrapeCompanyOverview } from '@/lib/scraper/naver-company-overview'
import type { StockInfo, InvestmentIndicators } from '@/types/stock'

export const dynamic = 'force-dynamic'

// 캐시 (메모리)
const cache = new Map<string, { data: StockInfo; timestamp: number }>()
const CACHE_TTL = 60 * 1000 // 1분

interface LogEntry {
  timestamp: string
  level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS'
  source: string
  message: string
  data?: any
}

/**
 * 로깅 함수
 */
function log(entry: Omit<LogEntry, 'timestamp'>): void {
  const logEntry: LogEntry = {
    timestamp: new Date().toISOString(),
    ...entry,
  }

  const prefix = `[Stock Info API] [${logEntry.level}] [${logEntry.source}]`
  const message = `${prefix} ${logEntry.message}`

  if (logEntry.level === 'ERROR') {
    console.error(message, logEntry.data || '')
  } else if (logEntry.level === 'WARN') {
    console.warn(message, logEntry.data || '')
  } else {
    console.log(message, logEntry.data || '')
  }
}

/**
 * 국내/미국 주식 구분
 * - 국내: 6자리 숫자 (005930)
 * - 미국: 알파벳 심볼 (AAPL)
 */
function isKoreanStock(code: string): boolean {
  return /^\d{6}$/.test(code)
}

/**
 * 투자지표 계산
 * Yahoo Finance 시세 + DART 재무제표로 계산
 */
function calculateIndicators(
  marketCap: number, // 시가총액 (원)
  currentPrice: number, // 현재가 (원)
  financials: any
): Partial<InvestmentIndicators> {
  log({
    level: 'INFO',
    source: 'calculateIndicators',
    message: '투자지표 계산 시작',
    data: { marketCap, currentPrice },
  })

  const indicators: Partial<InvestmentIndicators> = {}

  if (!financials || financials.length === 0) {
    log({
      level: 'WARN',
      source: 'calculateIndicators',
      message: '재무제표 데이터 없음 - 투자지표 계산 불가',
    })
    return indicators
  }

  const latest = financials[0]

  // 숫자 파싱 헬퍼
  const parseAmount = (value: string): number => {
    if (!value || value === '-') return 0
    return parseFloat(value.replace(/,/g, ''))
  }

  const revenue = parseAmount(latest.revenue)
  const netIncome = parseAmount(latest.netIncome)
  const totalAssets = parseAmount(latest.totalAssets)
  const totalEquity = parseAmount(latest.totalEquity)

  // PER (주가수익비율) = 시가총액 / 당기순이익
  if (marketCap > 0 && netIncome > 0) {
    indicators.per = (marketCap / netIncome).toFixed(2)
    log({
      level: 'SUCCESS',
      source: 'calculateIndicators',
      message: `PER 계산 성공: ${indicators.per}`,
    })
  }

  // PBR (주가순자산비율) = 시가총액 / 자본총계
  if (marketCap > 0 && totalEquity > 0) {
    indicators.pbr = (marketCap / totalEquity).toFixed(2)
    log({
      level: 'SUCCESS',
      source: 'calculateIndicators',
      message: `PBR 계산 성공: ${indicators.pbr}`,
    })
  }

  // EPS (주당순이익) = 당기순이익 / 발행주식수
  // 주의: 발행주식수가 필요하므로 간단히 시가총액/현재가로 추정
  if (currentPrice > 0 && netIncome > 0 && marketCap > 0) {
    const shares = marketCap / currentPrice
    indicators.eps = (netIncome / shares).toFixed(0)
    log({
      level: 'SUCCESS',
      source: 'calculateIndicators',
      message: `EPS 계산 성공: ${indicators.eps}`,
    })
  }

  // BPS (주당순자산) = 자본총계 / 발행주식수
  if (currentPrice > 0 && totalEquity > 0 && marketCap > 0) {
    const shares = marketCap / currentPrice
    indicators.bps = (totalEquity / shares).toFixed(0)
    log({
      level: 'SUCCESS',
      source: 'calculateIndicators',
      message: `BPS 계산 성공: ${indicators.bps}`,
    })
  }

  // ROE (자기자본이익률) = (당기순이익 / 자본총계) * 100
  if (netIncome > 0 && totalEquity > 0) {
    indicators.roe = ((netIncome / totalEquity) * 100).toFixed(2) + '%'
    log({
      level: 'SUCCESS',
      source: 'calculateIndicators',
      message: `ROE 계산 성공: ${indicators.roe}`,
    })
  }

  // ROA (총자산이익률) = (당기순이익 / 자산총계) * 100
  if (netIncome > 0 && totalAssets > 0) {
    indicators.roa = ((netIncome / totalAssets) * 100).toFixed(2) + '%'
    log({
      level: 'SUCCESS',
      source: 'calculateIndicators',
      message: `ROA 계산 성공: ${indicators.roa}`,
    })
  }

  const calculatedCount = Object.keys(indicators).length
  log({
    level: calculatedCount > 0 ? 'SUCCESS' : 'WARN',
    source: 'calculateIndicators',
    message: `투자지표 계산 완료: ${calculatedCount}개`,
    data: indicators,
  })

  return indicators
}

/**
 * 종목 상세 정보 API
 * GET /api/stock/info?code={종목코드}&market={시장구분}&name={종목명}
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const market = searchParams.get('market')
    const name = searchParams.get('name')

    log({
      level: 'INFO',
      source: 'GET',
      message: '주식 정보 조회 시작',
      data: { code, market, name },
    })

    if (!code || code.trim().length === 0) {
      log({
        level: 'ERROR',
        source: 'GET',
        message: '종목코드 누락',
      })
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
      log({
        level: 'INFO',
        source: 'GET',
        message: '캐시된 데이터 반환',
        data: { code: stockCode, age: `${Math.round((Date.now() - cached.timestamp) / 1000)}초` },
      })
      return NextResponse.json({
        success: true,
        data: cached.data,
        cached: true,
      })
    }

    // 국내/미국 주식 구분
    const isKorean = isKoreanStock(stockCode)
    log({
      level: 'INFO',
      source: 'GET',
      message: isKorean ? '한국 주식으로 감지' : '미국 주식으로 감지',
      data: { code: stockCode },
    })

    let stockInfo: StockInfo

    if (isKorean) {
      // ========================================
      // 한국 주식: Yahoo Finance (시세) + DART (기업정보/재무)
      // ========================================
      log({
        level: 'INFO',
        source: 'GET',
        message: '한국 주식 데이터 수집 시작 (Yahoo + DART)',
      })

      const [yahooPrice, naverCompanyInfo, naverIndicators, naverFinancials, dartCompanyInfo, dartFinancials, fnguideFinancials, advancedIndicators, companyOverview] = await Promise.all([
        scrapeKoreanStockPrice(stockCode, market || 'KOSPI'),
        scrapeCompanyInfo(stockCode),
        scrapeInvestmentIndicators(stockCode),
        scrapeNaverFinancials(stockCode),
        getDartCompanyInfo(stockCode),
        getDartFinancials(stockCode),
        scrapeFnGuideFinancials(stockCode),
        scrapeAdvancedIndicators(stockCode),
        scrapeCompanyOverview(stockCode),
      ])

      // 시가총액 파싱 (네이버 금융에서 가져옴)
      const parseMarketCap = (marketCapStr: string): number => {
        if (!marketCapStr || marketCapStr === '-') return 0
        // "123,456억원" 형식을 숫자로 변환 (억원 단위 -> 원 단위)
        const match = marketCapStr.match(/([\d,]+)억원/)
        if (match) {
          const value = parseFloat(match[1].replace(/,/g, ''))
          return value * 100000000 // 억원 -> 원
        }
        return 0
      }

      const marketCap = naverCompanyInfo ? parseMarketCap(naverCompanyInfo.marketCap) : 0

      // 현재가 파싱
      const currentPrice = yahooPrice
        ? parseFloat(yahooPrice.current.replace(/,/g, ''))
        : 0

      // 투자지표 계산 (재무 데이터 기반 - FnGuide > DART > 네이버)
      const financialsForCalculation = fnguideFinancials.length > 0
        ? fnguideFinancials
        : (dartFinancials.length > 0 ? dartFinancials : naverFinancials)
      const calculatedIndicators = calculateIndicators(
        marketCap,
        currentPrice,
        financialsForCalculation
      )

      stockInfo = {
        code: stockCode,
        name: name || '',
        market: (market as any) || 'KOSPI',
        price: yahooPrice || {
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
          // 네이버 금융 우선, DART 보완, 기업개요 보완
          industry: naverCompanyInfo?.industry || dartCompanyInfo?.industry || '-',
          ceo: dartCompanyInfo?.ceo || naverCompanyInfo?.ceo || '-',
          establishedDate: dartCompanyInfo?.establishedDate || naverCompanyInfo?.establishedDate || '-',
          fiscalMonth: dartCompanyInfo?.fiscalMonth || naverCompanyInfo?.fiscalMonth || '-',
          employees: companyOverview.employees || naverCompanyInfo?.employees || '-',
          marketCap: naverCompanyInfo?.marketCap || (marketCap > 0 ? marketCap.toLocaleString() + '원' : '-'),
          headquarters: dartCompanyInfo?.headquarters || naverCompanyInfo?.headquarters || '-',
          website: dartCompanyInfo?.website || naverCompanyInfo?.website || '-',
          businessDescription: companyOverview.businessDescription || naverCompanyInfo?.businessDescription || '-',
          mainProducts: companyOverview.mainProducts || naverCompanyInfo?.mainProducts || '-',
          faceValue: naverCompanyInfo?.faceValue || '-',
          listedDate: naverCompanyInfo?.listedDate || '-',
          listedShares: naverCompanyInfo?.listedShares || '-',
          foreignOwnership: naverCompanyInfo?.foreignOwnership || '-',
          capital: naverCompanyInfo?.capital || '-',
        },
        indicators: {
          // 고급 지표 > 네이버 금융 > DART 계산 순
          per: naverIndicators?.per || calculatedIndicators.per || '-',
          pbr: naverIndicators?.pbr || calculatedIndicators.pbr || '-',
          eps: naverIndicators?.eps || calculatedIndicators.eps || '-',
          bps: naverIndicators?.bps || calculatedIndicators.bps || '-',
          roe: advancedIndicators.roe || naverIndicators?.roe || calculatedIndicators.roe || '-',
          roa: advancedIndicators.roa || naverIndicators?.roa || calculatedIndicators.roa || '-',
          dividendYield: naverIndicators?.dividendYield || '-',
          week52High: naverIndicators?.week52High || '-',
          week52Low: naverIndicators?.week52Low || '-',
          psr: advancedIndicators.psr || naverIndicators?.psr || '-',
          dps: naverIndicators?.dps || '-',
          currentRatio: advancedIndicators.currentRatio || naverIndicators?.currentRatio || '-',
          quickRatio: advancedIndicators.quickRatio || naverIndicators?.quickRatio || '-',
          beta: advancedIndicators.beta || naverIndicators?.beta || '-',
        },
        financials: fnguideFinancials.length > 0
          ? fnguideFinancials
          : (dartFinancials.length > 0 ? dartFinancials : naverFinancials),
        lastUpdated: new Date().toLocaleString('ko-KR', {
          timeZone: 'Asia/Seoul',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        }),
      }

      // 데이터 수집률 계산 및 로깅
      const totalFields = Object.keys(stockInfo.company).length +
        Object.keys(stockInfo.indicators).length +
        Object.keys(stockInfo.price).length

      const collectedFields = Object.values(stockInfo.company).filter(v => v !== '-').length +
        Object.values(stockInfo.indicators).filter(v => v !== '-').length +
        Object.values(stockInfo.price).filter(v => v !== '0' && v !== '-').length

      const collectionRate = totalFields > 0 ? ((collectedFields / totalFields) * 100).toFixed(1) : '0'

      log({
        level: 'SUCCESS',
        source: 'GET',
        message: `한국 주식 데이터 수집 완료 (${collectionRate}%)`,
        data: {
          code: stockCode,
          totalFields,
          collectedFields,
          duration: `${Date.now() - startTime}ms`,
        },
      })
    } else {
      // ========================================
      // 미국 주식: Yahoo Finance (시세/기업정보) + Finnhub (재무제표)
      // ========================================
      log({
        level: 'INFO',
        source: 'GET',
        message: '미국 주식 데이터 수집 시작 (Yahoo Finance + Finnhub)',
      })

      const [priceData, companyInfo, indicators, financials] = await Promise.all([
        scrapeUSStockPrice(stockCode),
        scrapeUSCompanyInfo(stockCode),
        scrapeUSInvestmentIndicators(stockCode),
        fetchUSFinancialStatements(stockCode), // Finnhub API로 변경
      ])

      stockInfo = {
        code: stockCode,
        name: name || '',
        market: (market as any) || 'US',
        symbol: stockCode,
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

      log({
        level: 'SUCCESS',
        source: 'GET',
        message: '미국 주식 데이터 수집 완료',
        data: {
          code: stockCode,
          duration: `${Date.now() - startTime}ms`,
        },
      })
    }

    // 캐시 저장
    cache.set(stockCode, { data: stockInfo, timestamp: Date.now() })

    return NextResponse.json({
      success: true,
      data: stockInfo,
      cached: false,
    })
  } catch (error) {
    log({
      level: 'ERROR',
      source: 'GET',
      message: `예외 발생: ${error instanceof Error ? error.message : String(error)}`,
      data: error,
    })
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
