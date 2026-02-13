/**
 * 실시간 주목 종목 데이터 수집
 *
 * - 상승률/하락률 상위: 네이버 모바일 주식 JSON API (m.stock.naver.com)
 * - 거래량 상위: 네이버 금융 HTML 스크래핑 + ETF 필터링
 * - 장 외 시간: DB 캐시에서 직전 거래일 데이터 반환
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

// ─── 마켓 상태 감지 ───

type MarketStatus = 'OPEN' | 'CLOSE' | 'PREOPEN' | 'UNKNOWN'

interface MarketInfo {
  status: MarketStatus
  tradingDate: string // YYYY-MM-DD
}

/**
 * 네이버 모바일 API에서 마켓 상태 확인
 * up 엔드포인트의 응답에 marketStatus와 tradingDate 포함
 */
async function checkMarketStatus(): Promise<MarketInfo> {
  try {
    const res = await fetch(
      'https://m.stock.naver.com/api/stocks/up?page=1&pageSize=1',
      { headers: { 'User-Agent': USER_AGENT } }
    )
    if (!res.ok) return { status: 'UNKNOWN', tradingDate: getTodayDateString() }

    const data = await res.json()
    const status: MarketStatus = data.marketStatus || 'UNKNOWN'

    // 종목 데이터가 있으면 localTradedAt에서 날짜 추출
    if (data.stocks?.[0]?.localTradedAt) {
      const tradingDate = data.stocks[0].localTradedAt.split('T')[0]
      return { status, tradingDate }
    }

    return { status, tradingDate: getTodayDateString() }
  } catch {
    return { status: 'UNKNOWN', tradingDate: getTodayDateString() }
  }
}

function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0]
}

// ─── 네이버 모바일 JSON API (상승/하락) ───

interface NaverMobileStock {
  itemCode: string
  stockName: string
  stockEndType: string
  closePrice: string
  compareToPreviousClosePrice: string
  compareToPreviousPrice: {
    code: string // "1"=상한, "2"=상승, "3"=보합, "4"=하한, "5"=하락
    text: string
    name: string
  }
  fluctuationsRatio: string
  accumulatedTradingVolume: string
  localTradedAt?: string
  stockExchangeType: {
    nameEng: string
  }
}

interface NaverMobileResponse {
  stocks: NaverMobileStock[]
  marketStatus: string
}

function mobileStockToItem(stock: NaverMobileStock, rank: number): TrendingStockItem {
  const code = stock.compareToPreviousPrice.code
  let changeType: ChangeType = 'unchanged'
  if (code === '1' || code === '2') changeType = 'up'
  else if (code === '4' || code === '5') changeType = 'down'

  // 이미 부호가 포함된 값(-50, -0.17)에서 부호 제거 후 sign 적용
  const rawChange = String(stock.compareToPreviousClosePrice).replace(/^-/, '')
  const rawPercent = String(stock.fluctuationsRatio).replace(/^-/, '')
  const sign = changeType === 'up' ? '+' : changeType === 'down' ? '-' : ''

  return {
    rank,
    code: stock.itemCode,
    name: stock.stockName,
    price: stock.closePrice,
    change: `${sign}${rawChange}`,
    changePercent: `${sign}${rawPercent}`,
    changeType,
    volume: stock.accumulatedTradingVolume,
  }
}

async function fetchNaverMobileRanking(type: 'up' | 'down'): Promise<TrendingStockItem[]> {
  // ETF/ETN이 많으므로 넉넉하게 요청 후 보통주만 필터링하여 10개 추출
  const response = await fetch(
    `https://m.stock.naver.com/api/stocks/${type}?page=1&pageSize=80`,
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
      // "상승142" → "142", "하락1,200" → "1,200" 숫자만 추출
      const changeText = $(tds[3]).text().trim().replace(/\s+/g, '')
      const changeNum = changeText.replace(/[^\d,]/g, '')
      const pctRaw = $(tds[4]).text().trim()
      const volume = $(tds[5]).text().trim()

      let changeType: ChangeType = 'unchanged'
      if (pctRaw.includes('+') || changeText.includes('상승') || changeText.includes('상한')) changeType = 'up'
      else if (pctRaw.includes('-') || changeText.includes('하락') || changeText.includes('하한')) changeType = 'down'

      const sign = changeType === 'up' ? '+' : changeType === 'down' ? '-' : ''
      const pctNum = pctRaw.replace(/[^\d.]/g, '')

      items.push({
        rank: 0,
        code,
        name,
        price,
        change: `${sign}${changeNum}`,
        changePercent: `${sign}${pctNum}`,
        changeType,
        volume,
      })
    })

    return items
  }

  const kospiItems = parseVolumeTable(kospiHtml)
  const kosdaqItems = parseVolumeTable(kosdaqHtml)

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

