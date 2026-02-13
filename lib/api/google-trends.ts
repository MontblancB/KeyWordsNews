import Parser from 'rss-parser'

export interface GoogleTrendItem {
  keyword: string
  rank: number
  traffic: string // e.g. "500+", "1000+"
  newsTitle?: string
  newsUrl?: string
  newsSource?: string
  picture?: string
}

const GOOGLE_TRENDS_RSS_URL = 'https://trends.google.com/trending/rss?geo=KR'

/**
 * Google Trends RSS 피드를 파싱하여 실시간 급상승 검색어를 반환
 * @returns GoogleTrendItem[] 또는 실패 시 null
 */
export async function fetchGoogleTrends(): Promise<GoogleTrendItem[] | null> {
  try {
    const parser = new Parser({
      customFields: {
        item: [
          ['ht:approx_traffic', 'approxTraffic'],
          ['ht:picture', 'picture'],
          ['ht:picture_source', 'pictureSource'],
        ],
      },
      timeout: 10000,
      headers: {
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
        'User-Agent': 'KeyWordsNews/1.0',
      },
    })

    // RSS 원본 XML도 함께 가져와서 ht:news_item 중첩 구조 파싱
    const response = await fetch(GOOGLE_TRENDS_RSS_URL, {
      signal: AbortSignal.timeout(10000),
      headers: {
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
        'User-Agent': 'KeyWordsNews/1.0',
      },
    })

    if (!response.ok) {
      console.error(`[GoogleTrends] RSS fetch failed: ${response.status}`)
      return null
    }

    const xmlText = await response.text()
    const feed = await parser.parseString(xmlText)

    if (!feed.items || feed.items.length === 0) {
      console.warn('[GoogleTrends] No items in RSS feed')
      return null
    }

    // 각 item에서 ht:news_item 중첩 구조를 raw XML에서 추출
    const newsItemMap = parseNewsItems(xmlText)

    const trends: GoogleTrendItem[] = feed.items
      .slice(0, 20) // 상위 20개로 제한
      .map((item: any, index: number) => {
        const keyword = item.title?.trim() || ''
        const traffic = item.approxTraffic || ''
        const picture = item.picture || ''

        // raw XML에서 파싱한 뉴스 정보 매칭
        const newsInfo = newsItemMap.get(keyword)

        return {
          keyword,
          rank: index + 1,
          traffic,
          newsTitle: newsInfo?.title,
          newsUrl: newsInfo?.url,
          newsSource: newsInfo?.source,
          picture,
        }
      })
      .filter((item: GoogleTrendItem) => item.keyword.length > 0)

    console.log(`[GoogleTrends] Parsed ${trends.length} trends from RSS`)
    return trends
  } catch (error: any) {
    console.error('[GoogleTrends] RSS parsing failed:', error.message)
    return null
  }
}

/**
 * raw XML에서 각 item의 첫 번째 ht:news_item을 파싱
 */
function parseNewsItems(xml: string): Map<string, { title: string; url: string; source: string }> {
  const result = new Map<string, { title: string; url: string; source: string }>()

  // <item> 블록 추출
  const itemRegex = /<item>([\s\S]*?)<\/item>/g
  let match

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemBlock = match[1]

    // title 추출
    const titleMatch = itemBlock.match(/<title>([^<]*)<\/title>/)
    if (!titleMatch) continue
    const keyword = decodeXmlEntities(titleMatch[1].trim())

    // 첫 번째 ht:news_item 블록 추출
    const newsItemMatch = itemBlock.match(/<ht:news_item>([\s\S]*?)<\/ht:news_item>/)
    if (!newsItemMatch) continue

    const newsBlock = newsItemMatch[1]

    const newsTitleMatch = newsBlock.match(/<ht:news_item_title>([^<]*)<\/ht:news_item_title>/)
    const newsUrlMatch = newsBlock.match(/<ht:news_item_url>([^<]*)<\/ht:news_item_url>/)
    const newsSourceMatch = newsBlock.match(/<ht:news_item_source>([^<]*)<\/ht:news_item_source>/)

    if (newsTitleMatch && newsUrlMatch) {
      result.set(keyword, {
        title: decodeXmlEntities(newsTitleMatch[1].trim()),
        url: newsUrlMatch[1].trim(),
        source: newsSourceMatch ? decodeXmlEntities(newsSourceMatch[1].trim()) : '',
      })
    }
  }

  return result
}

function decodeXmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
}
