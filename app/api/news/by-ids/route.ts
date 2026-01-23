import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/news/by-ids
 *
 * 뉴스 ID 목록으로 뉴스 가져오기
 */
export async function POST(request: Request) {
  try {
    const { ids } = await request.json()

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid or empty IDs array' },
        { status: 400 }
      )
    }

    // ID 목록으로 뉴스 조회
    const news = await prisma.news.findMany({
      where: {
        id: {
          in: ids,
        },
      },
      select: {
        id: true,
        title: true,
        url: true,
        summary: true,
        source: true,
        publishedAt: true,
        aiSummary: true,
        aiKeywords: true,
      },
      orderBy: {
        publishedAt: 'desc',
      },
    })

    return NextResponse.json({
      success: true,
      data: news,
      count: news.length,
    })
  } catch (error) {
    console.error('Failed to fetch news by IDs:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
