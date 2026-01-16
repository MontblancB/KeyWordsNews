import Parser from 'rss-parser'
import { RSSFeedSource, ParsedRSSItem } from '@/types/news'
import { decode as decodeHtmlEntities } from 'he'

export class RSSParserService {
  private parser: Parser

  constructor() {
    this.parser = new Parser({
      customFields: {
        item: [
          ['media:content', 'media', { keepArray: true }],
          ['media:thumbnail', 'thumbnail'],
          ['dc:creator', 'creator'],
          ['description', 'description'],
          ['content:encoded', 'contentEncoded']
        ]
      },
      timeout: 10000,
      headers: {
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
        'Accept-Charset': 'utf-8'
      }
    })
  }

  async fetchFeed(feedSource: RSSFeedSource): Promise<ParsedRSSItem[]> {
    try {
      console.log(`📡 Fetching RSS from ${feedSource.name}...`)

      const feed = await this.parser.parseURL(feedSource.url)

      const newsItems: ParsedRSSItem[] = feed.items.map((item: any) => {
        // 이미지 URL 추출
        let imageUrl: string | undefined

        // 다양한 방식으로 이미지 추출 시도
        if (item.enclosure?.url) {
          imageUrl = item.enclosure.url
        } else if (item.media) {
          if (Array.isArray(item.media)) {
            imageUrl = item.media[0]?.$?.url
          } else {
            imageUrl = item.media?.$?.url
          }
        } else if (item.thumbnail?.$?.url) {
          imageUrl = item.thumbnail.$.url
        } else if (item.contentEncoded) {
          // HTML 콘텐츠에서 첫 번째 이미지 추출
          const imgMatch = item.contentEncoded.match(/<img[^>]+src="([^">]+)"/)
          if (imgMatch) {
            imageUrl = imgMatch[1]
          }
        }

        // 본문 요약 추출
        const summary = this.extractSummary(
          item.contentSnippet || item.description || item.summary || ''
        )

        return {
          title: this.cleanText(item.title || ''),
          link: item.link || item.guid || '',
          pubDate: item.pubDate ? new Date(item.pubDate) : new Date(),
          content: item.content || item.contentEncoded,
          contentSnippet: summary,
          creator: item.creator || item['dc:creator'] || feedSource.name,
          categories: item.categories || [feedSource.category],
          guid: item.guid || item.link,
          imageUrl: imageUrl
        }
      })

      console.log(`✅ ${feedSource.name}: ${newsItems.length}개 뉴스 수집`)
      return newsItems

    } catch (error: any) {
      console.error(`❌ ${feedSource.name} RSS 파싱 실패:`, error.message)
      return []
    }
  }

  // HTML 태그 제거 및 텍스트 정리
  private cleanText(text: string): string {
    // 1. HTML 태그 제거
    let cleaned = text.replace(/<[^>]*>/g, '')

    // 2. HTML 엔티티 완전 디코딩 (&#xAC00;, &#44032;, &nbsp; 등 모두 처리)
    cleaned = decodeHtmlEntities(cleaned)

    // 3. 연속된 공백 정리 및 trim
    cleaned = cleaned.replace(/\s+/g, ' ').trim()

    return cleaned
  }

  // 요약문 추출 (150자 제한)
  private extractSummary(text: string): string {
    const cleaned = this.cleanText(text)
    if (cleaned.length > 150) {
      return cleaned.substring(0, 150) + '...'
    }
    return cleaned
  }
}
