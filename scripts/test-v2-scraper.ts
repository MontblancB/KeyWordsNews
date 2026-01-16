import { scrapeAllIndicatorsV2 } from '@/lib/scraper/naver-finance-v2'

/**
 * V2 스크래퍼 테스트
 */
async function testV2Scraper() {
  console.log('🚀 V2 스크래퍼 테스트 시작...\n')

  try {
    const startTime = Date.now()
    const data = await scrapeAllIndicatorsV2()
    const duration = Date.now() - startTime

    console.log('✅ 스크래핑 성공!')
    console.log(`⏱️  소요 시간: ${duration}ms\n`)

    console.log('📊 국내 지수:')
    console.log(`  - KOSPI: ${data.domestic.kospi.value} (${data.domestic.kospi.change}, ${data.domestic.kospi.changePercent}%) [${data.domestic.kospi.changeType}]`)
    console.log(`  - KOSDAQ: ${data.domestic.kosdaq.value} (${data.domestic.kosdaq.change}, ${data.domestic.kosdaq.changePercent}%) [${data.domestic.kosdaq.changeType}]\n`)

    console.log('💱 환율:')
    console.log(`  - USD/KRW: ${data.exchange.usdKrw.value} (${data.exchange.usdKrw.change}, ${data.exchange.usdKrw.changePercent}%) [${data.exchange.usdKrw.changeType}]`)
    console.log(`  - JPY/KRW: ${data.exchange.jpyKrw.value} (${data.exchange.jpyKrw.change}, ${data.exchange.jpyKrw.changePercent}%) [${data.exchange.jpyKrw.changeType}]`)
    console.log(`  - EUR/KRW: ${data.exchange.eurKrw.value} (${data.exchange.eurKrw.change}, ${data.exchange.eurKrw.changePercent}%) [${data.exchange.eurKrw.changeType}]`)
    console.log(`  - CNY/KRW: ${data.exchange.cnyKrw.value} (${data.exchange.cnyKrw.change}, ${data.exchange.cnyKrw.changePercent}%) [${data.exchange.cnyKrw.changeType}]\n`)

    console.log('💰 금시세:')
    console.log(`  - 국제 금: ${data.gold.international.value} (${data.gold.international.change}, ${data.gold.international.changePercent}%) [${data.gold.international.changeType}]\n`)

    console.log('🌍 해외 지수:')
    console.log(`  - S&P 500: ${data.international.sp500.value}`)
    console.log(`  - NASDAQ: ${data.international.nasdaq.value}`)
    console.log(`  - Dow: ${data.international.dow.value}`)
    console.log(`  - Nikkei: ${data.international.nikkei.value}\n`)

    console.log(`📅 마지막 업데이트: ${data.lastUpdated}`)

    // 데이터 검증
    console.log('\n🔍 V1 vs V2 비교:')
    let improvements = 0

    if (data.domestic.kospi.changeType !== 'unchanged') {
      console.log('  ✅ KOSPI changeType 개선됨')
      improvements++
    }
    if (data.exchange.usdKrw.changePercent !== '0') {
      console.log('  ✅ 환율 changePercent 개선됨')
      improvements++
    }
    if (data.gold.international.value !== '데이터 없음') {
      console.log('  ✅ 금시세 데이터 수집 성공')
      improvements++
    }

    console.log(`\n총 ${improvements}개 항목 개선됨`)

  } catch (error) {
    console.error('❌ 스크래핑 실패:', error)
    if (error instanceof Error) {
      console.error('에러 메시지:', error.message)
    }
  }
}

testV2Scraper()
