import { scrapeAllIndicators } from '@/lib/scraper/naver-finance'

/**
 * 네이버 금융 스크래퍼 테스트
 */
async function testNaverScraper() {
  console.log('🚀 네이버 금융 스크래핑 테스트 시작...\n')

  try {
    const startTime = Date.now()
    const data = await scrapeAllIndicators()
    const duration = Date.now() - startTime

    console.log('✅ 스크래핑 성공!')
    console.log(`⏱️  소요 시간: ${duration}ms\n`)

    console.log('📊 국내 지수:')
    console.log(`  - KOSPI: ${data.domestic.kospi.value} (${data.domestic.kospi.change}, ${data.domestic.kospi.changePercent}%) [${data.domestic.kospi.changeType}]`)
    console.log(`  - KOSDAQ: ${data.domestic.kosdaq.value} (${data.domestic.kosdaq.change}, ${data.domestic.kosdaq.changePercent}%) [${data.domestic.kosdaq.changeType}]\n`)

    console.log('🌍 해외 지수:')
    console.log(`  - S&P 500: ${data.international.sp500.value} (${data.international.sp500.change}, ${data.international.sp500.changePercent}%) [${data.international.sp500.changeType}]`)
    console.log(`  - NASDAQ: ${data.international.nasdaq.value} (${data.international.nasdaq.change}, ${data.international.nasdaq.changePercent}%) [${data.international.nasdaq.changeType}]`)
    console.log(`  - Dow: ${data.international.dow.value} (${data.international.dow.change}, ${data.international.dow.changePercent}%) [${data.international.dow.changeType}]`)
    console.log(`  - Nikkei: ${data.international.nikkei.value} (${data.international.nikkei.change}, ${data.international.nikkei.changePercent}%) [${data.international.nikkei.changeType}]\n`)

    console.log('💱 환율:')
    console.log(`  - USD/KRW: ${data.exchange.usdKrw.value} (${data.exchange.usdKrw.change}, ${data.exchange.usdKrw.changePercent}%) [${data.exchange.usdKrw.changeType}]`)
    console.log(`  - JPY/KRW: ${data.exchange.jpyKrw.value} (${data.exchange.jpyKrw.change}, ${data.exchange.jpyKrw.changePercent}%) [${data.exchange.jpyKrw.changeType}]`)
    console.log(`  - EUR/KRW: ${data.exchange.eurKrw.value} (${data.exchange.eurKrw.change}, ${data.exchange.eurKrw.changePercent}%) [${data.exchange.eurKrw.changeType}]`)
    console.log(`  - CNY/KRW: ${data.exchange.cnyKrw.value} (${data.exchange.cnyKrw.change}, ${data.exchange.cnyKrw.changePercent}%) [${data.exchange.cnyKrw.changeType}]\n`)

    console.log('💰 금시세:')
    console.log(`  - 국제 금: ${data.gold.international.value} (${data.gold.international.change}, ${data.gold.international.changePercent}%) [${data.gold.international.changeType}]\n`)

    console.log(`📅 마지막 업데이트: ${data.lastUpdated}`)

    // 데이터 검증
    console.log('\n🔍 데이터 검증:')
    let hasError = false

    if (data.domestic.kospi.value === '데이터 없음' || data.domestic.kospi.value === '0') {
      console.log('  ❌ KOSPI 데이터 없음')
      hasError = true
    }
    if (data.domestic.kosdaq.value === '데이터 없음' || data.domestic.kosdaq.value === '0') {
      console.log('  ❌ KOSDAQ 데이터 없음')
      hasError = true
    }
    if (data.exchange.usdKrw.value === '데이터 없음' || data.exchange.usdKrw.value === '0') {
      console.log('  ❌ USD/KRW 데이터 없음')
      hasError = true
    }
    if (data.international.sp500.value === '데이터 없음' || data.international.sp500.value === '0') {
      console.log('  ❌ S&P 500 데이터 없음')
      hasError = true
    }
    if (data.gold.international.value === '데이터 없음' || data.gold.international.value === '0') {
      console.log('  ❌ 금시세 데이터 없음')
      hasError = true
    }

    if (!hasError) {
      console.log('  ✅ 모든 데이터 정상')
    }

  } catch (error) {
    console.error('❌ 스크래핑 실패:', error)
    if (error instanceof Error) {
      console.error('에러 메시지:', error.message)
      console.error('스택:', error.stack)
    }
  }
}

testNaverScraper()
