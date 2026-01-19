import type { EconomyData } from '@/types/economy'
import {
  scrapeDomesticIndexV2,
  scrapeExchangeV2,
  scrapeGoldPriceV2,
  scrapeSilverPriceV2,
} from './naver-finance-v2'
import { fetchInternationalIndices } from '../api/yahoo-finance'
import { fetchAllCoinGeckoData } from '../api/coingecko'

/**
 * 하이브리드 경제 지표 수집기
 *
 * - 국내 지수 (KOSPI, KOSDAQ): 네이버 금융 스크래핑
 * - 환율 (USD, JPY, EUR, CNY): 네이버 금융 스크래핑
 * - 귀금속 (금, 은): 네이버 금융 스크래핑
 * - 해외 지수 (S&P 500, NASDAQ, Dow, Nikkei): Yahoo Finance API (실제 지수 값)
 * - 암호화폐 (BTC, ETH, XRP, ADA): CoinGecko API
 * - 글로벌 암호화폐 데이터 (시총, 도미넌스): CoinGecko API
 * - 공포 및 탐욕 지수: Alternative.me API
 */

/**
 * 모든 경제 지표 수집 (하이브리드 방식)
 */
export async function collectAllEconomyData(): Promise<EconomyData> {
  // 병렬 처리로 모든 데이터 수집
  const [kospi, kosdaq, exchange, gold, silver, international, coinGeckoData] =
    await Promise.all([
      scrapeDomesticIndexV2('KOSPI'),
      scrapeDomesticIndexV2('KOSDAQ'),
      scrapeExchangeV2(),
      scrapeGoldPriceV2(),
      scrapeSilverPriceV2(),
      fetchInternationalIndices(), // Yahoo Finance API
      fetchAllCoinGeckoData(), // CoinGecko API (암호화폐 + 글로벌 데이터 + 공포탐욕지수)
    ])

  return {
    domestic: {
      kospi,
      kosdaq,
    },
    international,
    exchange,
    metals: {
      gold,
      silver,
    },
    crypto: coinGeckoData.crypto,
    globalCrypto: coinGeckoData.global,
    fearGreed: coinGeckoData.fearGreed,
    lastUpdated: new Date().toLocaleString('ko-KR', {
      timeZone: 'Asia/Seoul', // 한국 시간(KST, UTC+9) 기준
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }),
  }
}
