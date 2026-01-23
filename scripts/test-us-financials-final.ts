/**
 * 미국 주식 재무제표 스크래퍼 최종 테스트
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { fetchUSFinancialStatements } from '../lib/api/finnhub'

async function testUSFinancials() {
  console.log('========================================')
  console.log('미국 주식 재무제표 스크래퍼 최종 테스트')
  console.log('========================================\n')

  const symbols = ['AAPL', 'TSLA']

  for (const symbol of symbols) {
    console.log(`\n📊 ${symbol}`)
    console.log('─'.repeat(80))

    const financials = await fetchUSFinancialStatements(symbol)

    if (financials.length === 0) {
      console.error('❌ 재무제표 데이터를 가져오지 못했습니다.')
      continue
    }

    console.log(`\n✅ ${financials.length}개 기간 데이터 수집 완료\n`)

    financials.forEach((data, index) => {
      console.log(`\n[${index + 1}] ${data.period} (${data.periodType})`)
      console.log('─'.repeat(40))

      console.log('📈 손익계산서:')
      console.log(`  • 매출액: $${data.revenue} 억`)
      console.log(`  • 매출원가: $${data.costOfRevenue} 억`)
      console.log(`  • 매출총이익: $${data.grossProfit} 억`)
      console.log(`  • 매출총이익률: ${data.grossMargin}`)
      console.log(`  • 영업이익: $${data.operatingProfit} 억`)
      console.log(`  • 영업이익률: ${data.operatingMargin}`)
      console.log(`  • 당기순이익: $${data.netIncome} 억`)
      console.log(`  • 순이익률: ${data.netMargin}`)

      console.log('\n💰 재무상태표:')
      console.log(`  • 자산총계: $${data.totalAssets} 억`)
      console.log(`  • 부채총계: $${data.totalLiabilities} 억`)
      console.log(`  • 자본총계: $${data.totalEquity} 억`)
      console.log(`  • 부채비율: ${data.debtRatio}`)

      console.log('\n💸 현금흐름표:')
      console.log(`  • 영업현금흐름: $${data.operatingCashFlow} 억`)
      console.log(`  • 잉여현금흐름: $${data.freeCashFlow} 억`)
    })
  }

  console.log('\n========================================')
  console.log('테스트 완료')
  console.log('========================================')
}

testUSFinancials()
