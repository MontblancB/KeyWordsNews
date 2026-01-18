import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { FEATURE_FLAGS } from '@/lib/feature-flags'

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

// 카테고리별 전문가 설정
const CATEGORY_EXPERTS: Record<string, { name: string; expertise: string; perspective: string }> = {
  politics: {
    name: '정치 전문 애널리스트',
    expertise: '정치학 박사, 20년 경력의 정치 기자 출신으로 국내외 정치 동향, 정책 분석, 선거 전략에 정통합니다.',
    perspective: '정치적 역학관계, 정책의 실효성, 여론의 흐름, 향후 정치 지형 변화를 중심으로 분석합니다. 각 정치 세력의 의도와 전략, 법안의 사회적 영향, 국제 정치와의 연관성을 파악합니다.',
  },
  economy: {
    name: '경제 전문 애널리스트',
    expertise: '경제학 박사, 월가 투자은행 출신으로 거시경제, 금융시장, 기업 분석에 정통합니다.',
    perspective: '시장에 미치는 영향, 투자 시사점, 산업 트렌드, 정책의 경제적 파급효과를 중심으로 분석합니다. 숫자와 데이터를 기반으로 객관적 전망을 제시합니다.',
  },
  society: {
    name: '사회 전문 애널리스트',
    expertise: '사회학 박사, 시민단체 활동가 출신으로 사회 현상, 인구 변화, 사회 갈등에 정통합니다.',
    perspective: '사회 구조적 원인, 시민 생활에 미치는 영향, 세대/계층 간 갈등, 사회 변화의 방향성을 중심으로 분석합니다. 약자의 관점과 공동체적 가치를 고려합니다.',
  },
  world: {
    name: '국제 전문 애널리스트',
    expertise: '국제관계학 박사, 외교부 출신으로 국제 정세, 지정학, 글로벌 이슈에 정통합니다.',
    perspective: '국제 역학관계, 지정학적 의미, 한국에 미치는 영향, 글로벌 트렌드와의 연관성을 중심으로 분석합니다. 다양한 국가의 입장과 이해관계를 균형 있게 다룹니다.',
  },
  tech: {
    name: 'IT/과학 전문 애널리스트',
    expertise: '컴퓨터공학 박사, 실리콘밸리 테크기업 출신으로 기술 혁신, AI, 스타트업 생태계에 정통합니다.',
    perspective: '기술의 혁신성, 시장 파괴력, 사회적 영향, 미래 기술 트렌드를 중심으로 분석합니다. 기술의 가능성과 한계, 윤리적 고려사항을 함께 다룹니다.',
  },
  sports: {
    name: '스포츠 전문 애널리스트',
    expertise: '체육학 박사, 전직 프로선수 출신으로 각종 스포츠, 선수 분석, 스포츠 산업에 정통합니다.',
    perspective: '경기력 분석, 팀/선수의 전략, 스포츠 산업 동향, 팬 문화를 중심으로 분석합니다. 승부의 핵심 요인과 감동적인 스토리를 전달합니다.',
  },
  entertainment: {
    name: '연예 전문 애널리스트',
    expertise: '문화콘텐츠학 박사, 엔터테인먼트 업계 경력으로 K-POP, 드라마, 영화 산업에 정통합니다.',
    perspective: '콘텐츠의 완성도, 시장 반응, 아티스트의 성장, 한류 트렌드를 중심으로 분석합니다. 대중문화의 사회적 의미와 글로벌 영향력을 다룹니다.',
  },
  culture: {
    name: '문화 전문 애널리스트',
    expertise: '문화인류학 박사, 문화재단 출신으로 예술, 전통문화, 문화정책에 정통합니다.',
    perspective: '문화적 가치, 예술적 의미, 전통과 현대의 조화, 문화 다양성을 중심으로 분석합니다. 문화가 사회에 미치는 영향과 보존의 중요성을 강조합니다.',
  },
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

답변은 반드시 JSON 형식으로 작성합니다. 쉬운 한글로 작성하고 한자어는 피합니다.`
}

// 카테고리 한글명
const CATEGORY_NAMES: Record<string, string> = {
  general: '종합',
  politics: '정치',
  economy: '경제',
  society: '사회',
  world: '국제',
  tech: 'IT/과학',
  sports: '스포츠',
  entertainment: '연예',
  culture: '문화',
}

// 종합 탭용 프롬프트
function createGeneralPrompt(newsText: string, newsCount: number): string {
  return `다음은 오늘의 주요 뉴스 ${newsCount}개입니다. 수석 애널리스트로서 종합적인 인사이트를 제공해주세요.

${newsText}

---

**분석 요청:**

1. **📊 주요 이슈 분류** (3-5개 테마로 묶기)
   - 서로 연관된 뉴스들을 테마별로 그룹화
   - 각 테마별 핵심 내용과 의미를 2-3줄로 정리
   - 테마 간의 연관성이 있다면 언급

2. **💡 수석 애널리스트의 종합 인사이트**
   - **오늘의 핵심 메시지**: 이 뉴스들이 우리에게 말하는 것
   - **주목할 변화**: 기존과 달라진 점, 새로운 트렌드
   - **향후 전망**: 앞으로 어떻게 전개될 것인지 예측
   - **독자를 위한 조언**: 이 상황에서 우리가 알아야 할 것

3. **🔑 핵심 키워드** 5개

**중요 지침:**
- 쉬운 한글 사용 (한자어 대신 일상 표현)
- 구체적인 수치와 사실을 근거로 분석
- 독자가 "아, 그래서 이게 중요하구나!" 하고 느낄 수 있도록

**출력 형식 (반드시 JSON):**
{
  "insights": "📊 **주요 이슈 분류**\\n\\n**1. [테마명]**\\n• 내용1\\n• 내용2\\n\\n**2. [테마명]**\\n• 내용1\\n• 내용2\\n\\n💡 **수석 애널리스트의 종합 인사이트**\\n\\n**오늘의 핵심 메시지**\\n• ...\\n\\n**주목할 변화**\\n• ...\\n\\n**향후 전망**\\n• ...\\n\\n**독자를 위한 조언**\\n• ...",
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
   - 각 이슈의 배경과 맥락
   - 업계/분야에서의 의미
   - 관련 이해관계자들에게 미치는 영향

2. **💡 ${expertName}의 전문 인사이트**
   - **핵심 포인트**: 이 뉴스들의 본질적 의미
   - **업계 내부 시각**: 일반인이 놓치기 쉬운 중요한 점
   - **전문가 예측**: 향후 전개 방향과 예상 시나리오
   - **실용적 조언**: 독자가 알아야 할 것, 주목해야 할 것

3. **🔑 핵심 키워드** 5개

**중요 지침:**
- 전문가다운 깊이 있는 분석, 하지만 쉬운 한글로 설명
- 구체적인 수치와 사례를 근거로 제시
- 해당 분야 전문가만 알 수 있는 인사이트 포함
- 표면적 사실 너머의 의미를 파악하여 전달

**출력 형식 (반드시 JSON):**
{
  "insights": "📊 **핵심 이슈 분석**\\n\\n**1. [이슈명]**\\n• 배경: ...\\n• 의미: ...\\n• 영향: ...\\n\\n**2. [이슈명]**\\n• 배경: ...\\n• 의미: ...\\n\\n💡 **${expertName}의 전문 인사이트**\\n\\n**핵심 포인트**\\n• ...\\n\\n**업계 내부 시각**\\n• ...\\n\\n**전문가 예측**\\n• ...\\n\\n**실용적 조언**\\n• ...",
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

// Groq API 호출 함수
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
    max_tokens: 2500,
    response_format: { type: 'json_object' },
  })

  const content = response.choices[0]?.message?.content || ''

  const result = JSON.parse(content) as InsightResult
  if (!result.insights || !Array.isArray(result.keywords)) {
    throw new Error('Invalid response format')
  }
  result.keywords = result.keywords.slice(0, 5)

  return result
}