// ─── 장외 시간 Fallback (marketValue + price API) ───

interface MarketValueStock {
  itemCode: string
  stockName: string
  stockEndType: string
  closePrice: string
  compareToPreviousClosePrice: string
  compareToPreviousPrice: {
    code: string
    text: string
    name: string
  }
  fluctuationsRatio: string
  accumulatedTradingVolume: string
  localTradedAt?: string
}

interface PriceHistoryItem {
  localTradedAt: string
  closePrice: string
  compareToPreviousClosePrice: string
  compareToPreviousPrice: {
    code: string
    text: string
    name: string
  }
  fluctuationsRatio: string
  accumulatedTradingVolume: string
}

/**
 * 장외 시간 cold start 시 직전 거래일 데이터를 수집하는 fallback
 *
 * 1. marketValue API로 시가총액 상위 보통주 수집 (2페이지, 최대 80개)
 * 2. 각 종목의 price API에서 직전 거래일(변동값 != 0) 데이터 추출
 * 3. 거래량/상승률/하락률 기준으로 정렬하여 각 10종목씩 TrendingStocksData 구성
 */
export async function fetchFallbackFromPriceHistory(): Promise<TrendingStocksData | null> {
  try {
    // 시가총액 상위 종목을 2페이지(각 50개)로 수집하여 충분한 종목 확보
    const pages = await Promise.all(
      [1, 2].map(async (page) => {
        const res = await fetch(
          `https://m.stock.naver.com/api/stocks/marketValue?page=${page}&pageSize=50`,
          { headers: { 'User-Agent': USER_AGENT } }
        )
        if (!res.ok) return []
        const data = await res.json()
        return (data.stocks || []) as MarketValueStock[]
      })
    )

    const stocks: MarketValueStock[] = pages
      .flat()
      .filter((s: MarketValueStock) => s.stockEndType === 'stock')

    if (stocks.length === 0) return null

    // 각 종목의 최근 가격 이력에서 직전 거래일 데이터 추출
    const results = await Promise.all(
      stocks.map(async (s) => {
        try {
          const pr = await fetch(
            `https://m.stock.naver.com/api/stock/${s.itemCode}/price?pageSize=5&page=1`,
            { headers: { 'User-Agent': USER_AGENT } }
          )
          if (!pr.ok) return null

          const prices: PriceHistoryItem[] = await pr.json()
          // 변동값이 0이 아닌 가장 최근 항목 = 직전 거래일 실제 데이터
          const lastTrading = prices.find(
            (p) => p.compareToPreviousClosePrice !== '0'
          )
          if (!lastTrading) return null

          const code = lastTrading.compareToPreviousPrice.code
          let changeType: ChangeType = 'unchanged'
          if (code === '1' || code === '2') changeType = 'up'
          else if (code === '4' || code === '5') changeType = 'down'

          // 이미 부호가 포함된 값(-100, -0.17)과 부호 없는 값(10800, 6.44) 모두 처리
          const rawChange = String(lastTrading.compareToPreviousClosePrice).replace(/^-/, '')
          const rawPercent = String(lastTrading.fluctuationsRatio).replace(/^-/, '')
          const sign = changeType === 'up' ? '+' : changeType === 'down' ? '-' : ''

          // volume은 숫자로 올 수 있으므로 문자열로 변환 후 콤마 포맷팅
          const volNum = Number(String(lastTrading.accumulatedTradingVolume).replace(/,/g, ''))
          const volumeStr = volNum.toLocaleString('ko-KR')

          return {
            code: s.itemCode,
            name: s.stockName,
            price: lastTrading.closePrice,
            change: `${sign}${rawChange}`,
            changePercent: `${sign}${rawPercent}`,
            changeType,
            volume: volumeStr,
            tradingDate: lastTrading.localTradedAt?.split('T')[0] || '',
          } as TrendingStockItem & { tradingDate: string }
        } catch {
          return null
        }
      })
    )

    const validResults = results.filter(
      (r): r is TrendingStockItem & { tradingDate: string } => r !== null
    )

    if (validResults.length === 0) return null

    // 거래일 추출 (첫 번째 유효 결과에서)
    const tradingDate = validResults[0].tradingDate

    // 거래량 상위 10
    const volume = [...validResults]
      .sort((a, b) => {
        const volA = Number(String(a.volume).replace(/,/g, ''))
        const volB = Number(String(b.volume).replace(/,/g, ''))
        return volB - volA
      })
      .slice(0, 10)
      .map((item, i) => ({ ...item, rank: i + 1 }))

    // 상승률 상위 10
    const gainers = [...validResults]
      .filter((r) => r.changeType === 'up')
      .sort((a, b) => {
        const pctA = Math.abs(parseFloat(a.changePercent))
        const pctB = Math.abs(parseFloat(b.changePercent))
        return pctB - pctA
      })
      .slice(0, 10)
      .map((item, i) => ({ ...item, rank: i + 1 }))

    // 하락률 상위 10
    const losers = [...validResults]
      .filter((r) => r.changeType === 'down')
      .sort((a, b) => {
        const pctA = Math.abs(parseFloat(a.changePercent))
        const pctB = Math.abs(parseFloat(b.changePercent))
        return pctB - pctA
      })
      .slice(0, 10)
      .map((item, i) => ({ ...item, rank: i + 1 }))

    // tradingDate 프로퍼티 제거 (TrendingStockItem 타입에 없음)
    const cleanItems = (items: (TrendingStockItem & { tradingDate: string })[]) =>
      items.map(({ tradingDate: _, ...rest }) => rest as TrendingStockItem)

    return {
      volume: cleanItems(volume),
      gainers: cleanItems(gainers),
      losers: cleanItems(losers),
      marketOpen: false,
      tradingDate,
      lastUpdated: new Date().toISOString(),
    }
  } catch (error) {
    console.error('[Trending Stocks] Fallback fetch error:', error)
    return null
  }
}

