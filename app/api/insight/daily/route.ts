import { NextRequest, NextResponse } from 'next/server'
import { FEATURE_FLAGS } from '@/lib/feature-flags'
import { CATEGORY_EXPERTS, CATEGORY_NAMES } from '@/lib/ai/experts'
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

interface InsightResult {
  insights: string
  keywords: string[]
}

// Gemini 응답 스키마 (insights + keywords)
const GEMINI_SCHEMA = {
  type: 'object',
  properties: {
    insights: {
      type: 'string',
      description: '뉴스 분석 인사이트 텍스트 (마크다운 형식)',
    },
    keywords: {
      type: 'array',
      items: { type: 'string' },
      description: '핵심 키워드 5개',
    },
  },
  required: ['insights', 'keywords'],
}

// 종합 탭용 멀티 전문가 시스템 프롬프트
const GENERAL_SYSTEM_PROMPT = `당신은 다양한 분야에 정통한 **수석 뉴스 애널리스트**입니다.

**당신의 전문성:**
- 정치, 경제, 사회, 국제, IT/과학, 스포츠, 연예, 문화 등 모든 분야를 아우르는 폭넓은 지식
- 서로 다른 분야의 뉴스들 사이의 연관성과 상호작용을 파악하는 통찰력
- 복잡한 이슈를 일반인도 이해할 수 있게 설명하는 커뮤니케이션 능력
- 객관적이고 균형 잡힌 시각으로 다양한 관점을 제시

**당신의 분석 방식:**
- 개별 뉴스의 의미뿐 아니라 뉴스들 간의 연결고리를 찾아냅니다
- 표면적 사실 너머의 본질적 의미와 맥락을 파악합니다
- 단기적 영향과 장기적 트렌드를 구분하여 분석합니다
- 독자가 "왜 이것이 중요한지"를 명확히 이해할 수 있도록 설명합니다

**중요: 각 항목은 1-2줄로 핵심만 축약해서 작성합니다.**

답변은 반드시 JSON 형식으로 작성합니다. 쉬운 한글로 작성하고 한자어는 피합니다.`

// 카테고리별 시스템 프롬프트 생성
function getSystemPrompt(category: string | null): string {
  if (!category || category === 'general') {
    return GENERAL_SYSTEM_PROMPT
  }

  const expert = CATEGORY_EXPERTS[category]
  if (!expert) {
    return GENERAL_SYSTEM_PROMPT
  }

  return `당신은 **${expert.name}**입니다.

**당신의 전문성:**
${expert.expertise}

**당신의 분석 관점:**
${expert.perspective}

**당신의 분석 방식:**
- 해당 분야의 전문 용어를 적절히 사용하되, 일반인도 이해할 수 있게 설명합니다
- 업계 내부자의 시각으로 뉴스의 숨은 의미를 파악합니다
- 과거 사례와 비교하여 현재 상황의 의미를 분석합니다
- 향후 전개 방향에 대한 전문가적 예측을 제시합니다

**중요: 각 항목은 1-2줄로 핵심만 축약해서 작성합니다.**

답변은 반드시 JSON 형식으로 작성합니다. 쉬운 한글로 작성하고 한자어는 피합니다.`
}

// 종합 탭용 프롬프트
function createGeneralPrompt(newsText: string, newsCount: number): string {
  return `다음은 오늘의 주요 뉴스 ${newsCount}개입니다. 수석 애널리스트로서 종합적인 인사이트를 제공해주세요.

${newsText}

---

**분석 요청:**

1. **📊 주요 이슈 분류** (3-5개 테마로 묶기)
   - 서로 연관된 뉴스들을 테마별로 그룹화
   - 각 테마별 핵심 내용과 의미를 1-2줄로 간결하게 정리
   - 테마 간의 연관성이 있다면 간략히 언급

2. **💡 수석 애널리스트의 종합 인사이트**
   - **오늘의 핵심 메시지**: 이 뉴스들이 우리에게 말하는 것 (1-2줄)
   - **주목할 변화**: 기존과 달라진 점, 새로운 트렌드 (1-2줄)
   - **향후 전망**: 앞으로 어떻게 전개될 것인지 예측 (1-2줄)
   - **독자를 위한 조언**: 이 상황에서 우리가 알아야 할 것 (1-2줄)

3. **🔑 핵심 키워드** 5개

**중요 지침:**
- 쉬운 한글 사용 (한자어 대신 일상 표현)
- 구체적인 수치와 사실을 근거로 분석
- **각 항목은 1-2줄로 핵심만 축약해서 작성** (장황한 설명 금지)

**출력 형식 (반드시 JSON):**
{
  "insights": "📊 **주요 이슈 분류**\\n\\n**1. [테마명]**\\n• 핵심 내용 (1줄)\\n\\n**2. [테마명]**\\n• 핵심 내용 (1줄)\\n\\n💡 **수석 애널리스트의 종합 인사이트**\\n\\n**오늘의 핵심 메시지**\\n• (1-2줄)\\n\\n**주목할 변화**\\n• (1-2줄)\\n\\n**향후 전망**\\n• (1-2줄)\\n\\n**독자를 위한 조언**\\n• (1-2줄)",
  "keywords": ["키워드1", "키워드2", "키워드3", "키워드4", "키워드5"]
}`
}

