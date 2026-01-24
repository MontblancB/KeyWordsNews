import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

/**
 * POST /api/trends/reset
 * 트렌드 데이터 초기화 (더미 데이터 삭제)
 */
export async function POST(request: NextRequest) {
  try {
    // Cron Secret 검증
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 모든 트렌드 데이터 삭제
    const result = await prisma.trend.deleteMany({})

    console.log(`[Trends Reset] Deleted ${result.count} trend records`)

    return Response.json({
      success: true,
      message: `Deleted ${result.count} trend records`,
      deletedCount: result.count,
    })
  } catch (error: any) {
    console.error('Trends Reset Error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
