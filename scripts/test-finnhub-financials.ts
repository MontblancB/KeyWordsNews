/**
 * Finnhub API 테스트 (미국 주식 재무제표)
 */

// Load environment variables
import { config } from 'dotenv'
config({ path: '.env.local' })

async function testFinnhubFinancials() {
  console.log('========================================')
  console.log('Finnhub API 테스트 (미국 주식 재무제표)')
  console.log('========================================\n')

  const apiKey = process.env.FINNHUB_API_KEY
  if (!apiKey) {
    console.error('❌ FINNHUB_API_KEY not found in environment')
    return
  }

  const symbols = ['AAPL', 'TSLA']

  for (const symbol of symbols) {
    console.log(`\n📊 ${symbol}`)
    console.log('─'.repeat(80))

    try {
      // Finnhub Financials Reported API
      // https://finnhub.io/docs/api/financials-reported
      const url = `https://finnhub.io/api/v1/stock/financials-reported?symbol=${symbol}&token=${apiKey}`

      console.log('🔍 Fetching financial statements...')

      const response = await fetch(url)

      if (!response.ok) {
        console.error(`❌ Failed: ${response.status} ${response.statusText}`)
        const text = await response.text()
        console.error('Response:', text.slice(0, 200))
        continue
      }

      const data = await response.json()

      if (data.error) {
        console.error(`❌ API Error: ${data.error}`)
        continue
      }

      console.log(`✅ Data found:`)
      console.log(`  • Total reports: ${data.data?.length || 0}`)

      if (data.data && data.data.length > 0) {
        const latestReport = data.data[0]
        console.log(`  • Latest report:`)
        console.log(`    - Year: ${latestReport.year}`)
        console.log(`    - Quarter: ${latestReport.quarter || 'Annual'}`)
        console.log(`    - Form: ${latestReport.form}`)
        console.log(`    - Filed date: ${latestReport.filedDate}`)
        console.log(`    - Report keys: ${Object.keys(latestReport.report || {}).length}`)

        // Raw report structure
        const report = latestReport.report
        if (report) {
          console.log(`\n📋 Report structure:`, Object.keys(report))

          // 손익계산서 항목 찾기
          if (report.ic && Array.isArray(report.ic)) {
            console.log(`\n📈 Income Statement (${report.ic.length} items):`)
            // Show first 5 concepts to understand structure
            report.ic.slice(0, 5).forEach((item: any) => {
              console.log(`    - ${item.concept}: ${item.value} (unit: ${item.unit}, label: ${item.label})`)
            })
          }
        }

        // 재무상태표 항목 찾기
        if (report && report.bs) {
          console.log(`\n💰 Balance Sheet (재무상태표):`)
          const bs = report.bs
          console.log(`    - Total Assets: ${bs.find((item: any) => item.concept === 'Assets')?.value || 'N/A'}`)
          console.log(`    - Total Liabilities: ${bs.find((item: any) => item.concept === 'Liabilities')?.value || 'N/A'}`)
          console.log(`    - Stockholders Equity: ${bs.find((item: any) => item.concept === 'StockholdersEquity')?.value || 'N/A'}`)
        }

        // 현금흐름표 항목 찾기
        if (report && report.cf) {
          console.log(`\n💸 Cash Flow Statement (현금흐름표):`)
          const cf = report.cf
          console.log(`    - Operating Cash Flow: ${cf.find((item: any) => item.concept === 'NetCashProvidedByUsedInOperatingActivities')?.value || 'N/A'}`)
          console.log(`    - Investing Cash Flow: ${cf.find((item: any) => item.concept === 'NetCashProvidedByUsedInInvestingActivities')?.value || 'N/A'}`)
          console.log(`    - Financing Cash Flow: ${cf.find((item: any) => item.concept === 'NetCashProvidedByUsedInFinancingActivities')?.value || 'N/A'}`)
        }
      }

    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : error)
    }
  }

  console.log('\n========================================')
  console.log('테스트 완료')
  console.log('========================================')
}

testFinnhubFinancials()
