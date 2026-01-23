/**
 * KeywordAnalyzer
 *
 * 뉴스 키워드 추출 및 관계 분석 라이브러리
 * BubbleNow 기능을 위한 키워드 빈도, 공동 출현, 가중치 계산
 */

export interface KeywordData {
  id: string // 키워드 고유 ID
  text: string // 키워드 텍스트
  count: number // 언급 횟수
  value: number // 버블 크기 (가중치)
  newsIds: string[] // 관련 뉴스 ID 목록
  relatedKeywords: Record<string, number> // 상관관계 { keywordId: 공동출현횟수 }
}

export interface KeywordLink {
  source: string // 출발 키워드 ID
  target: string // 도착 키워드 ID
  strength: number // 연결 강도 (0-1)
}

export interface KeywordMapResult {
  keywords: KeywordData[]
  links: KeywordLink[]
  metadata: {
    totalNews: number
    totalKeywords: number
    generatedAt: string
  }
}

export class KeywordAnalyzer {
  /**
   * 뉴스 키워드 맵 생성
   * @param newsKeywords - Map<newsId, keywords[]>
   * @param topN - 상위 N개 키워드만 반환 (기본 50개)
   */
  static analyze(
    newsKeywords: Map<string, string[]>,
    topN: number = 50
  ): KeywordMapResult {
    // 1. 키워드 빈도 계산
    const frequencyMap = this.calculateFrequency(newsKeywords)

    // 2. 키워드별 뉴스 ID 매핑
    const newsIdMap = this.mapNewsIds(newsKeywords)

    // 3. 공동 출현 계산
    const cooccurrenceMap = this.calculateCooccurrence(newsKeywords)

    // 4. 키워드 데이터 생성
    const allKeywords = this.buildKeywordData(
      frequencyMap,
      newsIdMap,
      cooccurrenceMap,
      newsKeywords.size
    )

    // 5. 상위 N개 필터링
    const topKeywords = this.getTopKeywords(allKeywords, topN)

    // 6. 링크 생성
    const links = this.buildLinks(topKeywords)

    return {
      keywords: topKeywords,
      links,
      metadata: {
        totalNews: newsKeywords.size,
        totalKeywords: allKeywords.length,
        generatedAt: new Date().toISOString(),
      },
    }
  }

  /**
   * 키워드 빈도 계산
   */
  private static calculateFrequency(
    newsKeywords: Map<string, string[]>
  ): Map<string, number> {
    const frequencyMap = new Map<string, number>()

    for (const keywords of newsKeywords.values()) {
      const uniqueKeywords = new Set(keywords) // 중복 제거
      for (const keyword of uniqueKeywords) {
        const normalized = keyword.trim().toLowerCase()
        if (!normalized) continue

        frequencyMap.set(normalized, (frequencyMap.get(normalized) || 0) + 1)
      }
    }

    return frequencyMap
  }

  /**
   * 키워드별 뉴스 ID 매핑
   */
  private static mapNewsIds(
    newsKeywords: Map<string, string[]>
  ): Map<string, string[]> {
    const newsIdMap = new Map<string, string[]>()

    for (const [newsId, keywords] of newsKeywords.entries()) {
      const uniqueKeywords = new Set(keywords)
      for (const keyword of uniqueKeywords) {
        const normalized = keyword.trim().toLowerCase()
        if (!normalized) continue

        if (!newsIdMap.has(normalized)) {
          newsIdMap.set(normalized, [])
        }
        newsIdMap.get(normalized)!.push(newsId)
      }
    }

    return newsIdMap
  }

