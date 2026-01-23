import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { KeywordAnalyzer } from '@/lib/keyword-analyzer'
import Groq from 'groq-sdk'

/**
 * POST /api/news/bubble
 *
 * BubbleNow API - 뉴스 키워드 버블맵 생성
 * 현재 리스트의 모든 뉴스로부터 키워드를 추출하고 관계 분석
 *
 * Body: {
 *   newsList: NewsItem[],  // 뉴스 전체 데이터 배열
 *   category?: string,
 *   keyword?: string,
 * }
 *
 * Response: {
 *   success: true,
 *   data: {
 *     keywords: [...],
 *     links: [...],
 *     metadata: {...}
 *   },
 *   cached: boolean,
 *   provider: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { newsList, category, keyword } = body

    // 1. 입력 검증
    if (!newsList || !Array.isArray(newsList) || newsList.length === 0) {
      return NextResponse.json(
        { error: 'newsList 배열이 필요합니다.' },
        { status: 400 }
      )
    }

    // 2. 중복 제거 및 뉴스 수 제한
    // 중복 통계 분석 (URL 기준)
    const urlCounts = new Map<string, number>()
    for (const news of newsList) {
      urlCounts.set(news.url, (urlCounts.get(news.url) || 0) + 1)
    }

    const duplicatedUrls = Array.from(urlCounts.entries())
      .filter(([_, count]) => count > 1)
      .sort((a, b) => b[1] - a[1])

    // URL 기준으로 중복 제거 (ID는 앞 32자만 잘린 Base64라서 부정확함)
    const uniqueNews = Array.from(
      new Map(newsList.map((n: any) => [n.url, n])).values()
    ).slice(0, 200)

    console.log(
      `[BubbleNow] 요청: ${newsList.length}개 뉴스 → 중복 제거 후 ${uniqueNews.length}개 (URL 기준)`
    )

    if (duplicatedUrls.length > 0) {
      console.log(
        `[BubbleNow] 중복 뉴스: ${duplicatedUrls.length}개 URL (최대 ${duplicatedUrls[0][1]}회 중복)`
      )
      console.log(
        `[BubbleNow] 중복 예시: ${duplicatedUrls.slice(0, 3).map(([url, count]) => `${url.slice(0, 40)}...(${count}회)`).join(', ')}`
      )
    }

    console.log(
      `[BubbleNow] 첫 5개 URL: ${JSON.stringify(uniqueNews.slice(0, 5).map((n: any) => n.url.slice(0, 40) + '...'))}`
    )

    // 3. 캐시 키 생성 (뉴스 개수 포함)
    const newsIds = uniqueNews.map((n: any) => n.id)
    const newsCount = uniqueNews.length
    const cacheKey = category
      ? `category:${category}:${newsCount}`
      : keyword
        ? `keyword:${keyword}:${newsCount}`
        : `custom:${newsIds.slice(0, 5).join(',')}:${newsCount}`

    // 4. 캐시 조회 (10분 이내)
    const cached = await prisma.keywordMap.findFirst({
      where: {
        cacheKey,
        expiresAt: {
          gte: new Date(),
        },
      },
    })

    if (cached) {
      console.log(`[BubbleNow] 캐시 hit: ${cacheKey}`)
      return NextResponse.json({
        success: true,
        data: cached.data,
        cached: true,
        provider: cached.provider,
      })
    }

    console.log(`[BubbleNow] 캐시 miss: ${cacheKey}`)

    // 5. 전달받은 뉴스 데이터 사용
    console.log(`[BubbleNow] 전달받은 뉴스: ${uniqueNews.length}개`)

    // 6. 키워드 추출
    const newsKeywordsMap = new Map<string, string[]>()
    const newsNeedingExtraction: Array<{
      id: string
      title: string
      summary: string
    }> = []

    for (const news of uniqueNews) {
      // 기존 키워드가 있으면 사용
      const existingKeywords = [
        ...(news.aiKeywords || []),
        ...(news.aiInsightKeywords || []),
      ]

      if (existingKeywords.length > 0) {
        newsKeywordsMap.set(news.id, existingKeywords)
      } else {
        // 키워드가 없으면 AI 추출 대상에 추가
        newsNeedingExtraction.push({
          id: news.id,
          title: news.title,
          summary: news.summary,
        })
      }
    }

    console.log(
      `[BubbleNow] 캐시된 키워드: ${newsKeywordsMap.size}개, AI 추출 필요: ${newsNeedingExtraction.length}개`
    )

    // 7. AI로 키워드 추출 (필요한 경우만)
    if (newsNeedingExtraction.length > 0) {
      try {
        const extractedKeywords = await extractKeywordsBatch(
          newsNeedingExtraction
        )

        // 결과 병합
        let successCount = 0
        for (const [newsId, keywords] of extractedKeywords.entries()) {
          if (keywords && keywords.length > 0) {
            newsKeywordsMap.set(newsId, keywords)
            successCount++
          }
        }

        console.log(
          `[BubbleNow] AI 추출 완료: ${extractedKeywords.size}개 중 ${successCount}개 성공`
        )
      } catch (error) {
        console.error('[BubbleNow] AI 추출 실패:', error)
        // 에러가 나도 기존 캐시된 키워드만으로 진행
      }
    }

    console.log(
      `[BubbleNow] 최종 키워드 보유 뉴스: ${newsKeywordsMap.size}개 / 전체 ${uniqueNews.length}개`
    )

    // 8. 키워드가 하나도 없으면 에러
    if (newsKeywordsMap.size === 0) {
      return NextResponse.json(
        {
          error:
            'AI 서비스 일일 사용량 한도에 도달했습니다. 내일 다시 시도해주세요.',
          details:
            'Groq 및 Gemini AI 서비스 모두 응답하지 않습니다. 약 7시간 후 자동으로 복구됩니다.',
        },
        { status: 503 }
      )
    }

    // 9. 키워드 분석
    const result = KeywordAnalyzer.analyze(newsKeywordsMap, 50)

    console.log(
      `[BubbleNow] 분석 완료: ${result.keywords.length}개 키워드, ${result.links.length}개 링크`
    )

    // 10. 캐시 저장 (10분 유효)
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 10)

    await prisma.keywordMap
      .create({
        data: {
          cacheKey,
          data: result as any, // JSON 타입
          newsCount: uniqueNews.length,
          generatedAt: new Date(),
          expiresAt,
          provider: 'groq',
        },
      })
      .catch((err) => console.error('[BubbleNow] 캐시 저장 실패:', err))

    // 11. 응답
    return NextResponse.json({
      success: true,
      data: result,
      cached: false,
      provider: 'groq',
    })
  } catch (error) {
    console.error('[BubbleNow API Error]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * AI로 키워드 배치 추출
 * 10개씩 묶어서 병렬 처리
 */