// Gemini API 호출 함수 (2nd 폴백)
async function generateWithGemini(prompt: string, systemPrompt: string): Promise<InsightResult> {
  const baseUrl = 'https://generativelanguage.googleapis.com/v1beta'
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash'

  const response = await fetch(
    `${baseUrl}/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `${systemPrompt}\n\n${prompt}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 2500,
          responseMimeType: 'application/json',
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

  // JSON 추출
  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('No JSON found in response')
  }

  const result = JSON.parse(jsonMatch[0]) as InsightResult
  if (!result.insights || !Array.isArray(result.keywords)) {
    throw new Error('Invalid response format')
  }
  result.keywords = result.keywords.slice(0, 5)

  return result
}

// OpenRouter API 호출 함수 (3rd 폴백)
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
      max_tokens: 2500,
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.status}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content || ''

  // JSON 추출 (마크다운 코드 블록 처리)
  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('No JSON found in response')
  }

  const result = JSON.parse(jsonMatch[0]) as InsightResult
  if (!result.insights || !Array.isArray(result.keywords)) {
    throw new Error('Invalid response format')
  }
  result.keywords = result.keywords.slice(0, 5)

  return result
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
    const category: string | null = body.category || null  // 카테고리 (종합 탭은 null)

    // 유효성 검사
    if (!Array.isArray(newsList) || newsList.length < 5) {
      return NextResponse.json(
        { error: '최소 5개의 뉴스가 필요합니다.' },
        { status: 400 }
      )
    }

    // 카테고리별 시스템 프롬프트 및 사용자 프롬프트 생성
    const systemPrompt = getSystemPrompt(category)
    const categoryName = category ? (CATEGORY_NAMES[category] || category) : '종합'
    console.log(`[InsightNow] Category: ${categoryName}, News count: ${newsList.length}`)

    // 뉴스 데이터를 텍스트로 변환
    const newsText = newsList
      .map(
        (news, index) =>
          `[${index + 1}] [${news.source}] ${news.title}\n   요약: ${news.summary || '없음'}`
      )
      .join('\n\n')

    const prompt = createPrompt(newsText, newsList.length, category)

    let result: InsightResult
    let provider: string = 'groq'

    // 각 프로바이더의 시도 결과 및 에러 수집
    const providerAttempts: { provider: string; error: string }[] = []

    // 1차 시도: Groq
    if (process.env.GROQ_API_KEY) {
      try {
        console.log('[InsightNow] Trying Groq...')
        result = await generateWithGroq(prompt, systemPrompt)
        return NextResponse.json({
          success: true,
          data: result,
          provider,
          category: categoryName,
        })
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        console.error('[InsightNow] Groq failed:', errorMsg)
        providerAttempts.push({ provider: 'Groq', error: errorMsg })
        // 폴백으로 진행
      }
    } else {
      providerAttempts.push({ provider: 'Groq', error: 'API 키 미설정' })
    }

    // 2차 시도: Gemini (2nd 폴백)
    if (process.env.GEMINI_API_KEY) {
      try {
        console.log('[InsightNow] Falling back to Gemini...')
        provider = 'gemini'
        result = await generateWithGemini(prompt, systemPrompt)
        return NextResponse.json({
          success: true,
          data: result,
          provider,
          category: categoryName,
        })
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        console.error('[InsightNow] Gemini failed:', errorMsg)
        providerAttempts.push({ provider: 'Gemini', error: errorMsg })
        // 다음 폴백으로 진행
      }
    } else {
      providerAttempts.push({ provider: 'Gemini', error: 'API 키 미설정' })
    }

    // 3차 시도: OpenRouter (3rd 폴백)
    if (process.env.OPENROUTER_API_KEY) {
      try {
        console.log('[InsightNow] Falling back to OpenRouter...')
        provider = 'openrouter'
        result = await generateWithOpenRouter(prompt, systemPrompt)
        return NextResponse.json({
          success: true,
          data: result,
          provider,
          category: categoryName,
        })
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        console.error('[InsightNow] OpenRouter failed:', errorMsg)
        providerAttempts.push({ provider: 'OpenRouter', error: errorMsg })
      }
    } else {
      providerAttempts.push({ provider: 'OpenRouter', error: 'API 키 미설정' })
    }

    // 모든 프로바이더 실패 - 상세 에러 메시지 생성
    const errorDetails = providerAttempts
      .map((attempt) => `[${attempt.provider}] ${attempt.error}`)
      .join(' → ')

    console.error('[InsightNow] All providers failed:', errorDetails)

    return NextResponse.json(
      {
        error: `모든 AI 프로바이더 실패`,
        details: errorDetails,
        attempts: providerAttempts
      },
      { status: 500 }
    )
  } catch (error) {
    console.error('[Daily Insight API Error]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