// 카테고리별 전문가 프롬프트
function createCategoryPrompt(newsText: string, newsCount: number, category: string): string {
  const categoryName = CATEGORY_NAMES[category] || category
  const expert = CATEGORY_EXPERTS[category]
  const expertName = expert?.name || '전문 애널리스트'

  return `다음은 오늘의 ${categoryName} 분야 주요 뉴스 ${newsCount}개입니다. ${expertName}로서 전문적인 인사이트를 제공해주세요.

${newsText}

---

**분석 요청:**

1. **📊 핵심 이슈 분석** (2-4개 주요 이슈)
   - 각 이슈의 배경과 맥락 (1줄)
   - 업계/분야에서의 의미 (1줄)
   - 관련 이해관계자들에게 미치는 영향 (1줄)

2. **💡 ${expertName}의 전문 인사이트**
   - **핵심 포인트**: 이 뉴스들의 본질적 의미 (1-2줄)
   - **업계 내부 시각**: 일반인이 놓치기 쉬운 중요한 점 (1-2줄)
   - **전문가 예측**: 향후 전개 방향과 예상 시나리오 (1-2줄)
   - **실용적 조언**: 독자가 알아야 할 것, 주목해야 할 것 (1-2줄)

3. **🔑 핵심 키워드** 5개

**중요 지침:**
- 전문가다운 깊이 있는 분석, 하지만 쉬운 한글로 설명
- 구체적인 수치와 사례를 근거로 제시
- **각 항목은 1-2줄로 핵심만 축약해서 작성** (장황한 설명 금지)

**출력 형식 (반드시 JSON):**
{
  "insights": "📊 **핵심 이슈 분석**\\n\\n**1. [이슈명]**\\n• 배경/맥락 (1줄)\\n• 의미 (1줄)\\n\\n**2. [이슈명]**\\n• 배경/맥락 (1줄)\\n• 의미 (1줄)\\n\\n💡 **${expertName}의 전문 인사이트**\\n\\n**핵심 포인트**\\n• (1-2줄)\\n\\n**업계 내부 시각**\\n• (1-2줄)\\n\\n**전문가 예측**\\n• (1-2줄)\\n\\n**실용적 조언**\\n• (1-2줄)",
  "keywords": ["키워드1", "키워드2", "키워드3", "키워드4", "키워드5"]
}`
}

// 프롬프트 생성 함수 (통합)
function createPrompt(newsText: string, newsCount: number, category: string | null): string {
  if (!category || category === 'general') {
    return createGeneralPrompt(newsText, newsCount)
  }
  return createCategoryPrompt(newsText, newsCount, category)
}

/**
 * POST /api/insight/daily
 *
 * InsightNow API (일반 JSON 응답)
 * 현재 로드된 뉴스들을 종합 분석하여 인사이트를 생성합니다.
 * Fallback 순서: Groq -> Gemini -> OpenRouter
 *
 * @feature ENABLE_DAILY_INSIGHT
 */
export async function POST(request: NextRequest) {
  // Feature Flag 체크
  if (!FEATURE_FLAGS.ENABLE_DAILY_INSIGHT) {
    return NextResponse.json(
      { error: 'Daily Insight feature is disabled' },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    const newsList: NewsItem[] = body.newsList
    const category: string | null = body.category || null

    // 유효성 검사
    if (!Array.isArray(newsList) || newsList.length < 5) {
      return NextResponse.json(
        { error: '최소 5개의 뉴스가 필요합니다.' },
        { status: 400 }
      )
    }

    const categoryName = category ? (CATEGORY_NAMES[category] || category) : '종합'
    console.log(`[InsightNow] Category: ${categoryName}, News count: ${newsList.length}`)

    // 뉴스 데이터를 텍스트로 변환
    const newsText = newsList
      .map(
        (news, index) =>
          `[${index + 1}] [${news.source}] ${news.title}\n   요약: ${news.summary || '없음'}`
      )
      .join('\n\n')

    const systemPrompt = getSystemPrompt(category)
    const userPrompt = createPrompt(newsText, newsList.length, category)

    const baseOptions = {
      systemPrompt,
      userPrompt,
      temperature: 0.4,
      maxTokens: 8000,
      primaryField: 'insights',
      logPrefix: '[InsightNow]',
    }

    const { result, provider } = await runWithFallback<InsightResult>(
      [
        {
          provider: 'groq',
          fn: () => callGroqJSON<InsightResult>(baseOptions),
        },
        {
          provider: 'gemini',
          fn: () => callGeminiJSON<InsightResult>({ ...baseOptions, geminiSchema: GEMINI_SCHEMA }),
        },
        {
          provider: 'openrouter',
          fn: () => callOpenRouterJSON<InsightResult>(baseOptions),
        },
      ],
      '[InsightNow]'
    )

    return NextResponse.json({
      success: true,
      data: result,
      provider,
      category: categoryName,
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

    console.error('[Daily Insight API Error]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
