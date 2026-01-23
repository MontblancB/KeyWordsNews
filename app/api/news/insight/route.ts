import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { prisma } from '@/lib/prisma'
import { scrapeNewsContent } from '@/lib/scraper/newsContent'

interface InsightResult {
  insight: string
  expert: string
  keywords?: string[]
}

// 카테고리별 전문가 설정
const CATEGORY_EXPERTS: Record<string, { name: string; expertise: string; perspective: string }> = {
  politics: {
    name: '정치 전문 애널리스트',
    expertise: '정치학 박사, 20년 경력의 정치 기자 출신으로 국내외 정치 동향, 정책 분석, 선거 전략에 정통합니다.',
    perspective: '정치적 역학관계, 정책의 실효성, 여론의 흐름, 향후 정치 지형 변화를 중심으로 분석합니다.',
  },
  economy: {
    name: '경제 전문 애널리스트',
    expertise: '경제학 박사, 월가 투자은행 출신으로 거시경제, 금융시장, 기업 분석에 정통합니다.',
    perspective: '시장에 미치는 영향, 투자 시사점, 산업 트렌드, 정책의 경제적 파급효과를 중심으로 분석합니다.',
  },
  society: {
    name: '사회 전문 애널리스트',
    expertise: '사회학 박사, 시민단체 활동가 출신으로 사회 현상, 인구 변화, 사회 갈등에 정통합니다.',
    perspective: '사회 구조적 원인, 시민 생활에 미치는 영향, 세대/계층 간 갈등을 중심으로 분석합니다.',
  },
  world: {
    name: '국제 전문 애널리스트',
    expertise: '국제관계학 박사, 외교부 출신으로 국제 정세, 지정학, 글로벌 이슈에 정통합니다.',
    perspective: '국제 역학관계, 지정학적 의미, 한국에 미치는 영향을 중심으로 분석합니다.',
  },
  tech: {
    name: 'IT/과학 전문 애널리스트',
    expertise: '컴퓨터공학 박사, 실리콘밸리 테크기업 출신으로 기술 혁신, AI, 스타트업 생태계에 정통합니다.',
    perspective: '기술의 혁신성, 시장 파괴력, 사회적 영향, 미래 기술 트렌드를 중심으로 분석합니다.',
  },
  sports: {
    name: '스포츠 전문 애널리스트',
    expertise: '체육학 박사, 전직 프로선수 출신으로 각종 스포츠, 선수 분석, 스포츠 산업에 정통합니다.',
    perspective: '경기력 분석, 팀/선수의 전략, 스포츠 산업 동향을 중심으로 분석합니다.',
  },
  entertainment: {
    name: '연예 전문 애널리스트',
    expertise: '문화콘텐츠학 박사, 엔터테인먼트 업계 경력으로 K-POP, 드라마, 영화 산업에 정통합니다.',
    perspective: '콘텐츠의 완성도, 시장 반응, 아티스트의 성장, 한류 트렌드를 중심으로 분석합니다.',
  },
  culture: {
    name: '문화 전문 애널리스트',
    expertise: '문화인류학 박사, 문화재단 출신으로 예술, 전통문화, 문화정책에 정통합니다.',
    perspective: '문화적 가치, 예술적 의미, 전통과 현대의 조화를 중심으로 분석합니다.',
  },
  general: {
    name: '수석 뉴스 애널리스트',
    expertise: '다양한 분야에 정통한 멀티 분야 전문가로, 복잡한 이슈를 쉽게 설명하는 능력이 뛰어납니다.',
    perspective: '다양한 관점에서 이슈의 본질을 파악하고 독자에게 균형 잡힌 시각을 제공합니다.',
  },
}

// 전문가 선택 함수
function getExpert(category: string): { name: string; expertise: string; perspective: string } {
  return CATEGORY_EXPERTS[category] || CATEGORY_EXPERTS['general']
}

