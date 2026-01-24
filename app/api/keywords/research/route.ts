import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    const { keyword } = await req.json()

    if (!keyword) {
      return NextResponse.json(
        { error: '키워드가 필요합니다.' },
        { status: 400 }
      )
    }

    const prompt = `"${keyword}"에 대해 쉽고 간단하게 설명해주세요.

다음 형식으로 작성:

📌 한 줄 요약
[1문장으로 핵심만 설명]

🔥 왜 주목받고 있나요?
[2-3문장으로 최근 이슈나 화제가 된 이유]

💡 알아두면 좋은 점
• [핵심 포인트 1]
• [핵심 포인트 2]
• [핵심 포인트 3]

중학생도 이해할 수 있도록 쉬운 말로 작성해주세요.
전문 용어는 피하고, 일상적인 언어를 사용하세요.`

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: '당신은 복잡한 내용을 쉽고 재미있게 설명하는 전문가입니다. 누구나 이해할 수 있도록 간단명료하게 설명합니다.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 1000,
    })

    const info = completion.choices[0]?.message?.content || '정보를 가져올 수 없습니다.'

    return NextResponse.json({ info })
  } catch (error) {
    console.error('[Keyword Research] Error:', error)
    return NextResponse.json(
      { error: '키워드 정보를 생성하는데 실패했습니다.' },
      { status: 500 }
    )
  }
}
