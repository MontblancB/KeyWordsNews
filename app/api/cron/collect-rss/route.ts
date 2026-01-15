import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { collectAllRSS } from '@/lib/rss/collector'

// Vercel Cron Job에서만 호출 가능하도록 보안 설정
export async function GET(request: Request) {
  try {
    // Vercel Cron Job에서 보낸 요청인지 확인
    const headersList = await headers()
    const authorization = headersList.get('authorization')

    // CRON_SECRET 환경 변수로 보안 강화
    const cronSecret = process.env.CRON_SECRET
    if (cronSecret && authorization !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('🔄 Cron Job: RSS 수집 시작...')

    // RSS 수집 실행
    const result = await collectAllRSS()

    console.log('✅ Cron Job: RSS 수집 완료', result)

    return NextResponse.json({
      message: 'RSS collection completed',
      ...result
    })
  } catch (error) {
    console.error('❌ Cron Job: RSS 수집 실패', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
