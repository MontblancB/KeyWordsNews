import Parser from 'rss-parser'
import { NewsItem } from '@/types/news'

const parser = new Parser()

/**
 * 실시간 Google News RSS 검색
 * 사용자가 검색한 키워드로 Google News를 실시간 검색
 */
export async function searchGoogleNewsRealtime(
  keyword: string,
  lang: string = 'ko'
): Promise<NewsItem[]> {
  try {
    const encodedKeyword = encodeURIComponent(keyword)
    const url = `https://news.google.com/rss/search?q=${encodedKeyword}&hl=${lang}&gl=KR&ceid=KR:${lang}`

    console.log(`🔍 Google News 실시간 검색: "${keyword}"`)

    const feed = await parser.parseURL(url)

    const results: NewsItem[] = feed.items.map((item) => {
      // Google News RSS에서 이미지 추출 (없을 수 있음)
      let imageUrl: string | undefined = undefined

      // enclosure에서 이미지 추출
      if (item.enclosure?.url) {
        imageUrl = item.enclosure.url
      }

      // contentSnippet 또는 content에서 요약 추출
      const summary = (item.contentSnippet || item.content || '')
        .replace(/<[^>]*>/g, '') // HTML 태그 제거
        .replace(/&nbsp;/g, ' ')
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .trim()
        .slice(0, 200) // 200자로 제한

      return {
        id: `google-${item.guid || item.link}`, // 임시 ID (DB 저장하지 않음)
        title: item.title || '',
        url: item.link || '',
        summary: summary || item.title || '',
        source: 'Google News',
        category: 'general',
        publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
        imageUrl,
        isBreaking: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    console.log(`✅ Google News 실시간 검색 완료: ${results.length}건`)

    return results
  } catch (error: any) {
    console.error(`❌ Google News 실시간 검색 실패 (${keyword}):`, error.message)
    return []
  }
}

/**
 * 뉴스 중복 제거 (URL 기준)
 */
export function removeDuplicateNews(newsArray: NewsItem[]): NewsItem[] {
  const urlSet = new Set<string>()
  const uniqueNews: NewsItem[] = []

  for (const news of newsArray) {
    if (!urlSet.has(news.url)) {
      urlSet.add(news.url)
      uniqueNews.push(news)
    }
  }

  return uniqueNews
}

/**
 * 하이브리드 검색: DB 검색 + Google News 실시간 검색
 */
export async function hybridSearch(
  keyword: string,
  dbResults: NewsItem[]
): Promise<NewsItem[]> {
  // Google News 실시간 검색
  const googleResults = await searchGoogleNewsRealtime(keyword)

  // 두 결과 병합
  const combined = [...googleResults, ...dbResults]

  // 중복 제거 (URL 기준)
  const unique = removeDuplicateNews(combined)

  // 최신순 정렬
  unique.sort((a, b) => {
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  })

  console.log(`📊 하이브리드 검색 결과: Google ${googleResults.length}건 + DB ${dbResults.length}건 → 총 ${unique.length}건 (중복 제거 후)`)

  return unique
}

/**
 * 카테고리별 키워드 매핑
 */
const CATEGORY_KEYWORDS: Record<string, string> = {
  general: '뉴스',
  politics: '정치 OR 국회 OR 대통령',
  economy: '경제 OR 증시 OR 금융',
  society: '사회 OR 교육 OR 환경',
  world: '국제 OR 해외 OR 글로벌',
  tech: '과학 OR 기술 OR AI',
  sports: '스포츠 OR 축구 OR 야구',
  entertainment: '연예 OR 영화 OR 드라마',
  culture: '문화 OR 전시 OR 공연',
}

/**
 * 카테고리별 Google News 실시간 검색
 */
export async function searchGoogleNewsByCategory(
  category: string,
  lang: string = 'ko'
): Promise<NewsItem[]> {
  const keyword = CATEGORY_KEYWORDS[category] || category

  try {
    const encodedKeyword = encodeURIComponent(keyword)
    const url = `https://news.google.com/rss/search?q=${encodedKeyword}&hl=${lang}&gl=KR&ceid=KR:${lang}`

    console.log(`🔍 Google News 카테고리 검색: "${category}" (키워드: "${keyword}")`)

    const feed = await parser.parseURL(url)

    const results: NewsItem[] = feed.items.map((item) => {
      let imageUrl: string | undefined = undefined

      if (item.enclosure?.url) {
        imageUrl = item.enclosure.url
      }

      const summary = (item.contentSnippet || item.content || '')
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .trim()
        .slice(0, 200)

      return {
        id: `google-${category}-${item.guid || item.link}`,
        title: item.title || '',
        url: item.link || '',
        summary: summary || item.title || '',
        source: 'Google News',
        category: category,
        publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
        imageUrl,
        isBreaking: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    console.log(`✅ Google News 카테고리 검색 완료: ${results.length}건`)

    return results
  } catch (error: any) {
    console.error(`❌ Google News 카테고리 검색 실패 (${category}):`, error.message)
    return []
  }
}

/**
 * 하이브리드 카테고리 검색: DB + Google News 실시간
 */
export async function hybridCategorySearch(
  category: string,
  dbResults: NewsItem[]
): Promise<NewsItem[]> {
  // Google News 실시간 검색
  const googleResults = await searchGoogleNewsByCategory(category)

  // 두 결과 병합
  const combined = [...googleResults, ...dbResults]

  // 중복 제거
  const unique = removeDuplicateNews(combined)

  // 최신순 정렬
  unique.sort((a, b) => {
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  })

  console.log(`📊 하이브리드 카테고리 검색 결과: Google ${googleResults.length}건 + DB ${dbResults.length}건 → 총 ${unique.length}건 (중복 제거 후)`)

  return unique
}