// 시스템 프롬프트 생성
function getSystemPrompt(expert: { name: string; expertise: string; perspective: string }): string {
  return `당신은 **${expert.name}**입니다.

**당신의 전문성:**
${expert.expertise}

**당신의 분석 관점:**
${expert.perspective}

**분석 원칙:**
- 해당 분야의 전문 지식을 바탕으로 깊이 있는 분석을 제공합니다
- **오직 한국어로만 작성** (영어, 중국어, 일본어 등 외국어 단어 절대 사용 금지)
- 외래어나 영어 약어는 반드시 한글로 풀어서 설명 (예: AI→인공지능, GDP→국내총생산)
- 일반인도 이해할 수 있는 쉬운 순우리말로 설명합니다
- 한자어 대신 일상 표현을 사용합니다
- 구체적인 수치와 사실을 근거로 분석합니다
- 각 항목은 1-2줄로 핵심만 축약해서 작성합니다

답변은 반드시 JSON 형식으로 작성합니다.`
}

// 사용자 프롬프트 생성
function createPrompt(title: string, content: string, expert: { name: string }): string {
  return `다음 뉴스에 대해 ${expert.name}로서 전문적인 의견을 제공해주세요.

**뉴스 제목:** ${title}

**뉴스 내용:**
${content}

---

**분석 요청:**

1. **📌 배경/맥락** (1-2줄)
   - 이 뉴스가 나온 배경과 맥락

2. **📊 전문가 분석** (2-3줄)
   - 이 뉴스의 핵심 의미와 영향
   - 일반인이 놓치기 쉬운 중요한 점

3. **⚡ 핵심 시사점** (1-2줄)
   - 독자가 반드시 알아야 할 핵심 포인트

4. **🔮 전망** (1줄)
   - 향후 예상되는 전개 방향

**중요 지침:**
- **오직 한국어로만 작성** (영어나 외국어 단어 절대 금지)
- 외래어/영어 약어는 한글로 풀어쓰기 (예: CEO→최고경영자, AI→인공지능)
- 쉬운 순우리말 사용 (한자어 대신 일상 표현)
- 구체적인 수치와 사실을 근거로 분석
- 각 항목은 지정된 줄 수로 핵심만 축약

**출력 형식 (반드시 JSON):**
{
  "insight": "📌 **배경/맥락**\\n• (1-2줄)\\n\\n📊 **전문가 분석**\\n• (2-3줄)\\n\\n⚡ **핵심 시사점**\\n• (1-2줄)\\n\\n🔮 **전망**\\n• (1줄)",
  "keywords": ["핵심키워드1", "핵심키워드2", "핵심키워드3"]
}

**키워드 선정 기준:**
- 이 뉴스의 핵심 개념이나 쟁점을 나타내는 단어 3-5개
- 검색이나 분류에 유용한 단어
- 한글로만 작성 (외국어 금지)`
}

// Groq API 호출
async function generateWithGroq(prompt: string, systemPrompt: string): Promise<InsightResult> {
  const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  })

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    temperature: 0.4,
    max_tokens: 2000,
    response_format: { type: 'json_object' },
  })

  const content = response.choices[0]?.message?.content || ''

  let result: { insight: string; keywords?: string[] } | null = null

  try {
    result = JSON.parse(content)
  } catch {
    // 정규식으로 insight 추출 시도
    const insightMatch = content.match(/"insight"\s*:\s*"((?:[^"\\]|\\["\\nrt])*)"/)
    if (insightMatch) {
      const extractedInsight = insightMatch[1]
        .replace(/\\n/g, '\n')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\')
      result = { insight: extractedInsight }
    }
  }

  if (!result || !result.insight) {
    throw new Error('Failed to parse insight from response')
  }

  return {
    insight: result.insight,
    expert: '',
    keywords: result.keywords || []
  }
}

