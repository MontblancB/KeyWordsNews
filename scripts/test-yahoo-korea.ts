/**
 * Yahoo Finance API 한국 주식 테스트
 * 삼성전자(005930.KS)로 데이터 품질 확인
 */

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

interface TestResult {
  success: boolean
  endpoint: string
  dataReceived: string[]
  dataMissing: string[]
  error?: string
  rawData?: any
}

/**
 * 시세 데이터 테스트
 */
async function testPriceData(symbol: string): Promise<TestResult> {
  const endpoint = `https://query2.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`

  console.log(`\n[시세 테스트] ${endpoint}`)

  try {
    const response = await fetch(endpoint, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      return {
        success: false,
        endpoint,
        dataReceived: [],
        dataMissing: [],
        error: `HTTP ${response.status}: ${response.statusText}`,
      }
    }

    const data = await response.json()
    const result = data?.chart?.result?.[0]

    if (!result) {
      return {
        success: false,
        endpoint,
        dataReceived: [],
        dataMissing: [],
        error: 'No chart data in response',
        rawData: data,
      }
    }

    const meta = result.meta
    const quote = result.indicators?.quote?.[0]

    const dataReceived: string[] = []
    const dataMissing: string[] = []

    // 현재가
    if (meta.regularMarketPrice) dataReceived.push('현재가')
    else dataMissing.push('현재가')

    // 전일 종가
    if (meta.previousClose || meta.chartPreviousClose) dataReceived.push('전일종가')
    else dataMissing.push('전일종가')

    // 고가/저가
    if (quote?.high?.[0] || meta.regularMarketDayHigh) dataReceived.push('고가')
    else dataMissing.push('고가')

    if (quote?.low?.[0] || meta.regularMarketDayLow) dataReceived.push('저가')
    else dataMissing.push('저가')

    // 시가
    if (quote?.open?.[0] || meta.regularMarketOpen) dataReceived.push('시가')
    else dataMissing.push('시가')

    // 거래량
    if (quote?.volume?.[0] || meta.regularMarketVolume) dataReceived.push('거래량')
    else dataMissing.push('거래량')

    console.log(`✅ 수집 성공: ${dataReceived.join(', ')}`)
    if (dataMissing.length > 0) {
      console.log(`❌ 수집 실패: ${dataMissing.join(', ')}`)
    }
    console.log(`📊 원시 데이터:`, JSON.stringify(meta, null, 2))

    return {
      success: true,
      endpoint,
      dataReceived,
      dataMissing,
      rawData: meta,
    }
  } catch (error) {
    return {
      success: false,
      endpoint,
      dataReceived: [],
      dataMissing: [],
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

/**
 * 기업정보 + 투자지표 테스트
 */
async function testCompanyAndIndicators(symbol: string): Promise<TestResult> {
  const endpoint = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=assetProfile,summaryDetail,defaultKeyStatistics,financialData`

  console.log(`\n[기업정보 + 투자지표 테스트] ${endpoint}`)

  try {
    const response = await fetch(endpoint, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      return {
        success: false,
        endpoint,
        dataReceived: [],
        dataMissing: [],
        error: `HTTP ${response.status}: ${response.statusText}`,
      }
    }

    const data = await response.json()
    const result = data?.quoteSummary?.result?.[0]

    if (!result) {
      return {
        success: false,
        endpoint,
        dataReceived: [],
        dataMissing: [],
        error: 'No quoteSummary data in response',
        rawData: data,
      }
    }

    const profile = result.assetProfile || {}
    const summaryDetail = result.summaryDetail || {}
    const keyStats = result.defaultKeyStatistics || {}
    const financialData = result.financialData || {}

    const dataReceived: string[] = []
    const dataMissing: string[] = []

    // 기업정보
    if (profile.industry) dataReceived.push('업종')
    else dataMissing.push('업종')

    if (profile.fullTimeEmployees) dataReceived.push('직원수')
    else dataMissing.push('직원수')

    if (profile.city || profile.country) dataReceived.push('본사소재지')
    else dataMissing.push('본사소재지')

    if (profile.website) dataReceived.push('웹사이트')
    else dataMissing.push('웹사이트')

    if (profile.longBusinessSummary) dataReceived.push('사업내용')
    else dataMissing.push('사업내용')

    if (summaryDetail.marketCap?.raw) dataReceived.push('시가총액')
    else dataMissing.push('시가총액')

    // 투자지표
    if (keyStats.trailingPE?.raw) dataReceived.push('PER')
    else dataMissing.push('PER')

    if (keyStats.priceToBook?.raw) dataReceived.push('PBR')
    else dataMissing.push('PBR')

    if (keyStats.trailingEps?.raw) dataReceived.push('EPS')
    else dataMissing.push('EPS')

    if (keyStats.bookValue?.raw) dataReceived.push('BPS')
    else dataMissing.push('BPS')

    if (financialData.returnOnEquity?.raw) dataReceived.push('ROE')
    else dataMissing.push('ROE')

    if (financialData.returnOnAssets?.raw) dataReceived.push('ROA')
    else dataMissing.push('ROA')

    if (summaryDetail.dividendYield?.raw) dataReceived.push('배당수익률')
    else dataMissing.push('배당수익률')

    if (keyStats.beta?.raw) dataReceived.push('베타')
    else dataMissing.push('베타')

    if (keyStats.fiftyTwoWeekHigh?.raw) dataReceived.push('52주최고가')
    else dataMissing.push('52주최고가')

    if (keyStats.fiftyTwoWeekLow?.raw) dataReceived.push('52주최저가')
    else dataMissing.push('52주최저가')

    console.log(`✅ 수집 성공 (${dataReceived.length}개): ${dataReceived.join(', ')}`)
    if (dataMissing.length > 0) {
      console.log(`❌ 수집 실패 (${dataMissing.length}개): ${dataMissing.join(', ')}`)
    }

    console.log(`\n📊 기업정보 원시 데이터:`)
    console.log(`  - industry: ${profile.industry}`)
    console.log(`  - employees: ${profile.fullTimeEmployees}`)
    console.log(`  - location: ${profile.city}, ${profile.country}`)
    console.log(`  - website: ${profile.website}`)
    console.log(`  - marketCap: ${summaryDetail.marketCap?.fmt}`)

    console.log(`\n📊 투자지표 원시 데이터:`)
    console.log(`  - PER: ${keyStats.trailingPE?.fmt}`)
    console.log(`  - PBR: ${keyStats.priceToBook?.fmt}`)
    console.log(`  - EPS: ${keyStats.trailingEps?.fmt}`)
    console.log(`  - BPS: ${keyStats.bookValue?.fmt}`)
    console.log(`  - ROE: ${financialData.returnOnEquity?.fmt}`)
    console.log(`  - ROA: ${financialData.returnOnAssets?.fmt}`)

    return {
      success: true,
      endpoint,
      dataReceived,
      dataMissing,
      rawData: { profile, summaryDetail, keyStats, financialData },
    }
  } catch (error) {
    return {
      success: false,
      endpoint,
      dataReceived: [],
      dataMissing: [],
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

/**
 * 재무제표 테스트
 */
async function testFinancialData(symbol: string): Promise<TestResult> {
  const endpoint = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=incomeStatementHistory,balanceSheetHistory,cashflowStatementHistory`

  console.log(`\n[재무제표 테스트] ${endpoint}`)

  try {
    const response = await fetch(endpoint, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      return {
        success: false,
        endpoint,
        dataReceived: [],
        dataMissing: [],
        error: `HTTP ${response.status}: ${response.statusText}`,
      }
    }

    const data = await response.json()
    const result = data?.quoteSummary?.result?.[0]

    if (!result) {
      return {
        success: false,
        endpoint,
        dataReceived: [],
        dataMissing: [],
        error: 'No financial data in response',
        rawData: data,
      }
    }

    const incomeStatements = result.incomeStatementHistory?.incomeStatementHistory || []
    const balanceSheets = result.balanceSheetHistory?.balanceSheetStatements || []
    const cashflowStatements = result.cashflowStatementHistory?.cashflowStatements || []

    const dataReceived: string[] = []
    const dataMissing: string[] = []

    if (incomeStatements.length > 0) {
      dataReceived.push(`손익계산서(${incomeStatements.length}개년)`)
      const latest = incomeStatements[0]

      if (latest.totalRevenue) dataReceived.push('매출액')
      else dataMissing.push('매출액')

      if (latest.costOfRevenue) dataReceived.push('매출원가')
      else dataMissing.push('매출원가')

      if (latest.grossProfit) dataReceived.push('매출총이익')
      else dataMissing.push('매출총이익')

      if (latest.operatingIncome) dataReceived.push('영업이익')
      else dataMissing.push('영업이익')

      if (latest.netIncome) dataReceived.push('당기순이익')
      else dataMissing.push('당기순이익')

      if (latest.ebitda) dataReceived.push('EBITDA')
      else dataMissing.push('EBITDA')

      console.log(`\n📊 손익계산서 (${incomeStatements.length}개년):`)
      console.log(`  - 매출액: ${latest.totalRevenue?.fmt}`)
      console.log(`  - 매출원가: ${latest.costOfRevenue?.fmt}`)
      console.log(`  - 매출총이익: ${latest.grossProfit?.fmt}`)
      console.log(`  - 영업이익: ${latest.operatingIncome?.fmt}`)
      console.log(`  - 당기순이익: ${latest.netIncome?.fmt}`)
      console.log(`  - EBITDA: ${latest.ebitda?.fmt}`)
    } else {
      dataMissing.push('손익계산서')
    }

    if (balanceSheets.length > 0) {
      dataReceived.push(`재무상태표(${balanceSheets.length}개년)`)
      const latest = balanceSheets[0]

      if (latest.totalAssets) dataReceived.push('자산총계')
      else dataMissing.push('자산총계')

      if (latest.totalLiab) dataReceived.push('부채총계')
      else dataMissing.push('부채총계')

      if (latest.totalStockholderEquity) dataReceived.push('자본총계')
      else dataMissing.push('자본총계')

      console.log(`\n📊 재무상태표 (${balanceSheets.length}개년):`)
      console.log(`  - 자산총계: ${latest.totalAssets?.fmt}`)
      console.log(`  - 부채총계: ${latest.totalLiab?.fmt}`)
      console.log(`  - 자본총계: ${latest.totalStockholderEquity?.fmt}`)
    } else {
      dataMissing.push('재무상태표')
    }

    if (cashflowStatements.length > 0) {
      dataReceived.push(`현금흐름표(${cashflowStatements.length}개년)`)
      const latest = cashflowStatements[0]

      if (latest.totalCashFromOperatingActivities) dataReceived.push('영업현금흐름')
      else dataMissing.push('영업현금흐름')

      if (latest.freeCashFlow) dataReceived.push('잉여현금흐름')
      else dataMissing.push('잉여현금흐름')

      console.log(`\n📊 현금흐름표 (${cashflowStatements.length}개년):`)
      console.log(`  - 영업현금흐름: ${latest.totalCashFromOperatingActivities?.fmt}`)
      console.log(`  - 잉여현금흐름: ${latest.freeCashFlow?.fmt}`)
    } else {
      dataMissing.push('현금흐름표')
    }

    console.log(`\n✅ 수집 성공 (${dataReceived.length}개): ${dataReceived.join(', ')}`)
    if (dataMissing.length > 0) {
      console.log(`❌ 수집 실패 (${dataMissing.length}개): ${dataMissing.join(', ')}`)
    }

    return {
      success: true,
      endpoint,
      dataReceived,
      dataMissing,
      rawData: { incomeStatements: incomeStatements.length, balanceSheets: balanceSheets.length, cashflowStatements: cashflowStatements.length },
    }
  } catch (error) {
    return {
      success: false,
      endpoint,
      dataReceived: [],
      dataMissing: [],
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

/**
 * 메인 테스트 실행
 */
async function main() {
  console.log('='.repeat(60))
  console.log('Yahoo Finance API 한국 주식 테스트')
  console.log('테스트 종목: 삼성전자 (005930.KS)')
  console.log('='.repeat(60))

  const symbol = '005930.KS'
  const results: TestResult[] = []

  // 1. 시세 테스트
  results.push(await testPriceData(symbol))

  // 2. 기업정보 + 투자지표 테스트
  results.push(await testCompanyAndIndicators(symbol))

  // 3. 재무제표 테스트
  results.push(await testFinancialData(symbol))

  // 결과 요약
  console.log('\n' + '='.repeat(60))
  console.log('테스트 결과 요약')
  console.log('='.repeat(60))

  let totalSuccess = 0
  let totalFailed = 0
  let totalDataReceived = 0
  let totalDataMissing = 0

  results.forEach((result, index) => {
    const testName = ['시세', '기업정보+투자지표', '재무제표'][index]
    console.log(`\n[${testName}]`)

    if (result.success) {
      totalSuccess++
      console.log(`  ✅ 성공`)
      console.log(`  📊 수집: ${result.dataReceived.length}개`)
      totalDataReceived += result.dataReceived.length

      if (result.dataMissing.length > 0) {
        console.log(`  ⚠️  누락: ${result.dataMissing.length}개`)
        totalDataMissing += result.dataMissing.length
      }
    } else {
      totalFailed++
      console.log(`  ❌ 실패: ${result.error}`)
    }
  })

  console.log('\n' + '-'.repeat(60))
  console.log(`전체 API 호출: ${results.length}개`)
  console.log(`성공: ${totalSuccess}개`)
  console.log(`실패: ${totalFailed}개`)
  console.log(`수집된 데이터 필드: ${totalDataReceived}개`)
  console.log(`누락된 데이터 필드: ${totalDataMissing}개`)

  const successRate = results.length > 0 ? ((totalSuccess / results.length) * 100).toFixed(1) : '0'
  const dataRate = (totalDataReceived + totalDataMissing) > 0
    ? ((totalDataReceived / (totalDataReceived + totalDataMissing)) * 100).toFixed(1)
    : '0'

  console.log(`API 성공률: ${successRate}%`)
  console.log(`데이터 수집률: ${dataRate}%`)
  console.log('='.repeat(60))

  // 추가 테스트: KOSDAQ 종목 (네이버)
  console.log('\n\n' + '='.repeat(60))
  console.log('추가 테스트: KOSDAQ 종목 (네이버 035420.KQ)')
  console.log('='.repeat(60))

  const naverSymbol = '035420.KQ'
  await testPriceData(naverSymbol)
  await testCompanyAndIndicators(naverSymbol)
}

main().catch(console.error)
