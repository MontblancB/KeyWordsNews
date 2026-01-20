import * as cheerio from 'cheerio'
import type {
  StockSearchItem,
  StockPrice,
  CompanyInfo,
  InvestmentIndicators,
} from '@/types/stock'
import type { ChangeType } from '@/types/economy'

/**
 * 주식 스크래퍼 (Yahoo Finance + 네이버 금융)
 */

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

// 인기 종목 캐시 (Yahoo Finance 검색 실패 시 폴백)
const POPULAR_STOCKS: StockSearchItem[] = [
  { code: '005930', name: '삼성전자', market: 'KOSPI' },
  { code: '000660', name: 'SK하이닉스', market: 'KOSPI' },
  { code: '035420', name: 'NAVER', market: 'KOSPI' },
  { code: '035720', name: '카카오', market: 'KOSPI' },
  { code: '005380', name: '현대차', market: 'KOSPI' },
  { code: '051910', name: 'LG화학', market: 'KOSPI' },
  { code: '006400', name: '삼성SDI', market: 'KOSPI' },
  { code: '003670', name: '포스코퓨처엠', market: 'KOSPI' },
  { code: '105560', name: 'KB금융', market: 'KOSPI' },
  { code: '055550', name: '신한지주', market: 'KOSPI' },
  { code: '000270', name: '기아', market: 'KOSPI' },
  { code: '012330', name: '현대모비스', market: 'KOSPI' },
  { code: '066570', name: 'LG전자', market: 'KOSPI' },
  { code: '003550', name: 'LG', market: 'KOSPI' },
  { code: '034730', name: 'SK', market: 'KOSPI' },
  { code: '028260', name: '삼성물산', market: 'KOSPI' },
  { code: '207940', name: '삼성바이오로직스', market: 'KOSPI' },
  { code: '068270', name: '셀트리온', market: 'KOSPI' },
  { code: '005490', name: 'POSCO홀딩스', market: 'KOSPI' },
  { code: '017670', name: 'SK텔레콤', market: 'KOSPI' },
  { code: '030200', name: 'KT', market: 'KOSPI' },
  { code: '018260', name: '삼성에스디에스', market: 'KOSPI' },
  { code: '032830', name: '삼성생명', market: 'KOSPI' },
  { code: '086790', name: '하나금융지주', market: 'KOSPI' },
  { code: '009150', name: '삼성전기', market: 'KOSPI' },
  { code: '247540', name: '에코프로비엠', market: 'KOSDAQ' },
  { code: '086520', name: '에코프로', market: 'KOSDAQ' },
  { code: '293490', name: '카카오게임즈', market: 'KOSDAQ' },
  { code: '263750', name: '펄어비스', market: 'KOSDAQ' },
  { code: '041510', name: '에스엠', market: 'KOSDAQ' },
  { code: '352820', name: '하이브', market: 'KOSPI' },
  { code: '259960', name: '크래프톤', market: 'KOSPI' },
  { code: '003490', name: '대한항공', market: 'KOSPI' },
  { code: '180640', name: '한진칼', market: 'KOSPI' },
  { code: '010130', name: '고려아연', market: 'KOSPI' },
]

/**
 * 종목 검색 (3단계 폴백 전략)
 * 1차: Yahoo Finance 검색 API
 * 2차: 인기 종목 캐시에서 검색
 * 3차: 종목코드 직접 조회
 */