// Gemini API 호출
async function generateWithGemini(prompt: string, systemPrompt: string): Promise<InsightResult> {
  const baseUrl = 'https://generativelanguage.googleapis.com/v1beta'
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash'

  const response = await fetch(
    `${baseUrl}/models/${model}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY || '',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: `${systemPrompt}\n\n${prompt}` }],
          },
        ],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 2000,
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'object',
            properties: {
              insight: { type: 'string' },
              keywords: {
                type: 'array',
                items: { type: 'string' },
                description: '핵심 키워드 3-5개'
              }
            },
            required: ['insight', 'keywords'],
          },
        },
      }),
    }
  )

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(`Gemini API error: ${response.status} - ${JSON.stringify(errorData)}`)
  }

  const data = await response.json()
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

  let result: { insight: string; keywords?: string[] } | null = null

  try {
    result = JSON.parse(content)
  } catch {
    const insightMatch = content.match(/"insight"\s*:\s*"((?:[^"\\]|\\["\\nrt])*)"/)
    if (insightMatch) {
      const extractedInsight = insightMatch[1]
        .replace(/\\n/g, '\n')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\')
      result = { insight: extractedInsight }
    }
  }

  if (!result || !result.insight) {
    throw new Error('Failed to parse insight from Gemini response')
  }

  return {
    insight: result.insight,
    expert: '',
    keywords: result.keywords || []
  }
}

// OpenRouter API 호출
async function generateWithOpenRouter(prompt: string, systemPrompt: string): Promise<InsightResult> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.VERCEL_APP_URL || 'http://localhost:3000',
      'X-Title': 'KeyWordsNews',
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.1-70b-instruct:free',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: 0.4,
      max_tokens: 2000,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(`OpenRouter API error: ${response.status} - ${JSON.stringify(errorData)}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content || ''

  let result: { insight: string; keywords?: string[] } | null = null

  // JSON 추출 (마크다운 코드 블록 처리)
  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    try {
      result = JSON.parse(jsonMatch[0])
    } catch {
      // 정규식으로 추출
      const insightMatch = content.match(/"insight"\s*:\s*"((?:[^"\\]|\\["\\nrt])*)"/)
      if (insightMatch) {
        const extractedInsight = insightMatch[1]
          .replace(/\\n/g, '\n')
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\')
        result = { insight: extractedInsight }
      }
    }
  }

  if (!result || !result.insight) {
    throw new Error('Failed to parse insight from OpenRouter response')
  }

  return {
    insight: result.insight,
    expert: '',
    keywords: result.keywords || []
  }
}

