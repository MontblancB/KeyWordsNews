/**
 * 실시간 주목 종목 데이터 수집
 *
 * - 상승률/하락률 상위: 네이버 모바일 주식 JSON API (m.stock.naver.com)
 * - 거래량 상위: 네이버 금융 HTML 스크래핑 + ETF 필터링
 */

import * as cheerio from 'cheerio'
import type { TrendingStockItem, TrendingStocksData } from '@/types/trending-stock'
import type { ChangeType } from '@/types/economy'

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'

// ETF/ETN/리츠 등 비주식 종목 필터링 키워드
const ETF_KEYWORDS = [
  'KODEX', 'TIGER', 'KBSTAR', 'ARIRANG', 'HANARO', 'SOL', 'KINDEX',
  'KOSEF', 'SMART', 'TIMEFOLIO', 'ACE', 'BNK', 'FOCUS', 'WOORI',
  'PLUS', 'TREX', 'VITA', 'MIRAE', 'TRUE', 'RISE',
  'ETN', '스팩', '리츠', 'SPAC', '인버스', '레버리지', '선물',
]

// ─── 네이버 모바일 JSON API (상승/하락) ───

interface NaverMobileStock {
  itemCode: string
  stockName: string
  stockEndType: string // "stock" | "etf" etc.
  closePrice: string
  compareToPreviousClosePrice: string
  compareToPreviousPrice: {
    code: string // "1"=상한, "2"=상승, "3"=보합, "4"=하한, "5"=하락
    text: string
    name: string
  }
  fluctuationsRatio: string
  accumulatedTradingVolume: string
  stockExchangeType: {
    nameEng: string // "KOSPI" | "KOSDAQ"
  }
}

interface NaverMobileResponse {
  stocks: NaverMobileStock[]
}

function mobileStockToItem(stock: NaverMobileStock, rank: number): TrendingStockItem {
  const code = stock.compareToPreviousPrice.code
  let changeType: ChangeType = 'unchanged'
  if (code === '1' || code === '2') changeType = 'up'
  else if (code === '4' || code === '5') changeType = 'down'

  const sign = changeType === 'up' ? '+' : changeType === 'down' ? '-' : ''

  return {
    rank,
    code: stock.itemCode,
    name: stock.stockName,
    price: stock.closePrice,
    change: `${sign}${stock.compareToPreviousClosePrice}`,
    changePercent: `${sign}${stock.fluctuationsRatio}`,
    changeType,
    volume: stock.accumulatedTradingVolume,
  }
}

async function fetchNaverMobileRanking(type: 'up' | 'down'): Promise<TrendingStockItem[]> {
  const response = await fetch(
    `https://m.stock.naver.com/api/stocks/${type}?page=1&pageSize=10`,
    { headers: { 'User-Agent': USER_AGENT } }
  )

  if (!response.ok) {
    throw new Error(`Naver mobile API error (${type}): ${response.status}`)
  }

  const data: NaverMobileResponse = await response.json()

  return data.stocks
    .filter((s) => s.stockEndType === 'stock')
    .slice(0, 10)
    .map((s, i) => mobileStockToItem(s, i + 1))
}

// ─── 네이버 금융 HTML 스크래핑 (거래량) ───

function isETFOrNonStock(name: string): boolean {
  return ETF_KEYWORDS.some((keyword) => name.toUpperCase().includes(keyword.toUpperCase()))
}

async function fetchNaverVolumeRanking(): Promise<TrendingStockItem[]> {
  // KOSPI(sosok=0) + KOSDAQ(sosok=1) 각각 가져와서 합침
  // 네이버 금융 PC 페이지는 EUC-KR 인코딩이므로 TextDecoder 사용
  const decoder = new TextDecoder('euc-kr')
  const [kospiHtml, kosdaqHtml] = await Promise.all(
    [0, 1].map(async (sosok) => {
      const res = await fetch(
        `https://finance.naver.com/sise/sise_quant.naver?sosok=${sosok}`,
        { headers: { 'User-Agent': USER_AGENT } }
      )
      if (!res.ok) throw new Error(`Naver volume page error: ${res.status}`)
      const buffer = await res.arrayBuffer()
      return decoder.decode(buffer)
    })
  )

  const parseVolumeTable = (html: string): TrendingStockItem[] => {
    const $ = cheerio.load(html, { decodeEntities: false })
    const items: TrendingStockItem[] = []

    $('table.type_2 tr').each((_, row) => {
      const tds = $(row).find('td')
      if (tds.length < 6) return

      const no = $(tds[0]).text().trim()
      if (!no || isNaN(parseInt(no))) return

      const nameEl = $(tds[1]).find('a.tltle')
      const name = nameEl.text().trim()
      const code = (nameEl.attr('href') || '').match(/code=(\d+)/)?.[1] || ''

      if (!code || !name) return
      if (isETFOrNonStock(name)) return

      const price = $(tds[2]).text().trim()
      const changeRaw = $(tds[3]).text().trim().replace(/\s+/g, '')
      const pctRaw = $(tds[4]).text().trim()
      const volume = $(tds[5]).text().trim()

      // 등락 판별: 퍼센트 부호로
      let changeType: ChangeType = 'unchanged'
      if (pctRaw.includes('+')) changeType = 'up'
      else if (pctRaw.includes('-')) changeType = 'down'

      items.push({
        rank: 0,
        code,
        name,
        price,
        change: changeRaw,
        changePercent: pctRaw,
        changeType,
        volume,
      })
    })

    return items
  }

  const kospiItems = parseVolumeTable(kospiHtml)
  const kosdaqItems = parseVolumeTable(kosdaqHtml)

  // 합쳐서 거래량 기준 정렬
  const all = [...kospiItems, ...kosdaqItems]
    .sort((a, b) => {
      const volA = Number(a.volume.replace(/,/g, ''))
      const volB = Number(b.volume.replace(/,/g, ''))
      return volB - volA
    })
    .slice(0, 10)
    .map((item, i) => ({ ...item, rank: i + 1 }))

  return all
}

// ─── 메인 함수 ───

/**
 * 실시간 주목 종목 데이터 수집 (병렬)
 */
export async function fetchTrendingStocks(): Promise<TrendingStocksData> {
  const [volume, gainers, losers] = await Promise.all([
    fetchNaverVolumeRanking(),
    fetchNaverMobileRanking('up'),
    fetchNaverMobileRanking('down'),
  ])

  return {
    volume,
    gainers,
    losers,
    lastUpdated: new Date().toISOString(),
  }
}
