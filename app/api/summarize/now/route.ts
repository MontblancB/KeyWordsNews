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
      description: '뉴스 팩트 브리핑 텍스트 (마크다운 형식)',
    },
    keywords: {
      type: 'array',
      items: { type: 'string' },
      description: '핵심 키워드 5개',
    },
  },
  required: ['summary', 'keywords'],
}

// ── 카테고리 한글명 (간단 매핑) ──
const CATEGORY_LABELS: Record<string, string> = {
  general: '종합', politics: '정치', economy: '경제', society: '사회',
  world: '국제', tech: 'IT/과학', crypto: '암호화폐', global: '글로벌',
  sports: '스포츠', entertainment: '연예', culture: '문화',
}

// ── 시스템 프롬프트 ──

const SUMMARIZE_SYSTEM_PROMPT = `당신은 **뉴스 팩트 브리핑 전문가**입니다.

**당신의 역할:**
- 오늘 뉴스의 전체 그림을 구체적이고 충실하게 사실(fact) 중심으로 정리합니다
- 각 뉴스의 배경, 경위, 관련 수치, 이해관계자를 빠짐없이 전달합니다
- 의견이나 전망이 아닌, 기사에 명시된 사실을 충실하게 전달하는 것이 목표입니다

**브리핑 원칙:**
- 5W1H(누가, 언제, 어디서, 무엇을, 왜, 어떻게)를 빠짐없이 포함합니다
- 숫자, 날짜, 금액, 비율, 인명, 기관명, 전후 비교 등 구체적 정보를 반드시 포함합니다
- 관련된 뉴스는 하나의 주제로 묶되, 각 기사의 고유 정보는 누락하지 않습니다
- 중요도 순으로 정렬합니다 (가장 많은 사람에게 영향을 미치는 뉴스가 먼저)
- 기사에 명시된 사실만 포함하되, 충분한 맥락을 함께 전달합니다

**언어 규칙:**
- 한국어로 작성합니다
- 일상적으로 통용되는 한자어는 자연스럽게 사용합니다 (발표, 추진, 시행, 검토 등)
- 전문 용어는 괄호 안에 쉬운 설명을 덧붙입니다

답변은 반드시 JSON 형식으로 작성합니다.`

// ── 유저 프롬프트 ──

function createSummarizePrompt(newsText: string, newsCount: number): string {
  return `다음은 현재 주요 뉴스 ${newsCount}개입니다. 오늘 뉴스의 전체 그림을 구체적인 사실 중심으로 정리해주세요.

${newsText}

---

**브리핑 요청:**

1. **⚡ 한 줄 브리핑**
   - 오늘 뉴스 전체를 한 문장으로 요약

2. **📋 주요 뉴스 종합** (주제별 그룹화, 4-6개 주제)
   - 관련된 뉴스들을 주제별로 묶어서 정리
   - 각 주제당 2-4줄로 구체적 사실을 충실하게 기술:
     · 무슨 일이 일어났는지 (사건의 경위, 배경)
     · 관련 수치 (금액, 비율, 날짜, 전후 비교 등)
     · 주요 관계자 (인물, 기관, 기업명)
     · 현재 상태 (진행 중인지, 확정인지, 논의 단계인지)
   - 기사에 나온 구체적 팩트를 최대한 포함

3. **📊 숫자로 보는 오늘**
   - 오늘 뉴스에 등장한 핵심 수치 4-6개를 정리
   - 형식: "수치 — 무엇에 대한 수치인지 (맥락 설명)"
   - 예: "3.00% — 한국은행 기준금리, 전월 대비 0.25%p 인하"

4. **🔑 핵심 키워드** 5개

**키워드 선정 기준:**
- 오늘 뉴스의 핵심 사안을 나타내는 단어
- 관련 뉴스를 더 찾을 때 검색어로 유용한 단어
- 너무 일반적인 단어(정부, 국회, 기업 등) 대신 구체적인 키워드
- 한글로만 작성

**출력 형식 (반드시 JSON):**
{
  "summary": "⚡ **한 줄 브리핑**\\n\\n(사실 한 문장)\\n\\n📋 **주요 뉴스 종합**\\n\\n**1. [주제명]**\\n• (2-4줄, 구체적 사실·수치·관계자 포함)\\n\\n**2. [주제명]**\\n• (2-4줄)\\n\\n**3. [주제명]**\\n• (2-4줄)\\n\\n📊 **숫자로 보는 오늘**\\n\\n• 수치1 — 설명 (맥락)\\n• 수치2 — 설명 (맥락)\\n• 수치3 — 설명 (맥락)\\n• 수치4 — 설명 (맥락)",
  "keywords": ["키워드1", "키워드2", "키워드3", "키워드4", "키워드5"]
}`
}

/**
 * POST /api/summarize/now
 *
 * SummarizeNow API (일반 JSON 응답)
 * 현재 로드된 뉴스들을 팩트 중심으로 간결하게 브리핑합니다.
 * InsightNow와의 차이: 분석/의견 없이 순수 사실만 정리
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

    // 뉴스 데이터를 텍스트로 변환 (카테고리 태그 포함)
    const newsText = newsList
      .map(
        (news, index) => {
          const label = CATEGORY_LABELS[news.category] || news.category
          return `[${index + 1}] [${news.source}] [${label}] ${news.title}\n   요약: ${news.summary || '없음'}`
        }
      )
      .join('\n\n')

    const userPrompt = createSummarizePrompt(newsText, newsList.length)

    const baseOptions = {
      systemPrompt: SUMMARIZE_SYSTEM_PROMPT,
      userPrompt,
      temperature: 0.3,
      maxTokens: 8000,
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
