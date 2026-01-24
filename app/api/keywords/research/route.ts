import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

export async function POST(req: NextRequest) {
  try {
    const { keyword } = await req.json()

    // Groq 클라이언트를 함수 내부에서 초기화 (빌드 시 환경 변수 오류 방지)
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY || '',
    })

    if (!keyword) {
      return NextResponse.json(
        { error: '키워드가 필요합니다.' },
        { status: 400 }
      )
    }

    const prompt = `"${keyword}"에 대해 깔끔하고 이해하기 쉽게 설명해주세요.

다음 형식으로 작성:

📌 이게 뭔가요?
[핵심을 1-2문장으로 명확하게 설명]

🔥 왜 화제인가요?
[지금 주목받는 이유를 2-3문장으로 설명]

💡 꼭 알아둘 점
• [핵심 포인트 1]
• [핵심 포인트 2]
• [핵심 포인트 3]

작성 가이드:
1. 정확성: 최신 정보를 기반으로 정확하게 설명
2. 명확성: 애매한 표현 없이 명확하게
3. 쉬운 언어: 중학생도 이해할 수 있는 쉬운 말 사용
4. 순우리말: 한자어 대신 일상 언어 사용 (예: 최근→요즘, 현재→지금)
5. 간결성: 불필요한 내용 없이 핵심만

특히 주의:
- 인물이면: 직업, 대표작, 왜 유명한지
- 사건이면: 무슨 일인지, 언제, 왜 중요한지
- 영화/드라마면: 장르, 출연진, 개봉/방영 정보
- 용어면: 뜻, 어디서 쓰이는지, 왜 중요한지`

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: '당신은 최신 트렌드와 이슈를 정확히 파악하고 있는 리서치 전문가입니다. 복잡한 내용을 누구나 쉽게 이해할 수 있도록 깔끔하게 설명합니다. 정확한 정보를 바탕으로 명확하고 간결하게 답변하며, 어려운 한자어 대신 쉬운 우리말을 사용합니다.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.2,
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
