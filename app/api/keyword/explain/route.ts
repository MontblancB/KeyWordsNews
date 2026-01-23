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

다음 형식으로 설명해주세요:

📌 **핵심 정의**
• [한 문장으로 핵심 개념 설명]

📚 **상세 설명**
• [좀 더 자세한 설명, 2-3문장]

💡 **실생활 예시**
• [구체적인 예시나 비유로 쉽게 설명]

규칙:
- 전문 용어는 최소화하고 쉬운 말로 설명
- 구체적인 예시 포함
- 각 섹션은 2-3개 불릿 포인트로 간결하게
- 이모지는 섹션 헤더에만 사용
- 쉬운 한글로 작성 (한자어 최소화)`

    console.log('[KeywordExplain] Groq API 요청 시작...')

    // Groq API 호출
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content:
            '당신은 전문 용어를 일반인도 쉽게 이해할 수 있도록 설명하는 전문가입니다. 전문 용어는 최소화하고, 구체적인 예시와 비유를 사용하여 쉽게 설명합니다. 한자어 대신 쉬운 한글을 사용합니다.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
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
