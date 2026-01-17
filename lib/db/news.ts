import { prisma } from './prisma'
import { NewsItem } from '@/types/news'

export class NewsService {
  // 뉴스 저장 (중복 시 업데이트)
  async saveNews(input: NewsItem): Promise<void> {
    try {
      await prisma.news.upsert({
        where: { url: input.url },
        update: {
          title: input.title,
          summary: input.summary,
          isBreaking: input.isBreaking || false,
          updatedAt: new Date()
        },
        create: {
          title: input.title,
          url: input.url,
          summary: input.summary,
          source: input.source,
          category: input.category,
          publishedAt: input.publishedAt,
          imageUrl: input.imageUrl,
          isBreaking: input.isBreaking || false
        }
      })
    } catch (error: any) {
      console.error('뉴스 저장 실패:', error.message)
    }
  }

  // 여러 뉴스 배치 저장
  async saveMultipleNews(newsItems: NewsItem[]): Promise<number> {
    let savedCount = 0
    for (const item of newsItems) {
      await this.saveNews(item)
      savedCount++
    }
    return savedCount
  }

  // 최신 속보 조회
  async getBreakingNews(limit: number = 10): Promise<NewsItem[]> {
    return await prisma.news.findMany({
      where: { isBreaking: true },
      orderBy: { publishedAt: 'desc' },
      take: limit
    })
  }

  // 카테고리별 뉴스 조회 (최신순)
  async getNewsByCategory(category: string, limit: number = 20, offset: number = 0): Promise<NewsItem[]> {
    return await prisma.news.findMany({
      where: { category },
      orderBy: { publishedAt: 'desc' },
      skip: offset,
      take: limit
    })
  }

  // 카테고리별 뉴스 개수
  async getCategoryNewsCount(category: string): Promise<number> {
    return await prisma.news.count({
      where: { category }
    })
  }

  // 전체 최신 뉴스
  async getLatestNews(limit: number = 20, offset: number = 0, sources?: string[]): Promise<NewsItem[]> {
    const whereClause = sources && sources.length > 0
      ? { source: { in: sources } }
      : {}

    return await prisma.news.findMany({
      where: whereClause,
      orderBy: { publishedAt: 'desc' },
      skip: offset,
      take: limit
    })
  }

  // 전체 뉴스 개수
  async getLatestNewsCount(sources?: string[]): Promise<number> {
    const whereClause = sources && sources.length > 0
      ? { source: { in: sources } }
      : {}

    return await prisma.news.count({ where: whereClause })
  }

  // 키워드 검색
  async searchNews(
    keyword: string,
    page: number = 1,
    limit: number = 30
  ): Promise<{ news: NewsItem[]; total: number; totalPages: number }> {
    const skip = (page - 1) * limit

    // SQLite에서는 contains가 기본적으로 대소문자 구분 안 함
    const [news, total] = await Promise.all([
      prisma.news.findMany({
        where: {
          OR: [
            { title: { contains: keyword } },
            { summary: { contains: keyword } }
          ]
        },
        orderBy: { publishedAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.news.count({
        where: {
          OR: [
            { title: { contains: keyword } },
            { summary: { contains: keyword } }
          ]
        }
      })
    ])

    console.log(`✅ 검색 결과: "${keyword}" - ${total}건`)

    return {
      news,
      total,
      totalPages: Math.ceil(total / limit)
    }
  }

  // 오래된 뉴스 삭제 (7일 이상)
  async deleteOldNews(days: number = 7): Promise<number> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    const result = await prisma.news.deleteMany({
      where: {
        publishedAt: {
          lt: cutoffDate
        }
      }
    })

    return result.count
  }
}

export const newsService = new NewsService()
