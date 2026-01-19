import { collectAllEconomyData } from '@/lib/scraper/hybrid-economy'

/**
 * 하이브리드 스크래퍼 테스트
 */
async function testHybridScraper() {
  console.log('🚀 하이브리드 스크래퍼 테스트 시작...\n')

  try {
    const startTime = Date.now()
    const data = await collectAllEconomyData()
    const duration = Date.now() - startTime

    console.log('✅ 데이터 수집 성공!')
    console.log(`⏱️  소요 시간: ${duration}ms\n`)

    console.log('📊 국내 지수 (네이버 금융):')
    console.log(
      `  - KOSPI: ${data.domestic.kospi.value} (${data.domestic.kospi.change}, ${data.domestic.kospi.changePercent}%) [${data.domestic.kospi.changeType}]`
    )
    console.log(
      `  - KOSDAQ: ${data.domestic.kosdaq.value} (${data.domestic.kosdaq.change}, ${data.domestic.kosdaq.changePercent}%) [${data.domestic.kosdaq.changeType}]\n`
    )

    console.log('🌍 해외 지수 (Finnhub API):')
    console.log(
      `  - S&P 500: ${data.international.sp500.value} (${data.international.sp500.change}, ${data.international.sp500.changePercent}%) [${data.international.sp500.changeType}]`
    )
    console.log(
      `  - NASDAQ: ${data.international.nasdaq.value} (${data.international.nasdaq.change}, ${data.international.nasdaq.changePercent}%) [${data.international.nasdaq.changeType}]`
    )
    console.log(
      `  - Dow: ${data.international.dow.value} (${data.international.dow.change}, ${data.international.dow.changePercent}%) [${data.international.dow.changeType}]`
    )
    console.log(
      `  - Nikkei: ${data.international.nikkei.value} (${data.international.nikkei.change}, ${data.international.nikkei.changePercent}%) [${data.international.nikkei.changeType}]\n`
    )

    console.log('💱 환율 (네이버 금융):')
    console.log(
      `  - USD/KRW: ${data.exchange.usdKrw.value} (${data.exchange.usdKrw.change}, ${data.exchange.usdKrw.changePercent}%) [${data.exchange.usdKrw.changeType}]`
    )
    console.log(
      `  - JPY/KRW: ${data.exchange.jpyKrw.value} (${data.exchange.jpyKrw.change}, ${data.exchange.jpyKrw.changePercent}%) [${data.exchange.jpyKrw.changeType}]`
    )
    console.log(
      `  - EUR/KRW: ${data.exchange.eurKrw.value} (${data.exchange.eurKrw.change}, ${data.exchange.eurKrw.changePercent}%) [${data.exchange.eurKrw.changeType}]`
    )
    console.log(
      `  - CNY/KRW: ${data.exchange.cnyKrw.value} (${data.exchange.cnyKrw.change}, ${data.exchange.cnyKrw.changePercent}%) [${data.exchange.cnyKrw.changeType}]\n`
    )

    console.log('💰 금시세 (네이버 금융):')
    console.log(
      `  - 국제 금: ${data.metals.gold.value} (${data.metals.gold.change}, ${data.metals.gold.changePercent}%) [${data.metals.gold.changeType}]\n`
    )

    console.log('₿ 암호화폐 (Finnhub API):')
    console.log(
      `  - Bitcoin: ${data.crypto.bitcoin.value} (${data.crypto.bitcoin.change}, ${data.crypto.bitcoin.changePercent}%) [${data.crypto.bitcoin.changeType}]`
    )
    console.log(
      `  - Ethereum: ${data.crypto.ethereum.value} (${data.crypto.ethereum.change}, ${data.crypto.ethereum.changePercent}%) [${data.crypto.ethereum.changeType}]`
    )
    console.log(
      `  - Ripple: ${data.crypto.ripple.value} (${data.crypto.ripple.change}, ${data.crypto.ripple.changePercent}%) [${data.crypto.ripple.changeType}]`
    )
    console.log(
      `  - Cardano: ${data.crypto.cardano.value} (${data.crypto.cardano.change}, ${data.crypto.cardano.changePercent}%) [${data.crypto.cardano.changeType}]\n`
    )

    console.log(`📅 마지막 업데이트: ${data.lastUpdated}`)

    // 데이터 검증
    console.log('\n🔍 데이터 검증:')
    let successCount = 0
    let totalCount = 0

    const checks = [
      { name: 'KOSPI', value: data.domestic.kospi.value },
      { name: 'KOSDAQ', value: data.domestic.kosdaq.value },
      { name: 'S&P 500', value: data.international.sp500.value },
      { name: 'NASDAQ', value: data.international.nasdaq.value },
      { name: 'Dow', value: data.international.dow.value },
      { name: 'Nikkei', value: data.international.nikkei.value },
      { name: 'USD/KRW', value: data.exchange.usdKrw.value },
      { name: '금시세', value: data.metals.gold.value },
      { name: 'Bitcoin', value: data.crypto.bitcoin.value },
      { name: 'Ethereum', value: data.crypto.ethereum.value },
    ]

    checks.forEach((check) => {
      totalCount++
      if (check.value !== '데이터 없음' && check.value !== '0') {
        successCount++
        console.log(`  ✅ ${check.name}: 정상`)
      } else {
        console.log(`  ❌ ${check.name}: 데이터 없음`)
      }
    })

    console.log(`\n총 ${successCount}/${totalCount} 항목 성공 (${Math.round((successCount / totalCount) * 100)}%)`)
  } catch (error) {
    console.error('❌ 데이터 수집 실패:', error)
    if (error instanceof Error) {
      console.error('에러 메시지:', error.message)
      console.error('스택:', error.stack)
    }
  }
}

testHybridScraper()
