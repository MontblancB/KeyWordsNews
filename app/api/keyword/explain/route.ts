import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

/**
 * POST /api/keyword/explain
 * 키워드에 대한 용어 설명 생성
 */
export async function POST(request: NextRequest) {
  try {
    const { keyword } = await request.json()

    if (!keyword || typeof keyword !== 'string') {
      return NextResponse.json(
        { success: false, error: '키워드가 필요합니다.' },
        { status: 400 }
      )
    }

    console.log(`[KeywordExplain] 용어 설명 요청: ${keyword}`)

    // Groq API 키 확인
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      throw new Error('GROQ_API_KEY가 설정되지 않았습니다.')
    }

    // Groq 클라이언트 생성
    const groq = new Groq({ apiKey })

    // 용어 설명 프롬프트
    const prompt = `다음 용어에 대해 일반인도 이해하기 쉽게 설명해주세요:

**용어**: ${keyword}

다음 형식으로 **정확히** 설명해주세요:

📌 **핵심 정의**
• [한 문장으로 핵심 개념 설명]

📚 **상세 설명**
• [좀 더 자세한 설명, 2-3문장]

💡 **실생활 예시**
• [구체적인 예시나 비유로 쉽게 설명]

**매우 중요한 규칙:**
- 오직 한국어로만 작성 (영어, 중국어, 일본어 등 외국어 단어 절대 사용 금지)
- **한자 절대 사용 금지** (예: 정義(X) → 정의(O), 說明(X) → 설명(O))
- 섹션 헤더는 반드시 위 형식 그대로 사용 ("핵심 정의", "상세 설명", "실생활 예시")
- 외래어나 영어 약어도 한글로 풀어서 설명 (예: AI → 인공지능, IoT → 사물인터넷)
- 전문 용어는 최소화하고 쉬운 순우리말로 설명
- 한자어 대신 쉬운 한글 표현 사용
- 구체적인 예시 포함
- 각 섹션은 2-3개 불릿 포인트로 간결하게
- 이모지는 섹션 헤더에만 사용

**좋은 예시:**
📌 **핵심 정의**
• 블록체인은 거래 기록을 여러 컴퓨터에 나눠 저장하는 기술입니다

📚 **상세 설명**
• 은행 장부처럼 거래 내역을 기록하지만, 한 곳이 아닌 여러 곳에 똑같이 보관합니다
• 누군가 기록을 조작하려면 모든 컴퓨터의 기록을 동시에 바꿔야 해서 사실상 불가능합니다

💡 **실생활 예시**
• 친구들과 돈을 빌려주고 받을 때, 한 명이 아닌 모든 친구가 각자 장부에 기록하는 것과 같습니다`

    console.log('[KeywordExplain] Groq API 요청 시작...')

    // Groq API 호출
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content:
            '당신은 전문 용어를 일반인도 쉽게 이해할 수 있도록 설명하는 전문가입니다. **절대적으로 중요**: 오직 한국어로만 작성하며, 영어나 다른 외국어 단어는 절대 사용하지 않습니다. **한자도 절대 사용하지 않습니다** (정義→정의, 說明→설명, 定理→정리). 외래어나 영어 약어는 반드시 한글로 풀어쓰고 설명합니다 (예: API→프로그램 연결 인터페이스, SaaS→구독형 소프트웨어 서비스). 전문 용어는 최소화하고, 구체적인 예시와 비유를 사용하여 쉽게 설명합니다. 한자어 대신 쉬운 순우리말을 사용합니다. 섹션 헤더는 주어진 형식을 정확히 따릅니다.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.5, // 일관성 있는 한국어 응답을 위해 낮춤
      max_tokens: 1500,
    })

    const explanation = response.choices[0]?.message?.content

    if (!explanation) {
      throw new Error('AI 응답이 비어있습니다.')
    }

    console.log(`[KeywordExplain] Groq 응답 성공 (${explanation.length}자)`)

    return NextResponse.json({
      success: true,
      data: {
        keyword,
        explanation,
        provider: 'groq',
      },
    })
  } catch (error) {
    console.error('[KeywordExplain] Error:', error)

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : '용어 설명 생성에 실패했습니다.',
      },
      { status: 500 }
    )
  }
}
