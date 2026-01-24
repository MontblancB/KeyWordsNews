import { NextRequest } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import { prisma } from '@/lib/prisma'

const execAsync = promisify(exec)

export const dynamic = 'force-dynamic'

/**
 * POST /api/trends/collect
 * GitHub Actions Cron용 트렌드 수집 엔드포인트
 */
export async function POST(request: NextRequest) {
  try {
    // Cron Secret 검증
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Python 스크립트 실행
    const { stdout, stderr } = await execAsync('python3 scripts/collect-trends.py')

    if (stderr) {
      console.error('Python stderr:', stderr)
    }

    const result = JSON.parse(stdout)

    if (!result.success) {
      throw new Error(result.error)
    }

    // DB 저장
    const collectedAt = new Date(result.collectedAt)

    await prisma.$transaction(
      result.data.map((trend: any) =>
        prisma.trend.create({
          data: {
            keyword: trend.keyword,
            rank: trend.rank,
            country: trend.country,
            collectedAt,
          },
        })
      )
    )

    // 7일 이상 된 데이터 삭제
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    await prisma.trend.deleteMany({
      where: { collectedAt: { lt: sevenDaysAgo } },
    })

    return Response.json({
      success: true,
      count: result.data.length,
      collectedAt,
    })
  } catch (error: any) {
    console.error('Trend Collection Error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
