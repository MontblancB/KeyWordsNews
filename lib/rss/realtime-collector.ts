/**
 * 실시간 RSS 수집 서비스 (DB 불필요)
 *
 * DB 없이 RSS 피드를 실시간으로 파싱하여 반환
 * 메모리 캐시만 사용
 */

import { RSSParserService } from './parser'
import { getCategorySources, getAllSources } from './sources'
import { NewsItem } from '@/types/news'

export class RealtimeRSSCollector {
  private parser: RSSParserService

  constructor() {
    this.parser = new RSSParserService()
  }

  /**
   * 모든 RSS 피드를 실시간으로 수집
   */
  async collectAllRealtime(): Promise<NewsItem[]> {
    console.log('🔄 실시간 RSS 수집 시작...')

    const sources = getAllSources()
    const allNews: NewsItem[] = []

    // 병렬로 모든 RSS 파싱
    const results = await Promise.allSettled(
      sources.map(source => this.parser.fetchFeed(source))
    )

    for (let i = 0; i < results.length; i++) {
      const result = results[i]
      const source = sources[i]

      if (result.status === 'fulfilled' && result.value.length > 0) {
        const items = result.value

        const newsItems: NewsItem[] = items.map(item => ({
          id: this.generateId(item.link),
          title: item.title,
          url: item.link,
          summary: item.contentSnippet || '',
          source: source.name,
          category: source.category,
          publishedAt: item.pubDate.toISOString(), // ISO 문자열로 명시적 변환
          imageUrl: item.imageUrl,
          isBreaking: source.category === 'breaking'
        }))

        allNews.push(...newsItems)
      }
    }

    // 날짜순 정렬 (최신순) - ISO 문자열을 Date로 변환하여 타임스탬프 비교
    allNews.sort((a, b) => {
      const timeA = new Date(a.publishedAt).getTime()
      const timeB = new Date(b.publishedAt).getTime()
      return timeB - timeA // 최신순 (큰 타임스탬프가 앞으로)
    })

    // 중복 제거 (URL 기준)
    const uniqueNews = this.removeDuplicates(allNews)

    console.log(`✅ 실시간 수집 완료: ${uniqueNews.length}개`)

    return uniqueNews
  }

  /**
   * 카테고리별 RSS 피드를 실시간으로 수집
   */
  async collectCategoryRealtime(category: string): Promise<NewsItem[]> {
    console.log(`🔄 실시간 ${category} 수집 시작...`)

    const sources = getCategorySources(category)
    const allNews: NewsItem[] = []

    const results = await Promise.allSettled(
      sources.map(source => this.parser.fetchFeed(source))
    )

    for (let i = 0; i < results.length; i++) {
      const result = results[i]
      const source = sources[i]

      if (result.status === 'fulfilled' && result.value.length > 0) {
        const items = result.value

        const newsItems: NewsItem[] = items.map(item => ({
          id: this.generateId(item.link),
          title: item.title,
          url: item.link,
          summary: item.contentSnippet || '',
          source: source.name,
          category: category,
          publishedAt: item.pubDate.toISOString(), // ISO 문자열로 명시적 변환
          imageUrl: item.imageUrl,
          isBreaking: category === 'breaking'
        }))

        allNews.push(...newsItems)
      }
    }

    // 날짜순 정렬 (최신순) - ISO 문자열을 Date로 변환하여 타임스탬프 비교
    allNews.sort((a, b) => {
      const timeA = new Date(a.publishedAt).getTime()
      const timeB = new Date(b.publishedAt).getTime()
      return timeB - timeA // 최신순 (큰 타임스탬프가 앞으로)
    })

    // 중복 제거
    const uniqueNews = this.removeDuplicates(allNews)

    console.log(`✅ ${category} 수집 완료: ${uniqueNews.length}개`)

    return uniqueNews
  }

  /**
   * 키워드로 뉴스 검색 (실시간)
   */
  async searchRealtime(keyword: string): Promise<NewsItem[]> {
    console.log(`🔍 실시간 검색: "${keyword}"`)

    // 모든 뉴스 수집
    const allNews = await this.collectAllRealtime()

    // 키워드 필터링
    const filtered = allNews.filter(news =>
      news.title.toLowerCase().includes(keyword.toLowerCase()) ||
      news.summary.toLowerCase().includes(keyword.toLowerCase())
    )

    console.log(`✅ 검색 결과: ${filtered.length}개`)

    return filtered
  }

  /**
   * URL 기반 고유 ID 생성
   */
  private generateId(url: string): string {
    // URL을 해시처럼 사용
    return Buffer.from(url).toString('base64').substring(0, 32)
  }

  /**
   * 중복 뉴스 제거 (URL 기준)
   */
  private removeDuplicates(news: NewsItem[]): NewsItem[] {
    const seen = new Set<string>()
    const unique: NewsItem[] = []

    for (const item of news) {
      if (!seen.has(item.url)) {
        seen.add(item.url)
        unique.push(item)
      }
    }

    return unique
  }
}

export const realtimeCollector = new RealtimeRSSCollector()
