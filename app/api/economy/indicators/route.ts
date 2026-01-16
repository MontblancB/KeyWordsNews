import { NextResponse } from 'next/server'
import type { EconomyData, ChangeType } from '@/types/economy'

/**
 * 경제 지표 API
 * 네이버 금융에서 주요 경제 지표를 스크래핑하여 반환
 */
export async function GET() {
  try {
    // 간단한 Mock 데이터로 먼저 구현
    // 실제로는 네이버 금융 API 또는 스크래핑으로 대체 가능
    const mockData: EconomyData = {
      domestic: {
        kospi: {
          name: 'KOSPI',
          value: '2,650.45',
          change: '+32.15',
          changePercent: '+1.23',
          changeType: 'up' as ChangeType,
        },
        kosdaq: {
          name: 'KOSDAQ',
          value: '850.23',
          change: '+6.78',
          changePercent: '+0.80',
          changeType: 'up' as ChangeType,
        },
      },
      international: {
        sp500: {
          name: 'S&P 500',
          value: '4,567.89',
          change: '-12.34',
          changePercent: '-0.27',
          changeType: 'down' as ChangeType,
        },
        nasdaq: {
          name: 'NASDAQ',
          value: '14,234.56',
          change: '+45.67',
          changePercent: '+0.32',
          changeType: 'up' as ChangeType,
        },
        dow: {
          name: 'Dow Jones',
          value: '35,678.90',
          change: '-89.12',
          changePercent: '-0.25',
          changeType: 'down' as ChangeType,
        },
        nikkei: {
          name: 'Nikkei 225',
          value: '32,456.78',
          change: '+123.45',
          changePercent: '+0.38',
          changeType: 'up' as ChangeType,
        },
      },
      exchange: {
        usdKrw: {
          name: 'USD/KRW',
          value: '1,320.50',
          change: '-7.30',
          changePercent: '-0.55',
          changeType: 'down' as ChangeType,
        },
        jpyKrw: {
          name: 'JPY(100)/KRW',
          value: '905.20',
          change: '+3.45',
          changePercent: '+0.38',
          changeType: 'up' as ChangeType,
        },
        eurKrw: {
          name: 'EUR/KRW',
          value: '1,445.60',
          change: '-5.20',
          changePercent: '-0.36',
          changeType: 'down' as ChangeType,
        },
        cnyKrw: {
          name: 'CNY/KRW',
          value: '185.40',
          change: '+1.10',
          changePercent: '+0.60',
          changeType: 'up' as ChangeType,
        },
      },
      gold: {
        international: {
          name: '국제 금',
          value: '$2,078.50',
          change: '+12.30',
          changePercent: '+0.60',
          changeType: 'up' as ChangeType,
        },
      },
      lastUpdated: new Date().toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
    }

    return NextResponse.json({
      success: true,
      data: mockData,
    })
  } catch (error) {
    console.error('Economy indicators error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch economy indicators',
      },
      { status: 500 }
    )
  }
}
