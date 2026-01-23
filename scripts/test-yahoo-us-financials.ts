/**
 * Yahoo Finance API 테스트 (미국 주식 재무제표)
 */

async function testYahooUSFinancials() {
  console.log('========================================')
  console.log('Yahoo Finance API 테스트 (미국 주식)')
  console.log('========================================\n')

  const symbols = ['AAPL', 'TSLA']

  for (const symbol of symbols) {
    console.log(`\n📊 ${symbol}`)
    console.log('─'.repeat(80))

    try {
      // Yahoo Finance quoteSummary API
      const modules = [
        'incomeStatementHistory',
        'balanceSheetHistory',
        'cashflowStatementHistory',
      ]

      for (const module of modules) {
        console.log(`\n🔍 Testing module: ${module}`)

        const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=${module}`

        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        })

        if (!response.ok) {
          console.error(`❌ Failed: ${response.status} ${response.statusText}`)
          continue
        }

        const data = await response.json()

        if (data.quoteSummary?.error) {
          console.error(`❌ API Error: ${data.quoteSummary.error.description}`)
          continue
        }

        const result = data.quoteSummary?.result?.[0]?.[module]

        if (!result) {
          console.error('❌ No data in response')
          continue
        }

        console.log(`✅ Data found:`)
        console.log(JSON.stringify(result, null, 2).slice(0, 500) + '...')
      }

    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : error)
    }
  }

  console.log('\n========================================')
  console.log('테스트 완료')
  console.log('========================================')
}

testYahooUSFinancials()
