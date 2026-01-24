import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET /api/trends/google
 * Google Trends 실시간 검색어 조회
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const forceRefresh = searchParams.get('refresh') === 'true'

    // 캐시 확인 (1시간 이내 데이터)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

    if (!forceRefresh) {
      const cachedTrends = await prisma.trend.findMany({
        where: {
          collectedAt: { gte: oneHourAgo },
          country: 'south_korea',
        },
        orderBy: { rank: 'asc' },
        take: 20,
      })

      if (cachedTrends.length > 0) {
        return Response.json({
          success: true,
          data: cachedTrends,
          cached: true,
          collectedAt: cachedTrends[0].collectedAt,
        })
      }
    }

    // Python 스크립트 실행
    const { stdout, stderr } = await execAsync('python3 scripts/collect-trends.py', {
      maxBuffer: 1024 * 1024,
    })

    if (stderr) {
      console.error('Python stderr:', stderr)
    }

    const result = JSON.parse(stdout)

    if (!result.success) {
      throw new Error(result.error)
    }

    // DB에 저장
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

    return Response.json({
      success: true,
      data: result.data,
      cached: false,
      collectedAt,
    })
  } catch (error: any) {
    console.error('Trends API Error:', error)
    return Response.json(
      {
        success: false,
        error: error.message || 'Failed to fetch trends',
      },
      { status: 500 }
    )
  }
}
