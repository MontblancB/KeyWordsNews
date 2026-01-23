/**
 * FnGuide 재무제표 스크래퍼 테스트
 */

import { scrapeFinancials } from '../lib/scraper/fnguide'

async function testFnGuideFinancials() {
  console.log('========================================')
  console.log('FnGuide 재무제표 스크래퍼 테스트')
  console.log('========================================\n')

  const testCodes = [
    { code: '005930', name: '삼성전자' },
  ]

  for (const { code, name } of testCodes) {
    console.log(`\n📊 ${name} (${code})`)
    console.log('─'.repeat(80))

    const financials = await scrapeFinancials(code)

    if (financials.length === 0) {
      console.error('❌ 재무제표 데이터를 가져오지 못했습니다.')
      continue
    }

    console.log(`✅ ${financials.length}개 기간 데이터 수집 완료\n`)

    financials.forEach((data, index) => {
      console.log(`\n[${index + 1}] ${data.period} (${data.periodType})`)
      console.log('─'.repeat(40))

      console.log('📈 손익계산서:')
      console.log(`  • 매출액: ${data.revenue}`)
      console.log(`  • 매출원가: ${data.costOfRevenue}`)
      console.log(`  • 매출총이익: ${data.grossProfit}`)
      console.log(`  • 매출총이익률: ${data.grossMargin}`)
      console.log(`  • 영업이익: ${data.operatingProfit}`)
      console.log(`  • 영업이익률: ${data.operatingMargin}`)
      console.log(`  • 당기순이익: ${data.netIncome}`)
      console.log(`  • 순이익률: ${data.netMargin}`)
      console.log(`  • EBITDA: ${data.ebitda}`)

      console.log('\n💰 재무상태표:')
      console.log(`  • 자산총계: ${data.totalAssets}`)
      console.log(`  • 부채총계: ${data.totalLiabilities}`)
      console.log(`  • 자본총계: ${data.totalEquity}`)
      console.log(`  • 부채비율: ${data.debtRatio}`)

      console.log('\n💸 현금흐름표:')
      console.log(`  • 영업현금흐름: ${data.operatingCashFlow}`)
      console.log(`  • 잉여현금흐름: ${data.freeCashFlow}`)
    })

    console.log('\n')
  }

  console.log('\n========================================')
  console.log('테스트 완료')
  console.log('========================================')
}

testFnGuideFinancials()
