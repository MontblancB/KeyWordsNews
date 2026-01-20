import * as cheerio from 'cheerio'
import type { StockSearchItem } from '@/types/stock'
import type { ChangeType } from '@/types/economy'

// 내부 타입 정의 (API에서 조합용)
export interface NaverStockPrice {
  current: string
  change: string
  changePercent: string
  changeType: ChangeType
  high: string
  low: string
  open: string
  volume: string
  prevClose: string
}

export interface NaverCompanyInfo {
  industry: string
  ceo: string
  establishedDate: string
  fiscalMonth: string
  employees: string
  marketCap: string
  headquarters: string
  website: string
}

export interface NaverInvestmentIndicators {
  per: string
  pbr: string
  eps: string
  bps: string
  roe: string
  dividendYield: string
}

/**
 * 네이버 금융 주식 스크래퍼
 */

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

/**
 * 종목 검색 (네이버 금융 자동완성 API)
 */
export async function searchStocks(query: string): Promise<StockSearchItem[]> {
  if (!query || query.trim().length === 0) {
    return []
  }

  try {
    const url = `https://ac.stock.naver.com/ac?q=${encodeURIComponent(query)}&target=stock`
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Search failed: ${response.statusText}`)
    }

    const data = await response.json()

    // 응답 구조: { items: [{ code, name, typeCode, ... }] }
    const items = data?.items || []

    return items
      .filter((item: { typeCode: string }) => item.typeCode === 'stock')
      .slice(0, 10)
      .map((item: { code: string; name: string; market?: string }) => {
        // market 판단
        let market: 'KOSPI' | 'KOSDAQ' | 'KONEX' = 'KOSPI'
        if (item.market === 'KOSDAQ') {
          market = 'KOSDAQ'
        } else if (item.market === 'KONEX') {
          market = 'KONEX'
        }

        return {
          code: item.code,
          name: item.name,
          market,
        }
      })
  } catch (error) {
    console.error('Stock search error:', error)
    return []
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
export async function scrapeStockPrice(code: string): Promise<NaverStockPrice | null> {
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
export async function scrapeCompanyInfo(code: string): Promise<NaverCompanyInfo | null> {
  try {
    const url = `https://finance.naver.com/item/coinfo.naver?code=${code}`
    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch company info: ${response.statusText}`)
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    // 기업 정보 테이블에서 추출
    const companyInfo: NaverCompanyInfo = {
      industry: '',
      ceo: '',
      establishedDate: '',
      fiscalMonth: '',
      employees: '',
      marketCap: '',
      headquarters: '',
      website: '',
    }

    // 종목 메인 페이지에서 시가총액, 업종 가져오기
    const mainUrl = `https://finance.naver.com/item/main.naver?code=${code}`
    const mainResponse = await fetch(mainUrl, {
      headers: { 'User-Agent': USER_AGENT },
    })

    if (mainResponse.ok) {
      const mainHtml = await mainResponse.text()
      const $main = cheerio.load(mainHtml)

      // 시가총액
      const marketCapText = $main('.first td').first().text().trim()
      companyInfo.marketCap = marketCapText

      // 업종
      const industryLink = $main('.sub_section .trade_compare a').first()
      companyInfo.industry = industryLink.text().trim()
    }

    // 기업개요 iframe에서 상세 정보
    // 네이버 금융은 iframe 구조이므로 별도 요청
    const companyDetailUrl = `https://finance.naver.com/item/coinfo.naver?code=${code}&target=finsum_more`
    const detailResponse = await fetch(companyDetailUrl, {
      headers: { 'User-Agent': USER_AGENT },
    })

    if (detailResponse.ok) {
      const detailHtml = await detailResponse.text()
      const $detail = cheerio.load(detailHtml)

      // 테이블에서 정보 추출
      $detail('table tr').each((_, row) => {
        const th = $detail(row).find('th').text().trim()
        const td = $detail(row).find('td').text().trim()

        if (th.includes('대표자')) companyInfo.ceo = td
        if (th.includes('설립일')) companyInfo.establishedDate = td
        if (th.includes('결산월')) companyInfo.fiscalMonth = td
        if (th.includes('직원')) companyInfo.employees = td
        if (th.includes('주소') || th.includes('본사')) companyInfo.headquarters = td
        if (th.includes('홈페이지')) companyInfo.website = td
      })
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
): Promise<NaverInvestmentIndicators | null> {
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

    const indicators: NaverInvestmentIndicators = {
      per: '-',
      pbr: '-',
      eps: '-',
      bps: '-',
      roe: '-',
      dividendYield: '-',
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
    })

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
