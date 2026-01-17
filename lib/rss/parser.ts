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
          ['dc:date', 'dcDate'],  // 노컷뉴스, 경향신문 등의 날짜 필드
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
        } else {
          // HTML 콘텐츠에서 첫 번째 이미지 추출
          // contentEncoded, description 모두 확인
          const htmlContent = item.contentEncoded || item.description || ''

          if (htmlContent) {
            // 개선된 정규식: 큰따옴표, 작은따옴표, 따옴표 없는 경우 모두 매칭
            const imgMatch = htmlContent.match(/<img[^>]+src=["']?([^"'\s>]+)["']?/i)
            if (imgMatch) {
              imageUrl = imgMatch[1]
            }
          }
        }

        // 본문 요약 추출
        const summary = this.extractSummary(
          item.contentSnippet || item.description || item.summary || ''
        )

        // 날짜 파싱: dc:date, pubDate, isoDate 순서로 확인
        let publishedDate: Date
        try {
          if (item.dcDate) {
            publishedDate = new Date(item.dcDate)
          } else if (item.pubDate) {
            publishedDate = new Date(item.pubDate)
          } else if (item.isoDate) {
            publishedDate = new Date(item.isoDate)
          } else {
            publishedDate = new Date()
          }

          // 유효한 날짜인지 확인
          if (isNaN(publishedDate.getTime())) {
            console.warn(`⚠️ ${feedSource.name}: 잘못된 날짜 형식, 현재 시간 사용`)
            publishedDate = new Date()
          }

          // 시간대 보정: 일부 RSS가 GMT로 표기하지만 실제로는 KST 값을 사용하는 경우
          // (예: 노컷뉴스) KST → UTC 변환 (9시간 빼기)
          if (feedSource.dateIsKSTLabeledAsGMT) {
            const KST_OFFSET_MS = 9 * 60 * 60 * 1000 // 9시간 (밀리초)
            publishedDate = new Date(publishedDate.getTime() - KST_OFFSET_MS)
          }

          // 미래 날짜 방지: 현재 시간보다 1시간 이상 미래면 현재 시간으로 조정
          const now = new Date()
          const futureThreshold = 60 * 60 * 1000 // 1시간
          if (publishedDate.getTime() - now.getTime() > futureThreshold) {
            console.warn(`⚠️ ${feedSource.name}: 미래 날짜 감지 (${publishedDate.toISOString()}), 현재 시간으로 조정`)
            publishedDate = now
          }
        } catch (error) {
          console.warn(`⚠️ ${feedSource.name}: 날짜 파싱 실패, 현재 시간 사용`)
          publishedDate = new Date()
        }

        return {
          title: this.cleanText(item.title || ''),
          link: item.link || item.guid || '',
          pubDate: publishedDate,
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
