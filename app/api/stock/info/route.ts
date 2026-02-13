import { NextRequest, NextResponse } from 'next/server'
import { scrapeKoreanStockPrice, scrapeUSStockPrice, scrapeUSCompanyInfo, scrapeUSInvestmentIndicators, scrapeUSFinancialData } from '@/lib/scraper/yahoo-stock'
import { scrapeCompanyInfo, scrapeInvestmentIndicators, scrapeFinancialData as scrapeNaverFinancials } from '@/lib/scraper/naver-stock'
import { getDartCompanyInfo, getDartFinancials } from '@/lib/api/dart'
import { scrapeFinancials as scrapeFnGuideFinancials, scrapeFnGuideIndicators, scrapeFnGuideCompanyInfo } from '@/lib/scraper/fnguide'
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
 * 발행주식수 파싱
 * "5,919,637,922주 / 75.17%" → 5919637922
 * "5,919,637,922주" → 5919637922
 */
function parseListedShares(sharesStr?: string): number {
  if (!sharesStr || sharesStr === '-') return 0
  // "5,919,637,922주 / 75.17%" 또는 "5,919,637,922주" 형식
  const match = sharesStr.match(/([\d,]+)\s*주/)
  if (match) {
    return parseFloat(match[1].replace(/,/g, ''))
  }
  // 숫자만 있는 경우
  const numMatch = sharesStr.match(/([\d,]+)/)
  if (numMatch) {
    return parseFloat(numMatch[1].replace(/,/g, ''))
  }
  return 0
}

/**
 * 투자지표 계산
 * 시세 + 재무제표 + 발행주식수로 계산
 */