// ─── 메인 함수 ───

/**
 * 실시간 주목 종목 데이터 수집
 * - 장중: 실시간 데이터 수집 + marketOpen: true
 * - 장외: 빈 데이터 반환 (호출측에서 DB 캐시 사용)
 */
export async function fetchTrendingStocks(): Promise<TrendingStocksData | null> {
  const marketInfo = await checkMarketStatus()

  // PREOPEN이면서 데이터가 없는 경우 → null 반환 (DB 캐시 사용 필요)
  if (marketInfo.status === 'PREOPEN' || marketInfo.status === 'CLOSE') {
    // 장 마감 직후(CLOSE)에도 데이터가 있을 수 있으므로 시도
    try {
      const [volume, gainers, losers] = await Promise.all([
        fetchNaverVolumeRanking(),
        fetchNaverMobileRanking('up'),
        fetchNaverMobileRanking('down'),
      ])

      const hasData = volume.length > 0 || gainers.length > 0 || losers.length > 0
      if (!hasData) return null

      return {
        volume,
        gainers,
        losers,
        marketOpen: false,
        tradingDate: marketInfo.tradingDate,
        lastUpdated: new Date().toISOString(),
      }
    } catch {
      return null
    }
  }

  // 장중 (OPEN) 또는 상태 알 수 없음
  const [volume, gainers, losers] = await Promise.all([
    fetchNaverVolumeRanking(),
    fetchNaverMobileRanking('up'),
    fetchNaverMobileRanking('down'),
  ])

  return {
    volume,
    gainers,
    losers,
    marketOpen: marketInfo.status === 'OPEN',
    tradingDate: marketInfo.tradingDate,
    lastUpdated: new Date().toISOString(),
  }
}