export async function searchStocks(query: string): Promise<StockSearchItem[]> {
  if (!query || query.trim().length === 0) {
    return []
  }

  const trimmedQuery = query.trim()

  try {
    // 1차: Yahoo Finance 검색 API
    const yahooResults = await searchStocksFromYahoo(trimmedQuery)
    if (yahooResults.length > 0) {
      return yahooResults
    }

    // 2차: 인기 종목 캐시에서 검색
    const lowerQuery = trimmedQuery.toLowerCase()
    const matchedStocks = POPULAR_STOCKS.filter(
      (stock) =>
        stock.name.toLowerCase().includes(lowerQuery) ||
        stock.code.includes(trimmedQuery)
    )

    if (matchedStocks.length > 0) {
      return matchedStocks.slice(0, 10)
    }

    // 3차: 종목코드인 경우 직접 조회
    if (/^\d{6}$/.test(trimmedQuery)) {
      const directResult = await searchStockByCode(trimmedQuery)
      if (directResult) {
        return [directResult]
      }
    }

    console.log('No matching stocks found for:', trimmedQuery)
    return []
  } catch (error) {
    console.error('Stock search error:', error)
    return []
  }
}

/**
 * Yahoo Finance 검색 API
 * - 한글 종목명 검색 지원
 * - 한국 주식은 .KS (KOSPI) 또는 .KQ (KOSDAQ) 형식
 */
async function searchStocksFromYahoo(query: string): Promise<StockSearchItem[]> {
  try {
    // Yahoo Finance autoc API (더 안정적)
    const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&lang=ko-KR&region=KR&quotesCount=20&newsCount=0&listsCount=0`

    console.log('Searching Yahoo Finance:', query)

    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
        'Accept-Language': 'ko-KR,ko;q=0.9',
        Origin: 'https://finance.yahoo.com',
        Referer: 'https://finance.yahoo.com/',
      },
    })

    if (!response.ok) {
      console.log('Yahoo Finance search failed:', response.status)
      return []
    }

    const data = await response.json()
    const quotes = data?.quotes || []

    if (!Array.isArray(quotes) || quotes.length === 0) {
      return []
    }

    // 한국 주식만 필터링 (.KS = KOSPI, .KQ = KOSDAQ)
    const koreanStocks = quotes
      .filter((quote: { symbol?: string; exchange?: string }) => {
        const symbol = quote.symbol || ''
        return symbol.endsWith('.KS') || symbol.endsWith('.KQ')
      })
      .map(
        (quote: {
          symbol?: string
          shortname?: string
          longname?: string
          exchange?: string
        }) => {
          const symbol = quote.symbol || ''
          const code = symbol.replace('.KS', '').replace('.KQ', '')
          const name = quote.shortname || quote.longname || ''
          const market: 'KOSPI' | 'KOSDAQ' | 'KONEX' = symbol.endsWith('.KQ')
            ? 'KOSDAQ'
            : 'KOSPI'

          return { code, name, market }
        }
      )
      .filter((stock: StockSearchItem) => stock.code && stock.name)

    console.log('Yahoo Finance results:', koreanStocks.length)
    return koreanStocks.slice(0, 10)
  } catch (error) {
    console.error('searchStocksFromYahoo error:', error)
    return []
  }
}

/**
 * 종목코드로 직접 종목 정보 조회 (네이버 금융)
 */
async function searchStockByCode(code: string): Promise<StockSearchItem | null> {
  try {
    const url = `https://finance.naver.com/item/main.naver?code=${code}`
    console.log('Fetching stock info from:', url)

    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9',
      },
    })

    if (!response.ok) {
      console.log('Stock page request failed:', response.status)
      return null
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    // 종목명 추출
    const name = $('.wrap_company h2 a').text().trim() || $('title').text().split(':')[0].trim()

    if (!name || name.includes('없는') || name.includes('error') || name.length < 2) {
      return null
    }

    // 시장 구분
    const marketText = $('.code').text().toLowerCase()
    let market: 'KOSPI' | 'KOSDAQ' | 'KONEX' = 'KOSPI'
    if (marketText.includes('kosdaq')) {
      market = 'KOSDAQ'
    } else if (marketText.includes('konex')) {
      market = 'KONEX'
    }

    console.log('Found stock:', { code, name, market })
    return { code, name, market }
  } catch (error) {
    console.error('searchStockByCode error:', error)
    return null
  }
}

/**
 * 변동 타입 판단
 */
