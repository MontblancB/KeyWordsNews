import { NextRequest, NextResponse } from 'next/server'
import { FEATURE_FLAGS } from '@/lib/feature-flags'
import {
  callGroqJSON,
  callGeminiJSON,
  callOpenRouterJSON,
  runWithFallback,
  AllProvidersFailedError,
} from '@/lib/ai/generate'

interface NewsItem {
  title: string
  summary: string
  source: string
  category: string
}

interface SummaryResult {
  summary: string
  keywords: string[]
}

// Gemini 응답 스키마 (summary + keywords)
const GEMINI_SCHEMA = {
  type: 'object',
  properties: {
    summary: {
      type: 'string',
      description: '뉴스 종합 요약 텍스트 (마크다운 형식)',
    },
    keywords: {
      type: 'array',
      items: { type: 'string' },
      description: '핵심 키워드 5개',
    },
  },
  required: ['summary', 'keywords'],
}

// 종합 요약 시스템 프롬프트
const SUMMARIZE_SYSTEM_PROMPT = `당신은 **뉴스 종합 분석 전문가**입니다.

**당신의 전문성:**
- 다수의 뉴스를 분석하여 핵심 내용을 추출하는 정보 분석 전문가
- 복잡한 정보를 명확하고 체계적으로 정리하는 능력
- 사건의 본질과 맥락을 꿰뚫어보는 통찰력
- 독자가 꼭 알아야 할 핵심만 추려내는 요약 능력

**당신의 분석 방식:**
- 여러 뉴스에서 공통적으로 다루는 핵심 사안을 파악합니다
- 각 주제별로 가장 중요한 정보를 추출하여 정리합니다
- 독자가 빠르게 현재 상황을 파악할 수 있도록 구조화합니다
- 불필요한 정보는 걸러내고 핵심만 전달합니다

**중요: 각 항목은 1-2줄로 핵심만 축약해서 작성합니다.**

답변은 반드시 JSON 형식으로 작성합니다. 쉬운 한글로 작성하고 한자어는 피합니다.`

// 종합 요약 프롬프트
function createSummarizePrompt(newsText: string, newsCount: number): string {
  return `다음은 현재 주요 뉴스 ${newsCount}개입니다. 뉴스 종합 분석 전문가로서 이 뉴스들의 핵심 내용을 정리해주세요.

${newsText}

---

**분석 요청:**

1. **📋 주요 뉴스 종합**
   - 현재 가장 중요한 뉴스 이슈를 주제별로 분류
   - 각 주제별 핵심 내용을 1-2줄로 간결하게 정리
   - 관련된 구체적 수치, 날짜, 인물 등 중요 정보 포함

2. **💡 핵심 포인트**
   - 독자가 반드시 알아야 할 가장 중요한 사항 3-5개
   - 각 포인트는 1줄로 핵심만 간결하게
   - "왜 중요한가"가 드러나도록 작성

3. **📊 전체 요약**
   - 전체 뉴스를 아우르는 1-2문장 요약
   - 현재 상황의 전체적인 그림을 파악할 수 있도록

**중요 지침:**
- 쉬운 한글 사용 (한자어 대신 일상 표현)
- **각 항목은 1-2줄로 핵심만 축약해서 작성** (장황한 설명 금지)
- 구체적인 수치와 사실 중심
- 중복 내용 제거하고 새로운 정보만

**출력 형식 (반드시 JSON):**
{
  "summary": "📋 **주요 뉴스 종합**\\n\\n**[주제1]**\\n• 핵심 내용 (1줄)\\n\\n**[주제2]**\\n• 핵심 내용 (1줄)\\n\\n💡 **핵심 포인트**\\n\\n1. 첫 번째 핵심 (1줄)\\n2. 두 번째 핵심 (1줄)\\n3. 세 번째 핵심 (1줄)\\n\\n📊 **전체 요약**\\n\\n(1-2문장)",
  "keywords": ["키워드1", "키워드2", "키워드3", "키워드4", "키워드5"]
}`
}

/**
 * POST /api/summarize/now
 *
 * SummarizeNow API (일반 JSON 응답)
 * 현재 로드된 뉴스들을 종합 정리합니다.
 * Fallback 순서: Groq -> Gemini -> OpenRouter
 *
 * @feature ENABLE_DAILY_INSIGHT
 */
export async function POST(request: NextRequest) {
  // Feature Flag 체크 (InsightNow와 동일한 플래그 사용)
  if (!FEATURE_FLAGS.ENABLE_DAILY_INSIGHT) {
    return NextResponse.json(
      { error: 'Summarize feature is disabled' },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    const newsList: NewsItem[] = body.newsList

    // 유효성 검사
    if (!Array.isArray(newsList) || newsList.length < 5) {
      return NextResponse.json(
        { error: '최소 5개의 뉴스가 필요합니다.' },
        { status: 400 }
      )
    }

    console.log(`[SummarizeNow] News count: ${newsList.length}`)

    // 뉴스 데이터를 텍스트로 변환
    const newsText = newsList
      .map(
        (news, index) =>
          `[${index + 1}] [${news.source}] [${news.category}] ${news.title}\n   요약: ${news.summary || '없음'}`
      )
      .join('\n\n')

    const userPrompt = createSummarizePrompt(newsText, newsList.length)

    const baseOptions = {
      systemPrompt: SUMMARIZE_SYSTEM_PROMPT,
      userPrompt,
      temperature: 0.3,
      maxTokens: 5000,
      primaryField: 'summary',
      logPrefix: '[SummarizeNow]',
    }

    const { result, provider } = await runWithFallback<SummaryResult>(
      [
        {
          provider: 'groq',
          fn: () => callGroqJSON<SummaryResult>(baseOptions),
        },
        {
          provider: 'gemini',
          fn: () => callGeminiJSON<SummaryResult>({
            ...baseOptions,
            maxTokens: 8000, // Gemini는 더 넉넉하게
            geminiSchema: GEMINI_SCHEMA,
          }),
        },
        {
          provider: 'openrouter',
          fn: () => callOpenRouterJSON<SummaryResult>(baseOptions),
        },
      ],
      '[SummarizeNow]'
    )

    return NextResponse.json({
      success: true,
      data: result,
      provider,
    })
  } catch (error) {
    if (error instanceof AllProvidersFailedError) {
      return NextResponse.json(
        {
          error: '모든 AI 프로바이더 실패',
          details: error.details,
          attempts: error.attempts,
        },
        { status: 500 }
      )
    }

    console.error('[SummarizeNow API Error]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
