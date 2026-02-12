/**
 * KRX 한국거래소 JSON API 클라이언트
 *
 * 전종목 시세를 단일 API 호출로 가져와서
 * 거래량 상위 / 상승률 상위 / 하락률 상위를 계산합니다.
 */

import type { TrendingStockItem, TrendingStocksData } from '@/types/trending-stock'
import type { ChangeType } from '@/types/economy'

// KRX API 응답 항목
interface KRXStockItem {
  ISU_SRT_CD: string    // 종목코드 (005930)
  ISU_ABBRV: string     // 종목명 (삼성전자)
  TDD_CLSPRC: string    // 종가(현재가) ("81,200")
  CMPPREVDD_PRC: string // 전일대비 ("1,200")
  FLUC_RT: string       // 등락률 ("1.50")
  FLUC_TP_CD: string    // 등락구분 ("1"=상승, "2"=하락, "3"=보합)
  ACC_TRDVOL: string    // 거래량 ("12,345,678")
  ACC_TRDVAL: string    // 거래대금
  MKTCAP: string        // 시가총액
  MKT_NM?: string       // 시장구분
}

interface KRXResponse {
  OutBlock_1: KRXStockItem[]
}

// ETF/ETN/리츠 등 비주식 종목 필터링 키워드
const ETF_KEYWORDS = [
  'KODEX', 'TIGER', 'KBSTAR', 'ARIRANG', 'HANARO', 'SOL', 'KINDEX',
  'KOSEF', 'SMART', 'TIMEFOLIO', 'ACE', 'BNK', 'FOCUS', 'WOORI',
  'PLUS', 'TREX', 'VITA', 'MIRAE', 'TRUE', 'RISE',
  // ETN
  'QV', 'TRUE', 'NH',
  // 리츠/스팩
  '스팩', '리츠', 'SPAC',
]

/**
 * 오늘 날짜를 YYYYMMDD 형식으로 반환
 */
function getTodayString(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}${month}${day}`
}

/**
 * 콤마 제거 후 숫자 변환
 */
function parseNumber(str: string): number {
  return Number(str.replace(/,/g, ''))
}

/**
 * ETF/ETN 등 비주식 종목인지 확인
 */
function isETFOrNonStock(name: string): boolean {
  return ETF_KEYWORDS.some((keyword) => name.includes(keyword))
}

/**
 * KRX 전종목 시세 조회
 */
async function fetchKRXAllStocks(): Promise<KRXStockItem[]> {
  const trdDd = getTodayString()

  const params = new URLSearchParams({
    bld: 'dbms/MDC/STAT/standard/MDCSTAT01501',
    locale: 'ko_KR',
    mktId: 'ALL',
    trdDd,
    share: '1',
    money: '1',
    csvxls_is498: 'false',
  })

  const response = await fetch(
    'http://data.krx.co.kr/comm/bldAttendant/getJsonData.cmd',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0',
      },
      body: params.toString(),
    }
  )

  if (!response.ok) {
    throw new Error(`KRX API error: ${response.status}`)
  }

  const data: KRXResponse = await response.json()

  if (!data.OutBlock_1 || data.OutBlock_1.length === 0) {
    throw new Error('KRX API returned empty data')
  }

  return data.OutBlock_1
}

/**
 * KRX 항목을 TrendingStockItem으로 변환
 */
function toTrendingItem(item: KRXStockItem, rank: number): TrendingStockItem {
  const flucType = item.FLUC_TP_CD
  let changeType: ChangeType = 'unchanged'
  if (flucType === '1') changeType = 'up'
  else if (flucType === '2') changeType = 'down'

  const sign = changeType === 'up' ? '+' : changeType === 'down' ? '-' : ''

  return {
    rank,
    code: item.ISU_SRT_CD,
    name: item.ISU_ABBRV,
    price: item.TDD_CLSPRC,
    change: `${sign}${item.CMPPREVDD_PRC}`,
    changePercent: `${sign}${item.FLUC_RT}`,
    changeType,
    volume: item.ACC_TRDVOL,
  }
}

/**
 * 실시간 주목 종목 데이터 수집
 */
export async function fetchTrendingStocks(): Promise<TrendingStocksData> {
  const allStocks = await fetchKRXAllStocks()

  // ETF/ETN 등 비주식 종목 필터링 + 거래량 0 제외
  const stocks = allStocks.filter(
    (item) =>
      !isETFOrNonStock(item.ISU_ABBRV) &&
      parseNumber(item.ACC_TRDVOL) > 0 &&
      parseNumber(item.TDD_CLSPRC) > 0
  )

  // 거래량 상위 10
  const byVolume = [...stocks]
    .sort((a, b) => parseNumber(b.ACC_TRDVOL) - parseNumber(a.ACC_TRDVOL))
    .slice(0, 10)
    .map((item, i) => toTrendingItem(item, i + 1))

  // 상승률 상위 10 (FLUC_TP_CD === '1'인 종목만)
  const gainers = [...stocks]
    .filter((item) => item.FLUC_TP_CD === '1')
    .sort((a, b) => parseFloat(b.FLUC_RT) - parseFloat(a.FLUC_RT))
    .slice(0, 10)
    .map((item, i) => toTrendingItem(item, i + 1))

  // 하락률 상위 10 (FLUC_TP_CD === '2'인 종목만)
  const losers = [...stocks]
    .filter((item) => item.FLUC_TP_CD === '2')
    .sort((a, b) => parseFloat(a.FLUC_RT) - parseFloat(b.FLUC_RT))
    .slice(0, 10)
    .map((item, i) => toTrendingItem(item, i + 1))

  return {
    volume: byVolume,
    gainers,
    losers,
    lastUpdated: new Date().toISOString(),
  }
}
