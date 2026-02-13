export interface SignalTrendItem {
  keyword: string
  rank: number
  state: string // 'n' = 신규, '+' = 상승, 's' = 유지
}

const SIGNAL_BZ_API_URL = 'https://api.signal.bz/news/realtime'

/**
 * Signal.bz 실시간 검색어 API 호출
 * @returns SignalTrendItem[] 또는 실패 시 null
 */
export async function fetchSignalTrends(): Promise<SignalTrendItem[] | null> {
  try {
    const response = await fetch(SIGNAL_BZ_API_URL, {
      signal: AbortSignal.timeout(8000),
      headers: {
        'User-Agent': 'KeyWordsNews/1.0',
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      console.error(`[SignalBz] API fetch failed: ${response.status}`)
      return null
    }

    const data = await response.json()

    if (!data.top10 || !Array.isArray(data.top10) || data.top10.length === 0) {
      console.warn('[SignalBz] No top10 data in response')
      return null
    }

    const trends: SignalTrendItem[] = data.top10
      .map((item: any) => ({
        keyword: item.keyword?.trim() || '',
        rank: item.rank,
        state: item.state || 's',
      }))
      .filter((item: SignalTrendItem) => item.keyword.length > 0)

    console.log(`[SignalBz] Parsed ${trends.length} trends`)
    return trends
  } catch (error: any) {
    console.error('[SignalBz] API call failed:', error.message)
    return null
  }
}