async function extractKeywordsBatch(
  newsList: Array<{ id: string; title: string; summary: string }>
): Promise<Map<string, string[]>> {
  const BATCH_SIZE = 10
  const batches: Array<typeof newsList> = []

  // 배치로 나누기
  for (let i = 0; i < newsList.length; i += BATCH_SIZE) {
    batches.push(newsList.slice(i, i + BATCH_SIZE))
  }

  console.log(`[BubbleNow] AI 추출: ${batches.length}개 배치로 분할`)

  // 병렬 처리
  const results = await Promise.all(
    batches.map((batch, index) =>
      extractKeywordsForBatch(batch).catch((error) => {
        console.error(`[BubbleNow] 배치 ${index + 1}/${batches.length} 실패:`, error)
        return new Map<string, string[]>() // 실패 시 빈 맵 반환
      })
    )
  )

  // 결과 병합
  const allKeywords = new Map<string, string[]>()
  let totalExtracted = 0
  results.forEach((result, index) => {
    const count = result.size
    totalExtracted += count
    console.log(`[BubbleNow] 배치 ${index + 1}/${batches.length}: ${count}개 추출 성공`)
    for (const [newsId, keywords] of result.entries()) {
      allKeywords.set(newsId, keywords)
    }
  })

  console.log(`[BubbleNow] 총 ${totalExtracted}개 뉴스에서 키워드 추출 성공`)

  return allKeywords
}