/**
 * POST /api/news/insight
 *
 * 개별 뉴스에 대한 전문가 의견 생성 API
 * 뉴스의 카테고리에 맞는 전문가 관점에서 분석을 제공합니다.
 * Fallback 순서: Groq -> Gemini -> OpenRouter
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { newsId, url, title, summary, category } = body

    // 유효성 검사
    if (!newsId && !url) {
      return NextResponse.json(
        { error: 'newsId 또는 url이 필요합니다.' },
        { status: 400 }
      )
    }

    // DB에서 뉴스 조회 (캐시 확인)
    let news = null
    if (newsId) {
      news = await prisma.news.findUnique({
        where: { id: newsId },
      })

      // 캐시된 인사이트가 있으면 반환
      if (news?.aiInsight) {
        console.log('[NewsInsight] Returning cached insight')
        return NextResponse.json({
          success: true,
          data: {
            insight: news.aiInsight,
            expert: news.aiInsightExpert || '',
            keywords: news.aiInsightKeywords || [],
          },
          provider: news.aiInsightProvider || 'cached',
          cached: true,
        })
      }
    }

    // 뉴스 본문 가져오기
    let newsContent = ''
    const newsUrl = news?.url || url
    const newsTitle = news?.title || title
    const newsCategory = news?.category || category || 'general'

    if (newsUrl) {
      try {
        const scraped = await scrapeNewsContent(newsUrl)
        if (scraped && scraped.length > 100) {
          newsContent = scraped.slice(0, 3000)
        }
      } catch (error) {
        console.error('[NewsInsight] Scraping failed:', error)
      }
    }

    // 스크래핑 실패 시 summary 사용
    if (!newsContent || newsContent.length < 100) {
      const fallbackSummary = news?.summary || summary
      if (fallbackSummary && fallbackSummary.length > 50) {
        newsContent = fallbackSummary
      } else {
        return NextResponse.json(
          { error: '뉴스 본문을 가져올 수 없습니다.' },
          { status: 400 }
        )
      }
    }

    // 전문가 선택 및 프롬프트 생성
    const expert = getExpert(newsCategory)
    const systemPrompt = getSystemPrompt(expert)
    const prompt = createPrompt(newsTitle, newsContent, expert)

    let result: InsightResult
    let provider: string = 'groq'
    const providerAttempts: { provider: string; error: string }[] = []

    // 1차 시도: Groq
    if (process.env.GROQ_API_KEY) {
      try {
        console.log('[NewsInsight] Trying Groq...')
        result = await generateWithGroq(prompt, systemPrompt)
        result.expert = expert.name

        // DB에 저장 (newsId가 있는 경우)
        if (newsId && news) {
          await prisma.news.update({
            where: { id: newsId },
            data: {
              aiInsight: result.insight,
              aiInsightExpert: expert.name,
              aiInsightKeywords: result.keywords || [],
              aiInsightAt: new Date(),
              aiInsightProvider: 'groq',
            },
          }).catch((err: unknown) => console.error('[NewsInsight] DB save failed:', err))
        }

        return NextResponse.json({
          success: true,
          data: result,
          provider,
          cached: false,
        })
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        console.error('[NewsInsight] Groq failed:', errorMsg)
        providerAttempts.push({ provider: 'Groq', error: errorMsg })
      }
    } else {
      providerAttempts.push({ provider: 'Groq', error: 'API 키 미설정' })
    }

    // 2차 시도: Gemini
    if (process.env.GEMINI_API_KEY) {
      try {
        console.log('[NewsInsight] Falling back to Gemini...')
        provider = 'gemini'
        result = await generateWithGemini(prompt, systemPrompt)
        result.expert = expert.name

        if (newsId && news) {
          await prisma.news.update({
            where: { id: newsId },
            data: {
              aiInsight: result.insight,
              aiInsightExpert: expert.name,
              aiInsightKeywords: result.keywords || [],
              aiInsightAt: new Date(),
              aiInsightProvider: 'gemini',
            },
          }).catch((err: unknown) => console.error('[NewsInsight] DB save failed:', err))
        }

        return NextResponse.json({
          success: true,
          data: result,
          provider,
          cached: false,
        })
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        console.error('[NewsInsight] Gemini failed:', errorMsg)
        providerAttempts.push({ provider: 'Gemini', error: errorMsg })
      }
    } else {
      providerAttempts.push({ provider: 'Gemini', error: 'API 키 미설정' })
    }

    // 3차 시도: OpenRouter
    if (process.env.OPENROUTER_API_KEY) {
      try {
        console.log('[NewsInsight] Falling back to OpenRouter...')
        provider = 'openrouter'
        result = await generateWithOpenRouter(prompt, systemPrompt)
        result.expert = expert.name

        if (newsId && news) {
          await prisma.news.update({
            where: { id: newsId },
            data: {
              aiInsight: result.insight,
              aiInsightExpert: expert.name,
              aiInsightKeywords: result.keywords || [],
              aiInsightAt: new Date(),
              aiInsightProvider: 'openrouter',
            },
          }).catch((err: unknown) => console.error('[NewsInsight] DB save failed:', err))
        }

        return NextResponse.json({
          success: true,
          data: result,
          provider,
          cached: false,
        })
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        console.error('[NewsInsight] OpenRouter failed:', errorMsg)
        providerAttempts.push({ provider: 'OpenRouter', error: errorMsg })
      }
    } else {
      providerAttempts.push({ provider: 'OpenRouter', error: 'API 키 미설정' })
    }

    // 모든 프로바이더 실패
    const errorDetails = providerAttempts
      .map((attempt) => `[${attempt.provider}] ${attempt.error}`)
      .join(' → ')

    console.error('[NewsInsight] All providers failed:', errorDetails)

    return NextResponse.json(
      {
        error: '모든 AI 프로바이더 실패',
        details: errorDetails,
        attempts: providerAttempts,
      },
      { status: 500 }
    )
  } catch (error) {
    console.error('[NewsInsight API Error]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
