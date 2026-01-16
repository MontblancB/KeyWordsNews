import * as cheerio from 'cheerio'

/**
 * 뉴스 본문 크롤링 에러
 */
export class ScrapingError extends Error {
  constructor(message: string, public url?: string) {
    super(message)
    this.name = 'ScrapingError'
  }
}

/**
 * 주요 한국 언론사별 본문 선택자 매핑
 */
const CONTENT_SELECTORS: Record<string, string[]> = {
  // 연합뉴스
  'yna.co.kr': ['article', '.article-txt', '#articleText'],

  // 뉴시스
  'newsis.com': ['#textBody', '.viewer', 'article'],

  // 네이버 뉴스
  'naver.com': ['#dic_area', '#articeBody', 'article'],

  // 조선일보
  'chosun.com': ['.article-body', '#news_body_id', 'article'],

  // 동아일보
  'donga.com': ['.article_txt', '.news_view', 'article'],

  // 중앙일보
  'joongang.co.kr': ['#article_body', '.article_body', 'article'],

  // 한국경제
  'hankyung.com': ['.article-body', '.newsView', 'article'],

  // 매일경제
  'mk.co.kr': ['.news_cnt_detail_wrap', '.art_txt', 'article'],

  // 서울경제
  'sedaily.com': ['.article_view', '.txt_area', 'article'],

  // 한겨레
  'hani.co.kr': ['.article-text', '.text', 'article'],

  // 경향신문
  'khan.co.kr': ['.art_body', '.article_body', 'article'],

  // SBS
  'sbs.co.kr': ['.text_area', 'article', '.article_cont'],

  // KBS
  'kbs.co.kr': ['.article-body', '#cont_newstext', 'article'],

  // MBC
  'imbc.com': ['.news-view-con', '.view_con', 'article'],

  // JTBC
  'jtbc.co.kr': ['.article_content', 'article', '.article_body'],

  // YTN
  'ytn.co.kr': ['.article-txt', '#CmAdContent', 'article'],

  // 전자신문
  'etnews.com': ['.article_txt', '.article_body', 'article'],

  // 디지털타임스
  'dt.co.kr': ['.article_view', 'article'],

  // 아주경제
  'ajunews.com': ['.article_txt_content', 'article'],

  // 뉴스1
  'news1.kr': ['.article-body', 'article'],

  // 헤럴드경제
  'heraldcorp.com': ['.article_view', 'article'],

  // 머니투데이
  'mt.co.kr': ['.view_con', 'article'],

  // 기본 선택자 (모든 사이트)
  default: [
    'article',
    '[itemprop="articleBody"]',
    '.article-body',
    '.article_body',
    '.article-content',
    '.article_content',
    '.news-content',
    '.news_content',
    '#articleBody',
    '#article_body',
    '.content',
  ],
}

/**
 * URL에서 도메인 추출
 */
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname
  } catch {
    return ''
  }
}

/**
 * 도메인에 맞는 선택자 가져오기
 */
function getSelectorsForDomain(url: string): string[] {
  const domain = extractDomain(url)

  // 도메인 매칭 (서브도메인 포함)
  for (const [key, selectors] of Object.entries(CONTENT_SELECTORS)) {
    if (domain.includes(key)) {
      return [...selectors, ...CONTENT_SELECTORS.default]
    }
  }

  return CONTENT_SELECTORS.default
}

/**
 * HTML에서 불필요한 요소 제거
 */
function cleanContent($: cheerio.CheerioAPI, element: cheerio.Cheerio<any>): void {
  // 제거할 요소들
  const removeSelectors = [
    'script',
    'style',
    'iframe',
    'noscript',
    'aside',
    'nav',
    'header',
    'footer',
    '.ad',
    '.advertisement',
    '.related-article',
    '.copyright',
    '.share-buttons',
    '.social-share',
    '[class*="ad-"]',
    '[class*="banner"]',
    '[id*="ad-"]',
    '[id*="banner"]',
  ]

  removeSelectors.forEach((selector) => {
    element.find(selector).remove()
  })
}

/**
 * 뉴스 본문 크롤링
 * @param url 뉴스 URL
 * @param maxLength 최대 텍스트 길이 (기본: 2000자)
 * @returns 본문 텍스트
 */
export async function scrapeNewsContent(
  url: string,
  maxLength: number = 2000
): Promise<string> {
  try {
    // User-Agent 설정 (크롤링 방지 우회)
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      signal: AbortSignal.timeout(10000), // 10초 타임아웃
    })

    if (!response.ok) {
      throw new ScrapingError(
        `Failed to fetch: ${response.status} ${response.statusText}`,
        url
      )
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    // 도메인별 선택자 가져오기
    const selectors = getSelectorsForDomain(url)

    // 선택자를 순회하며 본문 찾기
    for (const selector of selectors) {
      const element = $(selector).first()

      if (element.length > 0) {
        // 불필요한 요소 제거
        cleanContent($, element)

        // 텍스트 추출
        let content = element.text().trim()

        // 공백 정리 (연속된 공백, 줄바꿈을 하나로)
        content = content.replace(/\s+/g, ' ').trim()

        // 최소 길이 체크 (너무 짧으면 본문이 아닐 가능성)
        if (content.length >= 100) {
          // 최대 길이 제한
          if (content.length > maxLength) {
            content = content.slice(0, maxLength)
          }

          return content
        }
      }
    }

    // 모든 선택자 실패 시 body에서 추출
    const bodyText = $('body')
      .text()
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, maxLength)

    if (bodyText.length < 100) {
      throw new ScrapingError('Content too short or not found', url)
    }

    return bodyText
  } catch (error) {
    if (error instanceof ScrapingError) {
      throw error
    }

    if (error instanceof Error) {
      throw new ScrapingError(
        `Failed to scrape: ${error.message}`,
        url
      )
    }

    throw new ScrapingError('Unknown scraping error', url)
  }
}

/**
 * 여러 URL의 본문을 병렬로 크롤링
 * @param urls URL 배열
 * @param maxLength 최대 텍스트 길이
 * @returns 본문 텍스트 배열 (실패 시 null)
 */
export async function scrapeMultipleNews(
  urls: string[],
  maxLength: number = 2000
): Promise<(string | null)[]> {
  const results = await Promise.allSettled(
    urls.map((url) => scrapeNewsContent(url, maxLength))
  )

  return results.map((result) =>
    result.status === 'fulfilled' ? result.value : null
  )
}