/**
 * 단일 배치의 키워드 추출
 */
async function extractKeywordsForBatch(
  batch: Array<{ id: string; title: string; summary: string }>
): Promise<Map<string, string[]>> {
  const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  })

  // 프롬프트 생성
  const newsTexts = batch
    .map(
      (news, index) =>
        `뉴스 ${index}:\n제목: ${news.title}\n요약: ${news.summary}`
    )
    .join('\n\n')

  const prompt = `다음 뉴스 목록에서 각 뉴스의 핵심 키워드 3-5개를 추출해주세요.

${newsTexts}

**키워드 추출 기준:**
- 뉴스의 핵심 주제나 개념을 나타내는 단어
- 검색이나 분류에 유용한 단어
- 한글로만 작성 (외국어 금지)
- 고유명사, 전문용어, 핵심 개념 위주

**출력 형식 (반드시 JSON 배열):**
{
  "results": [
    { "index": 0, "keywords": ["키워드1", "키워드2", "키워드3"] },
    { "index": 1, "keywords": ["키워드4", "키워드5", "키워드6"] },
    ...
  ]
}

CRITICAL RULES:
1. index는 0부터 시작합니다
2. 반드시 모든 뉴스(0부터 N-1까지)에 대해 결과를 반환해야 합니다
3. 각 index는 정확히 1번만 나타나야 합니다 (중복 금지!)
4. index 순서는 상관없지만, 모든 index가 포함되어야 합니다
`

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content:
            '당신은 뉴스 키워드 추출 전문가입니다. 각 뉴스의 핵심 키워드를 정확하게 추출합니다.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    })

    const content = response.choices[0]?.message?.content || ''
    const result: { results: Array<{ index: number; keywords: string[] }> } =
      JSON.parse(content)

    // 중복 index 감지 및 제거 (첫 번째만 사용)
    const seenIndices = new Set<number>()
    const uniqueResults: Array<{ index: number; keywords: string[] }> = []
    let duplicateCount = 0

    for (const item of result.results || []) {
      if (seenIndices.has(item.index)) {
        duplicateCount++
        continue
      }
      seenIndices.add(item.index)
      uniqueResults.push(item)
    }

    if (duplicateCount > 0) {
      console.log(
        `[BubbleNow] Groq 중복 index 제거: ${duplicateCount}개 (${result.results?.length || 0}개 → ${uniqueResults.length}개)`
      )
    }

    // 인덱스 기반으로 실제 뉴스 ID와 매칭
    const keywordsMap = new Map<string, string[]>()
    let skippedCount = 0
    const skipReasons: string[] = []

    for (const item of uniqueResults) {
      const newsId = batch[item.index]?.id

      if (!newsId) {
        skippedCount++
        skipReasons.push(`index ${item.index} 범위 초과 (배치 크기: ${batch.length})`)
        continue
      }

      if (!item.keywords || item.keywords.length === 0) {
        skippedCount++
        skipReasons.push(`index ${item.index} 키워드 비어있음`)
        continue
      }

      keywordsMap.set(newsId, item.keywords)
    }

    console.log(
      `[BubbleNow] Groq 배치 결과: ${uniqueResults.length}개 고유 응답, ${keywordsMap.size}개 매칭 성공, ${skippedCount}개 스킵`
    )
    if (skipReasons.length > 0) {
      console.log(`[BubbleNow] 스킵 이유: ${skipReasons.slice(0, 3).join(', ')}${skipReasons.length > 3 ? '...' : ''}`)
    }

    return keywordsMap
  } catch (error) {
    console.error('[BubbleNow] Groq 키워드 추출 실패:', error)

    // Fallback: Gemini 시도
    try {
      return await extractKeywordsWithGemini(batch)
    } catch (geminiError) {
      console.error('[BubbleNow] Gemini 키워드 추출 실패:', geminiError)
      return new Map() // 빈 맵 반환
    }
  }
}