function calculateIndicators(
  marketCap: number, // 시가총액 (원)
  currentPrice: number, // 현재가 (원)
  financials: any,
  listedSharesStr?: string, // 발행주식수 문자열
): Partial<InvestmentIndicators> {
  const actualShares = parseListedShares(listedSharesStr)
  const estimatedShares = currentPrice > 0 && marketCap > 0 ? marketCap / currentPrice : 0
  const shares = actualShares > 0 ? actualShares : estimatedShares

  log({
    level: 'INFO',
    source: 'calculateIndicators',
    message: '투자지표 계산 시작',
    data: { marketCap, currentPrice, actualShares, estimatedShares, sharesUsed: actualShares > 0 ? 'actual' : 'estimated' },
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

  // 가장 최근 연간 데이터 찾기 (FnGuide는 최신이 마지막)
  const sortedFinancials = [...financials].sort((a: any, b: any) => {
    const periodA = a.period || ''
    const periodB = b.period || ''
    return periodB.localeCompare(periodA)
  })
  const latest = sortedFinancials[0]

  // 숫자 파싱 헬퍼 (억원 단위 → 원 단위 변환)
  const parseAmount = (value: string): number => {
    if (!value || value === '-') return 0
    return parseFloat(value.replace(/,/g, ''))
  }

  const netIncome = parseAmount(latest.netIncome)
  const totalAssets = parseAmount(latest.totalAssets)
  const totalEquity = parseAmount(latest.totalEquity)

  // FnGuide 재무제표는 억원 단위 → 원 단위로 변환 필요
  // PER = 시가총액(원) / 당기순이익(억원 * 1억)
  const netIncomeWon = netIncome * 100000000

  // PER (주가수익비율) = 시가총액 / 당기순이익
  if (marketCap > 0 && netIncomeWon !== 0) {
    indicators.per = (marketCap / netIncomeWon).toFixed(2)
  }

  // PBR (주가순자산비율) = 시가총액 / 자본총계
  const totalEquityWon = totalEquity * 100000000
  if (marketCap > 0 && totalEquityWon > 0) {
    indicators.pbr = (marketCap / totalEquityWon).toFixed(2)
  }

  // EPS (주당순이익) = 당기순이익 / 발행주식수
  if (shares > 0 && netIncomeWon !== 0) {
    indicators.eps = Math.round(netIncomeWon / shares).toLocaleString('ko-KR')
  }

  // BPS (주당순자산) = 자본총계 / 발행주식수
  if (shares > 0 && totalEquityWon > 0) {
    indicators.bps = Math.round(totalEquityWon / shares).toLocaleString('ko-KR')
  }

  // ROE (자기자본이익률) = (당기순이익 / 자본총계) * 100
  if (netIncome !== 0 && totalEquity > 0) {
    indicators.roe = ((netIncome / totalEquity) * 100).toFixed(2) + '%'
  }

  // ROA (총자산이익률) = (당기순이익 / 자산총계) * 100
  if (netIncome !== 0 && totalAssets > 0) {
    indicators.roa = ((netIncome / totalAssets) * 100).toFixed(2) + '%'
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

      const [yahooPrice, naverCompanyInfo, naverIndicators, naverFinancials, dartCompanyInfo, dartFinancials, fnguideFinancials, fnguideIndicators, fnguideCompanyInfo, advancedIndicators, companyOverview] = await Promise.all([
        scrapeKoreanStockPrice(stockCode, market || 'KOSPI'),
        scrapeCompanyInfo(stockCode),
        scrapeInvestmentIndicators(stockCode),
        scrapeNaverFinancials(stockCode),
        getDartCompanyInfo(stockCode),
        getDartFinancials(stockCode),
        scrapeFnGuideFinancials(stockCode),
        scrapeFnGuideIndicators(stockCode),
        scrapeFnGuideCompanyInfo(stockCode),
        scrapeAdvancedIndicators(stockCode),
        scrapeCompanyOverview(stockCode),
      ])

      // 시가총액 파싱 (네이버 금융에서 가져옴)
      const parseMarketCap = (marketCapStr: string): number => {
        if (!marketCapStr || marketCapStr === '-') return 0
        let totalEok = 0

        // "1,068조4,946억원" 또는 "1,068조 4,946억원" 형식 처리
        const joMatch = marketCapStr.match(/([\d,]+)조/)
        if (joMatch) {
          totalEok += parseFloat(joMatch[1].replace(/,/g, '')) * 10000 // 1조 = 10000억
        }

        const eokMatch = marketCapStr.match(/([\d,]+)억/)
        if (eokMatch) {
          totalEok += parseFloat(eokMatch[1].replace(/,/g, ''))
        }

        return totalEok * 100000000 // 억원 -> 원
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
      // 발행주식수: FnGuide > 네이버 금융
      const listedSharesStr = fnguideCompanyInfo?.listedShares || naverCompanyInfo?.listedShares
      const calculatedIndicators = calculateIndicators(
        marketCap,
        currentPrice,
        financialsForCalculation,
        listedSharesStr
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
          // 업종: FnGuide > 네이버(검증됨) > DART
          industry: (() => {
            const isValidIndustry = (v?: string) => v && v !== '-' && !v.includes('동일업종') && !v.includes('PER')
            if (isValidIndustry(fnguideCompanyInfo?.industry)) return fnguideCompanyInfo!.industry!
            if (isValidIndustry(naverCompanyInfo?.industry)) return naverCompanyInfo!.industry!
            if (isValidIndustry(dartCompanyInfo?.industry)) return dartCompanyInfo!.industry!
            return '-'
          })(),
          // 기업정보: DART > 네이버 금융 (FnGuide SVD_Main은 기업정보 테이블이 없음)
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
          // 발행주식수: FnGuide(천주→주 변환) > 네이버
          listedShares: fnguideCompanyInfo?.listedShares || naverCompanyInfo?.listedShares || '-',
          foreignOwnership: naverCompanyInfo?.foreignOwnership || '-',
          capital: naverCompanyInfo?.capital || '-',
        },
        indicators: {
          // FnGuide > 네이버 고급지표 > 네이버 금융 > 계산값 순
          per: fnguideIndicators?.per || naverIndicators?.per || calculatedIndicators.per || '-',
          pbr: fnguideIndicators?.pbr || naverIndicators?.pbr || calculatedIndicators.pbr || '-',
          eps: fnguideIndicators?.eps || naverIndicators?.eps || calculatedIndicators.eps || '-',
          bps: fnguideIndicators?.bps || naverIndicators?.bps || calculatedIndicators.bps || '-',
          roe: fnguideIndicators?.roe || advancedIndicators.roe || naverIndicators?.roe || calculatedIndicators.roe || '-',
          roa: fnguideIndicators?.roa || advancedIndicators.roa || naverIndicators?.roa || calculatedIndicators.roa || '-',
          dividendYield: fnguideIndicators?.dividendYield || naverIndicators?.dividendYield || '-',
          week52High: fnguideIndicators?.week52High || naverIndicators?.week52High || '-',
          week52Low: fnguideIndicators?.week52Low || naverIndicators?.week52Low || '-',
          psr: fnguideIndicators?.psr || advancedIndicators.psr || naverIndicators?.psr || '-',
          dps: fnguideIndicators?.dps || naverIndicators?.dps || '-',
          currentRatio: fnguideIndicators?.currentRatio || advancedIndicators.currentRatio || naverIndicators?.currentRatio || '-',
          quickRatio: fnguideIndicators?.quickRatio || advancedIndicators.quickRatio || naverIndicators?.quickRatio || '-',
          beta: fnguideIndicators?.beta || advancedIndicators.beta || naverIndicators?.beta || '-',
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