  /**
   * 키워드 공동 출현 계산 (같은 뉴스에 함께 등장)
   */
  private static calculateCooccurrence(
    newsKeywords: Map<string, string[]>
  ): Map<string, Map<string, number>> {
    const cooccurrenceMap = new Map<string, Map<string, number>>()

    for (const keywords of newsKeywords.values()) {
      const uniqueKeywords = Array.from(
        new Set(keywords.map((k) => k.trim().toLowerCase()))
      ).filter((k) => k)

      // 모든 키워드 쌍에 대해 공동 출현 기록
      for (let i = 0; i < uniqueKeywords.length; i++) {
        const keyword1 = uniqueKeywords[i]

        if (!cooccurrenceMap.has(keyword1)) {
          cooccurrenceMap.set(keyword1, new Map())
        }

        for (let j = i + 1; j < uniqueKeywords.length; j++) {
          const keyword2 = uniqueKeywords[j]

          // keyword1 -> keyword2
          const map1 = cooccurrenceMap.get(keyword1)!
          map1.set(keyword2, (map1.get(keyword2) || 0) + 1)

          // keyword2 -> keyword1 (양방향)
          if (!cooccurrenceMap.has(keyword2)) {
            cooccurrenceMap.set(keyword2, new Map())
          }
          const map2 = cooccurrenceMap.get(keyword2)!
          map2.set(keyword1, (map2.get(keyword1) || 0) + 1)
        }
      }
    }

    return cooccurrenceMap
  }

  /**
   * 키워드 가중치 계산 (TF-IDF 유사)
   */
  private static calculateWeight(
    frequency: number,
    totalNews: number
  ): number {
    // 빈도가 높을수록, 전체 뉴스 대비 비율이 적절할 때 높은 가중치
    // value = frequency * log(totalNews / frequency)
    const idf = Math.log(totalNews / frequency)
    return Math.round(frequency * idf * 10) / 10
  }

  /**
   * 키워드 데이터 생성
   */
  private static buildKeywordData(
    frequencyMap: Map<string, number>,
    newsIdMap: Map<string, string[]>,
    cooccurrenceMap: Map<string, Map<string, number>>,
    totalNews: number
  ): KeywordData[] {
    const keywordData: KeywordData[] = []

    for (const [keyword, count] of frequencyMap.entries()) {
      const newsIds = newsIdMap.get(keyword) || []
      const cooccurrence = cooccurrenceMap.get(keyword) || new Map()

      // 관련 키워드 객체 생성
      const relatedKeywords: Record<string, number> = {}
      for (const [relatedKeyword, coCount] of cooccurrence.entries()) {
        relatedKeywords[relatedKeyword] = coCount
      }

      keywordData.push({
        id: keyword,
        text: keyword,
        count,
        value: this.calculateWeight(count, totalNews),
        newsIds,
        relatedKeywords,
      })
    }

    return keywordData
  }

  /**
   * 상위 N개 키워드 필터링 (빈도 기준)
   */
  private static getTopKeywords(
    keywords: KeywordData[],
    limit: number
  ): KeywordData[] {
    return keywords
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map((kw, index) => ({
        ...kw,
        id: `kw-${index}`, // 고유 ID 재할당
      }))
  }

  /**
   * 키워드 간 링크 생성
   */
  private static buildLinks(keywords: KeywordData[]): KeywordLink[] {
    const links: KeywordLink[] = []
    const keywordMap = new Map(keywords.map((kw) => [kw.text, kw]))

    for (const keyword of keywords) {
      const related = keyword.relatedKeywords

      for (const [relatedText, coCount] of Object.entries(related)) {
        const relatedKeyword = keywordMap.get(relatedText)
        if (!relatedKeyword) continue // 상위 N개에 없으면 스킵

        // 연결 강도 계산: coCount / min(keyword.count, relatedKeyword.count)
        const strength =
          coCount / Math.min(keyword.count, relatedKeyword.count)

        // 중복 방지 (keyword -> related만 추가, related -> keyword는 스킵)
        if (keyword.id < relatedKeyword.id) {
          links.push({
            source: keyword.id,
            target: relatedKeyword.id,
            strength: Math.round(strength * 100) / 100, // 소수점 2자리
          })
        }
      }
    }

    // 연결 강도 상위 100개만 반환 (너무 많으면 시각화 복잡)
    return links.sort((a, b) => b.strength - a.strength).slice(0, 100)
  }

  /**
   * 키워드 정규화 (대소문자 통일, 공백 제거)
   */
  static normalizeKeyword(keyword: string): string {
    return keyword.trim().toLowerCase()
  }
}