/**
 * Gemini로 키워드 추출 (폴백)
 */
async function extractKeywordsWithGemini(
  batch: Array<{ id: string; title: string; summary: string }>
): Promise<Map<string, string[]>> {
  const newsTexts = batch
    .map(
      (news, index) =>
        `뉴스 ${index}:\n제목: ${news.title}\n요약: ${news.summary}`
    )
    .join('\n\n')

  const prompt = `다음 뉴스 목록에서 각 뉴스의 핵심 키워드 3-5개를 추출해주세요.

${newsTexts}

**키워드 추출 기준:**
- 뉴스의 핵심 주제나 개념을 나타내는 단어
- 검색이나 분류에 유용한 단어
- 한글로만 작성 (외국어 금지)
- 고유명사, 전문용어, 핵심 개념 위주

**출력 형식 (반드시 JSON 배열):**
{
  "results": [
    { "index": 0, "keywords": ["키워드1", "키워드2", "키워드3"] },
    { "index": 1, "keywords": ["키워드4", "키워드5", "키워드6"] },
    ...
  ]
}

CRITICAL RULES:
1. index는 0부터 시작합니다
2. 반드시 모든 뉴스(0부터 N-1까지)에 대해 결과를 반환해야 합니다
3. 각 index는 정확히 1번만 나타나야 합니다 (중복 금지!)
4. index 순서는 상관없지만, 모든 index가 포함되어야 합니다
`

  const baseUrl = 'https://generativelanguage.googleapis.com/v1beta'
  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp'

  const response = await fetch(`${baseUrl}/models/${model}:generateContent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': process.env.GEMINI_API_KEY || '',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 2000,
        responseMimeType: 'application/json',
        responseJsonSchema: {
          type: 'object',
          properties: {
            results: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  index: { type: 'integer' },
                  keywords: {
                    type: 'array',
                    items: { type: 'string' },
                  },
                },
                required: ['index', 'keywords'],
              },
            },
          },
          required: ['results'],
        },
      },
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      `Gemini API error: ${response.status} - ${JSON.stringify(errorData)}`
    )
  }

  const data = await response.json()
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

  if (!content) {
    throw new Error('Gemini returned empty response')
  }

  const result: { results: Array<{ index: number; keywords: string[] }> } =
    JSON.parse(content)

  // 중복 index 감지 및 제거 (첫 번째만 사용)
  const seenIndices = new Set<number>()
  const uniqueResults: Array<{ index: number; keywords: string[] }> = []
  let duplicateCount = 0

  for (const item of result.results || []) {
    if (seenIndices.has(item.index)) {
      duplicateCount++
      continue
    }
    seenIndices.add(item.index)
    uniqueResults.push(item)
  }

  if (duplicateCount > 0) {
    console.log(
      `[BubbleNow] Gemini 중복 index 제거: ${duplicateCount}개 (${result.results?.length || 0}개 → ${uniqueResults.length}개)`
    )
  }

  // 인덱스 기반으로 실제 뉴스 ID와 매칭
  const keywordsMap = new Map<string, string[]>()
  let skippedCount = 0
  const skipReasons: string[] = []

  for (const item of uniqueResults) {
    const newsId = batch[item.index]?.id

    if (!newsId) {
      skippedCount++
      skipReasons.push(`index ${item.index} 범위 초과 (배치 크기: ${batch.length})`)
      continue
    }

    if (!item.keywords || item.keywords.length === 0) {
      skippedCount++
      skipReasons.push(`index ${item.index} 키워드 비어있음`)
      continue
    }

    keywordsMap.set(newsId, item.keywords)
  }

  console.log(
    `[BubbleNow] Gemini 배치 결과: ${uniqueResults.length}개 고유 응답, ${keywordsMap.size}개 매칭 성공, ${skippedCount}개 스킵`
  )
  if (skipReasons.length > 0) {
    console.log(`[BubbleNow] 스킵 이유: ${skipReasons.slice(0, 3).join(', ')}${skipReasons.length > 3 ? '...' : ''}`)
  }

  return keywordsMap
}
