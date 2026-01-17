import type { EconomyData } from '@/types/economy'
import {
  scrapeDomesticIndexV2,
  scrapeExchangeV2,
  scrapeGoldPriceV2,
} from './naver-finance-v2'
import { fetchInternationalIndices } from '../api/yahoo-finance'
import { fetchCryptoPrices } from '../api/finnhub'

/**
 * 하이브리드 경제 지표 수집기
 *
 * - 국내 지수 (KOSPI, KOSDAQ): 네이버 금융 스크래핑
 * - 환율 (USD, JPY, EUR, CNY): 네이버 금융 스크래핑
 * - 금시세: 네이버 금융 스크래핑
 * - 해외 지수 (S&P 500, NASDAQ, Dow, Nikkei): Yahoo Finance API (실제 지수 값)
 * - 암호화폐 (BTC, ETH, XRP, ADA): Finnhub API
 */

/**
 * 모든 경제 지표 수집 (하이브리드 방식)
 */
export async function collectAllEconomyData(): Promise<EconomyData> {
  // 네이버 금융 스크래핑 (국내 데이터)
  const [kospi, kosdaq, exchange, gold, international, crypto] = await Promise.all([
    scrapeDomesticIndexV2('KOSPI'),
    scrapeDomesticIndexV2('KOSDAQ'),
    scrapeExchangeV2(),
    scrapeGoldPriceV2(),
    fetchInternationalIndices(), // Yahoo Finance API
    fetchCryptoPrices(),         // Finnhub API
  ])

  return {
    domestic: {
      kospi,
      kosdaq,
    },
    international,
    exchange,
    gold: {
      international: gold,
    },
    crypto,
    lastUpdated: new Date().toLocaleString('ko-KR', {
      timeZone: 'Asia/Seoul',  // 한국 시간(KST, UTC+9) 기준
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }),
  }
}
