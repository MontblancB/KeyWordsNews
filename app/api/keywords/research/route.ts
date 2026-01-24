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

    const prompt = `다음 키워드에 대한 상세 정보를 제공해주세요: "${keyword}"

다음 내용을 포함해주세요:
1. **정의/개요**: 이 키워드가 무엇인지 간단히 설명 (2-3문장)
2. **최근 이슈**: 왜 현재 주목받고 있는지, 최근 관련 이슈나 사건 (3-4문장)
3. **배경 정보**: 역사적 배경이나 맥락 (2-3문장)
4. **주요 포인트**: 알아두면 좋은 핵심 사항 (3-5개 불릿 포인트)

한국어로 작성하고, 명확하고 이해하기 쉽게 설명해주세요.
뉴스나 대중문화 용어라면 그에 맞게, 인물이라면 인물에 맞게 내용을 조정하세요.`

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: '당신은 최신 트렌드와 시사 이슈에 정통한 전문 리서처입니다. 사용자가 궁금해하는 키워드에 대해 명확하고 유익한 정보를 제공합니다.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 2000,
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
