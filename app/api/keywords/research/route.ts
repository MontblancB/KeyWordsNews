import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import prisma from '@/lib/prisma'

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

    // 1. 먼저 관련 뉴스 검색 (최근 10개)
    const news = await prisma.news.findMany({
      where: {
        OR: [
          { title: { contains: keyword, mode: 'insensitive' } },
          { summary: { contains: keyword, mode: 'insensitive' } },
        ],
      },
      select: {
        title: true,
        summary: true,
        source: true,
      },
      orderBy: { publishedAt: 'desc' },
      take: 10,
    })

    // 2. 뉴스 정보를 컨텍스트로 구성
    const newsContext = news.length > 0
      ? news
          .map((n, i) => `${i + 1}. ${n.title}\n   ${n.summary}`)
          .join('\n\n')
      : '관련 뉴스를 찾을 수 없습니다.'

    const prompt = `아래는 "${keyword}"와 관련된 최근 뉴스 기사들입니다:

${newsContext}

위 뉴스 내용을 바탕으로 "${keyword}"에 대해 쉽고 간단하게 설명해주세요.

다음 형식으로 작성:

📌 한 줄 요약
[뉴스에서 파악한 내용을 1문장으로 핵심만 설명]

🔥 왜 주목받고 있나요?
[뉴스에 나온 최근 이슈나 화제가 된 이유를 2-3문장으로]

💡 알아두면 좋은 점
• [뉴스에서 발견한 핵심 포인트 1]
• [뉴스에서 발견한 핵심 포인트 2]
• [뉴스에서 발견한 핵심 포인트 3]

중요:
- 반드시 위 뉴스 기사 내용을 기반으로 설명하세요
- 뉴스에 없는 내용은 추측하지 마세요
- 중학생도 이해할 수 있도록 쉬운 말로 작성하세요
- 전문 용어나 한자어는 피하고, 일상적인 한글 단어만 사용하세요
- 예: "최근" 대신 "요즘", "현재" 대신 "지금", "발생" 대신 "일어났다" 등`

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: '당신은 뉴스 기사를 분석하여 복잡한 내용을 쉽고 재미있게 설명하는 전문가입니다. 제공된 뉴스 내용을 정확히 분석하여 누구나 이해할 수 있도록 간단명료하게 설명합니다. 한자어 대신 순우리말과 쉬운 한글 표현을 사용합니다. 뉴스에 없는 내용은 절대 추측하거나 지어내지 않습니다.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 1500,
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