function getChangeType(className: string | undefined): ChangeType {
  if (!className) return 'unchanged'
  if (className.includes('up') || className.includes('ris') || className.includes('red')) {
    return 'up'
  }
  if (className.includes('down') || className.includes('fal') || className.includes('blu')) {
    return 'down'
  }
  return 'unchanged'
}

/**
 * 숫자 정리 (쉼표 제거)
 */
function cleanNumber(text: string): string {
  return text.replace(/,/g, '').trim()
}

/**
 * 주식 시세 스크래핑 (네이버 금융 종목 페이지)
 */
export async function scrapeStockPrice(code: string): Promise<StockPrice | null> {
  try {
    const url = `https://finance.naver.com/item/main.naver?code=${code}`
    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch stock price: ${response.statusText}`)
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    // 현재가
    const currentPrice = $('.no_today .blind').first().text().trim()

    // 전일 대비 변동
    const changeElement = $('.no_exday')
    const changeValue = changeElement.find('.blind').first().text().trim()

    // 변동 타입 (상승/하락)
    const changeClass = changeElement.find('em').attr('class') || ''
    const changeType = getChangeType(changeClass)

    // 변동률
    const changePercent = changeElement
      .find('.blind')
      .eq(1)
      .text()
      .trim()
      .replace('%', '')

    // 시가, 고가, 저가, 거래량, 전일 종가
    const tableRows = $('.tab_con1 table tr')
    let high = ''
    let low = ''
    let open = ''
    let volume = ''
    let prevClose = ''

    tableRows.each((_, row) => {
      const th = $(row).find('th').text().trim()
      const td = $(row).find('td .blind').text().trim()

      if (th.includes('전일')) prevClose = td
      if (th.includes('시가')) open = td
      if (th.includes('고가')) high = td
      if (th.includes('저가')) low = td
      if (th.includes('거래량')) volume = td
    })

    // 부호 추가
    const sign = changeType === 'up' ? '+' : changeType === 'down' ? '-' : ''

    return {
      current: currentPrice || '0',
      change: sign + cleanNumber(changeValue),
      changePercent: sign + changePercent,
      changeType,
      high: high || '0',
      low: low || '0',
      open: open || '0',
      volume: volume || '0',
      prevClose: prevClose || '0',
    }
  } catch (error) {
    console.error('Stock price scraping error:', error)
    return null
  }
}

/**
 * 기업 정보 스크래핑 (네이버 금융 기업개요)
 */
export async function scrapeCompanyInfo(code: string): Promise<CompanyInfo | null> {
  try {
    // 기업 정보 테이블에서 추출
    const companyInfo: CompanyInfo = {
      industry: '',
      ceo: '',
      establishedDate: '',
      fiscalMonth: '',
      employees: '',
      marketCap: '',
      headquarters: '',
      website: '',
      // 추가 정보
      faceValue: '-',
      listedDate: '-',
      listedShares: '-',
      foreignOwnership: '-',
      capital: '-',
    }

    // 종목 메인 페이지에서 시가총액, 업종 가져오기
    const mainUrl = `https://finance.naver.com/item/main.naver?code=${code}`
    const mainResponse = await fetch(mainUrl, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9',
      },
    })

    if (mainResponse.ok) {
      const mainHtml = await mainResponse.text()
      const $main = cheerio.load(mainHtml)

      // 시가총액 - 여러 셀렉터 시도
      const marketCapSelectors = [
        '#_market_sum',
        '.tab_con1 table td:contains("시가총액") + td',
        '.first td em',
        '.aside_invest_info td:first-child',
      ]
      for (const selector of marketCapSelectors) {
        const text = $main(selector).first().text().trim()
        if (text && text !== '-' && /[\d,]+/.test(text)) {
          companyInfo.marketCap = text.replace(/\s+/g, '') + '억원'
          break
        }
      }

      // 업종 - 여러 셀렉터 시도
      const industrySelectors = [
        '.sub_section .trade_compare a',
        'table.tb_type1_f td a',
        '.tab_con1 a[href*="upjong"]',
      ]
      for (const selector of industrySelectors) {
        const text = $main(selector).first().text().trim()
        if (text && text.length > 1) {
          companyInfo.industry = text
          break
        }
      }
    }

    // 기업개요 페이지에서 상세 정보
    const corpUrl = `https://navercomp.wisereport.co.kr/v2/company/c1010001.aspx?cmp_cd=${code}`
    const corpResponse = await fetch(corpUrl, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9',
      },
    })

    if (corpResponse.ok) {
      const corpHtml = await corpResponse.text()
      const $corp = cheerio.load(corpHtml)

      // 기업 개요 테이블 파싱
      $corp('table tr, .cmp-table tr, .tb_type1 tr').each((_, row) => {
        const th = $corp(row).find('th, .cmp-dt').text().trim()
        const td = $corp(row).find('td, .cmp-dd').first().text().trim()

        if (!td || td === '-') return

        if (th.includes('대표자') || th.includes('CEO')) {
          companyInfo.ceo = companyInfo.ceo || td.split('\n')[0].trim()
        }
        if (th.includes('설립일') || th.includes('설립')) {
          companyInfo.establishedDate = companyInfo.establishedDate || td
        }
        if (th.includes('결산월') || th.includes('결산')) {
          companyInfo.fiscalMonth = companyInfo.fiscalMonth || td
        }
        if (th.includes('직원') || th.includes('종업원')) {
          companyInfo.employees = companyInfo.employees || td
        }
        if (th.includes('주소') || th.includes('본사')) {
          companyInfo.headquarters = companyInfo.headquarters || td
        }
        if (th.includes('홈페이지') || th.includes('웹사이트') || th.includes('URL')) {
          companyInfo.website = companyInfo.website || td
        }
        if (th.includes('업종') && !companyInfo.industry) {
          companyInfo.industry = td
        }
        // 추가 정보 파싱
        if (th.includes('액면가') && companyInfo.faceValue === '-') {
          companyInfo.faceValue = td
        }
        if (th.includes('상장일') && companyInfo.listedDate === '-') {
          companyInfo.listedDate = td
        }
        if ((th.includes('상장주식') || th.includes('발행주식')) && companyInfo.listedShares === '-') {
          companyInfo.listedShares = td
        }
        if ((th.includes('외국인') || th.includes('외인')) && companyInfo.foreignOwnership === '-') {
          companyInfo.foreignOwnership = td
        }
        if (th.includes('자본금') && companyInfo.capital === '-') {
          companyInfo.capital = td
        }
      })
    }

    // 네이버 금융 종목 페이지에서 추가 정보 수집
    const mainUrl2 = `https://finance.naver.com/item/main.naver?code=${code}`
    const mainResponse2 = await fetch(mainUrl2, {
      headers: { 'User-Agent': USER_AGENT },
    })

    if (mainResponse2.ok) {
      const mainHtml2 = await mainResponse2.text()
      const $main2 = cheerio.load(mainHtml2)

      // 외국인 지분율
      if (companyInfo.foreignOwnership === '-') {
        $main2('.tab_con1 table tr').each((_, row) => {
          const th = $main2(row).find('th').text().trim()
          const td = $main2(row).find('td').text().trim()
          if (th.includes('외국인')) {
            const match = td.match(/[\d.]+%?/)
            if (match) {
              companyInfo.foreignOwnership = match[0].includes('%') ? match[0] : match[0] + '%'
            }
          }
        })
      }

      // 상장주식수
      if (companyInfo.listedShares === '-') {
        $main2('.tab_con1 table tr').each((_, row) => {
          const th = $main2(row).find('th').text().trim()
          const td = $main2(row).find('td .blind, td em').first().text().trim()
          if (th.includes('상장주식')) {
            companyInfo.listedShares = td || '-'
          }
        })
      }
    }

    return companyInfo
  } catch (error) {
    console.error('Company info scraping error:', error)
    return null
  }
}

