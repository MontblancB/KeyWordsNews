import { RSSParserService } from './parser'
import { newsService } from '../db/news'
import { getAllSources, getCategorySources } from './sources'
import { NewsItem } from '@/types/news'

export class RSSCollector {
  private parser: RSSParserService

  constructor() {
    this.parser = new RSSParserService()
  }

  // 모든 RSS 피드 수집
  async collectAll(): Promise<void> {
    console.log('🔄 전체 RSS 피드 수집 시작...\n')
    const startTime = Date.now()

    const sources = getAllSources()
    let totalCollected = 0
    let successCount = 0
    let failCount = 0

    for (const source of sources) {
      try {
        const items = await this.parser.fetchFeed(source)

        if (items.length > 0) {
          const newsItems: NewsItem[] = items.map(item => ({
            title: item.title,
            url: item.link,
            summary: item.contentSnippet || '',
            source: source.name,
            category: source.category,
            publishedAt: item.pubDate,
            imageUrl: item.imageUrl,
            isBreaking: source.category === 'breaking'
          }))

          const saved = await newsService.saveMultipleNews(newsItems)
          totalCollected += saved
          successCount++
        }
      } catch (error: any) {
        console.error(`❌ ${source.name} 수집 실패:`, error.message)
        failCount++
      }
    }

    const duration = Date.now() - startTime
    console.log('\n📊 RSS 수집 통계')
    console.log(`- 전체 소스: ${sources.length}`)
    console.log(`- 성공: ${successCount}`)
    console.log(`- 실패: ${failCount}`)
    console.log(`- 수집 뉴스: ${totalCollected}개`)
    console.log(`- 소요 시간: ${(duration / 1000).toFixed(2)}초\n`)
  }

  // 속보만 수집
  async collectBreaking(): Promise<void> {
    console.log('⚡ 긴급 속보 수집 시작...\n')

    const breakingSources = getCategorySources('breaking')

    for (const source of breakingSources) {
      const items = await this.parser.fetchFeed(source)

      // 최신 5개만 속보로 처리
      const recentItems = items.slice(0, 5)

      for (const item of recentItems) {
        await newsService.saveNews({
          title: item.title,
          url: item.link,
          summary: item.contentSnippet || '',
          source: source.name,
          category: 'breaking',
          publishedAt: item.pubDate,
          imageUrl: item.imageUrl,
          isBreaking: true
        })
      }
    }

    console.log('✅ 속보 수집 완료\n')
  }

  // 특정 카테고리 수집
  async collectByCategory(category: string): Promise<void> {
    console.log(`📂 ${category} 카테고리 뉴스 수집...\n`)

    const sources = getCategorySources(category)

    for (const source of sources) {
      const items = await this.parser.fetchFeed(source)

      for (const item of items) {
        await newsService.saveNews({
          title: item.title,
          url: item.link,
          summary: item.contentSnippet || '',
          source: source.name,
          category: category,
          publishedAt: item.pubDate,
          imageUrl: item.imageUrl,
          isBreaking: false
        })
      }
    }

    console.log(`✅ ${category} 수집 완료\n`)
  }

  // 오래된 뉴스 정리
  async cleanOldNews(days: number = 7): Promise<void> {
    console.log(`🧹 ${days}일 이상 오래된 뉴스 삭제 중...`)

    const deletedCount = await newsService.deleteOldNews(days)

    console.log(`✅ ${deletedCount}개 뉴스 삭제 완료\n`)
  }
}

export const rssCollector = new RSSCollector()

// Vercel Cron Job용 wrapper 함수
export async function collectAllRSS() {
  const startTime = Date.now()

  try {
    await rssCollector.collectAll()
    await rssCollector.cleanOldNews(7)

    return {
      success: true,
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString()
    }
  }
}