/**
 * 투자 지표 스크래핑 (PER, PBR, ROE 등)
 */
export async function scrapeInvestmentIndicators(
  code: string
): Promise<InvestmentIndicators | null> {
  try {
    const url = `https://finance.naver.com/item/main.naver?code=${code}`
    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch indicators: ${response.statusText}`)
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    const indicators: InvestmentIndicators = {
      per: '-',
      pbr: '-',
      eps: '-',
      bps: '-',
      roe: '-',
      dividendYield: '-',
      // 추가 지표
      week52High: '-',
      week52Low: '-',
      psr: '-',
      dps: '-',
    }

    // 투자 지표 테이블 파싱
    // 네이버 금융 종목 페이지의 투자 지표 섹션
    $('.tab_con1 table tr').each((_, row) => {
      const th = $(row).find('th, td').first().text().trim()
      const value = $(row).find('td em, td .blind').first().text().trim()

      if (th.includes('PER')) indicators.per = value || '-'
      if (th.includes('PBR')) indicators.pbr = value || '-'
      if (th.includes('EPS')) indicators.eps = value || '-'
      if (th.includes('BPS')) indicators.bps = value || '-'
      if (th.includes('ROE')) indicators.roe = value || '-'
      if (th.includes('배당')) indicators.dividendYield = value || '-'
      // 52주 최고/최저
      if (th.includes('52주') && th.includes('최고')) {
        indicators.week52High = value || '-'
      }
      if (th.includes('52주') && th.includes('최저')) {
        indicators.week52Low = value || '-'
      }
    })

    // 52주 최고/최저 - 다른 셀렉터로 시도
    if (indicators.week52High === '-' || indicators.week52Low === '-') {
      $('table tr').each((_, row) => {
        const th = $(row).find('th').text().trim()
        const td = $(row).find('td .blind, td em').first().text().trim()
        if (th.includes('52주') && th.includes('고')) {
          indicators.week52High = td || indicators.week52High
        }
        if (th.includes('52주') && th.includes('저')) {
          indicators.week52Low = td || indicators.week52Low
        }
      })
    }

    // 추가: 종목분석 탭에서 상세 지표
    const analysisUrl = `https://finance.naver.com/item/coinfo.naver?code=${code}`
    const analysisResponse = await fetch(analysisUrl, {
      headers: { 'User-Agent': USER_AGENT },
    })

    if (analysisResponse.ok) {
      const analysisHtml = await analysisResponse.text()
      const $analysis = cheerio.load(analysisHtml)

      // per, pbr 등 검색
      $analysis('table tr').each((_, row) => {
        const cells = $analysis(row).find('td')
        cells.each((_, cell) => {
          const text = $analysis(cell).text().trim()
          if (text.includes('PER') && indicators.per === '-') {
            const match = text.match(/[\d.]+/)
            if (match) indicators.per = match[0]
          }
          if (text.includes('PBR') && indicators.pbr === '-') {
            const match = text.match(/[\d.]+/)
            if (match) indicators.pbr = match[0]
          }
        })
      })
    }

    return indicators
  } catch (error) {
    console.error('Investment indicators scraping error:', error)
    return null
  }
}

/**
 * 종목명으로 시장 구분 조회
 */
export async function getStockMarket(code: string): Promise<'KOSPI' | 'KOSDAQ' | 'KONEX'> {
  try {
    const url = `https://finance.naver.com/item/main.naver?code=${code}`
    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
    })

    if (!response.ok) {
      return 'KOSPI'
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    // 종목명 옆 시장 구분 확인
    const marketText = $('.code').text().toLowerCase()

    if (marketText.includes('kosdaq')) {
      return 'KOSDAQ'
    }
    if (marketText.includes('konex')) {
      return 'KONEX'
    }

    return 'KOSPI'
  } catch {
    return 'KOSPI'
  }
}
