/**
 * Finnhub API 한국 주식 테스트
 */

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || ''

interface TestResult {
  success: boolean
  endpoint: string
  dataReceived: string[]
  dataMissing: string[]
  error?: string
  rawData?: any
}

/**
 * 시세 + 기본 정보 테스트 (Quote)
 */
async function testQuote(symbol: string): Promise<TestResult> {
  const endpoint = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`

  console.log(`\n[시세 테스트] Finnhub Quote API`)

  try {
    const response = await fetch(endpoint)

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

    const dataReceived: string[] = []
    const dataMissing: string[] = []

    // 현재가
    if (data.c) dataReceived.push('현재가')
    else dataMissing.push('현재가')

    // 변동가
    if (data.d) dataReceived.push('변동가')
    else dataMissing.push('변동가')

    // 변동률
    if (data.dp) dataReceived.push('변동률')
    else dataMissing.push('변동률')

    // 고가
    if (data.h) dataReceived.push('고가')
    else dataMissing.push('고가')

    // 저가
    if (data.l) dataReceived.push('저가')
    else dataMissing.push('저가')

    // 시가
    if (data.o) dataReceived.push('시가')
    else dataMissing.push('시가')

    // 전일종가
    if (data.pc) dataReceived.push('전일종가')
    else dataMissing.push('전일종가')

    console.log(`✅ 수집 성공: ${dataReceived.join(', ')}`)
    if (dataMissing.length > 0) {
      console.log(`❌ 수집 실패: ${dataMissing.join(', ')}`)
    }
    console.log(`📊 원시 데이터:`, JSON.stringify(data, null, 2))

    return {
      success: true,
      endpoint,
      dataReceived,
      dataMissing,
      rawData: data,
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
 * 기업 프로필 테스트
 */
async function testProfile(symbol: string): Promise<TestResult> {
  const endpoint = `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${FINNHUB_API_KEY}`

  console.log(`\n[기업 프로필 테스트] Finnhub Profile API`)

  try {
    const response = await fetch(endpoint)

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

    // 빈 객체 체크
    if (Object.keys(data).length === 0) {
      return {
        success: false,
        endpoint,
        dataReceived: [],
        dataMissing: ['모든 기업정보'],
        error: 'Empty response - company profile not available',
        rawData: data,
      }
    }

    const dataReceived: string[] = []
    const dataMissing: string[] = []

    if (data.name) dataReceived.push('기업명')
    else dataMissing.push('기업명')

    if (data.ticker) dataReceived.push('티커')
    else dataMissing.push('티커')

    if (data.exchange) dataReceived.push('거래소')
    else dataMissing.push('거래소')

    if (data.country) dataReceived.push('국가')
    else dataMissing.push('국가')

    if (data.currency) dataReceived.push('통화')
    else dataMissing.push('통화')

    if (data.marketCapitalization) dataReceived.push('시가총액')
    else dataMissing.push('시가총액')

    if (data.shareOutstanding) dataReceived.push('발행주식수')
    else dataMissing.push('발행주식수')

    if (data.weburl) dataReceived.push('웹사이트')
    else dataMissing.push('웹사이트')

    if (data.logo) dataReceived.push('로고')
    else dataMissing.push('로고')

    if (data.finnhubIndustry) dataReceived.push('업종')
    else dataMissing.push('업종')

    console.log(`✅ 수집 성공 (${dataReceived.length}개): ${dataReceived.join(', ')}`)
    if (dataMissing.length > 0) {
      console.log(`❌ 수집 실패 (${dataMissing.length}개): ${dataMissing.join(', ')}`)
    }
    console.log(`📊 원시 데이터:`, JSON.stringify(data, null, 2))

    return {
      success: true,
      endpoint,
      dataReceived,
      dataMissing,
      rawData: data,
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
 * 기본 재무 지표 테스트
 */
async function testMetrics(symbol: string): Promise<TestResult> {
  const endpoint = `https://finnhub.io/api/v1/stock/metric?symbol=${symbol}&metric=all&token=${FINNHUB_API_KEY}`

  console.log(`\n[재무 지표 테스트] Finnhub Metrics API`)

  try {
    const response = await fetch(endpoint)

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
    const metric = data.metric || {}

    const dataReceived: string[] = []
    const dataMissing: string[] = []

    // 투자지표
    if (metric.peNormalizedAnnual || metric.peTTM) dataReceived.push('PER')
    else dataMissing.push('PER')

    if (metric.pbAnnual || metric.pbQuarterly) dataReceived.push('PBR')
    else dataMissing.push('PBR')

    if (metric.epsBasicExclExtraItemsAnnual || metric.epsTTM) dataReceived.push('EPS')
    else dataMissing.push('EPS')

    if (metric.bookValuePerShareAnnual) dataReceived.push('BPS')
    else dataMissing.push('BPS')

    if (metric.roeRfy || metric.roeTTM) dataReceived.push('ROE')
    else dataMissing.push('ROE')

    if (metric.roaRfy || metric.roaTTM) dataReceived.push('ROA')
    else dataMissing.push('ROA')

    if (metric.dividendYieldIndicatedAnnual) dataReceived.push('배당수익률')
    else dataMissing.push('배당수익률')

    if (metric.beta) dataReceived.push('베타')
    else dataMissing.push('베타')

    if (metric['52WeekHigh']) dataReceived.push('52주최고가')
    else dataMissing.push('52주최고가')

    if (metric['52WeekLow']) dataReceived.push('52주최저가')
    else dataMissing.push('52주최저가')

    if (metric.currentRatioAnnual || metric.currentRatioQuarterly) dataReceived.push('유동비율')
    else dataMissing.push('유동비율')

    if (metric.quickRatioAnnual || metric.quickRatioQuarterly) dataReceived.push('당좌비율')
    else dataMissing.push('당좌비율')

    console.log(`✅ 수집 성공 (${dataReceived.length}개): ${dataReceived.join(', ')}`)
    if (dataMissing.length > 0) {
      console.log(`❌ 수집 실패 (${dataMissing.length}개): ${dataMissing.join(', ')}`)
    }

    console.log(`\n📊 투자지표 샘플:`)
    console.log(`  - PER (TTM): ${metric.peTTM}`)
    console.log(`  - PBR (Annual): ${metric.pbAnnual}`)
    console.log(`  - EPS (TTM): ${metric.epsTTM}`)
    console.log(`  - ROE (TTM): ${metric.roeTTM}`)
    console.log(`  - ROA (TTM): ${metric.roaTTM}`)
    console.log(`  - 베타: ${metric.beta}`)
    console.log(`  - 52주 최고: ${metric['52WeekHigh']}`)
    console.log(`  - 52주 최저: ${metric['52WeekLow']}`)

    return {
      success: true,
      endpoint,
      dataReceived,
      dataMissing,
      rawData: metric,
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
 * 메인 테스트
 */
async function main() {
  console.log('='.repeat(60))
  console.log('Finnhub API 한국 주식 테스트')
  console.log('API Key:', FINNHUB_API_KEY ? '✅ 설정됨' : '❌ 없음')
  console.log('='.repeat(60))

  if (!FINNHUB_API_KEY) {
    console.error('❌ FINNHUB_API_KEY 환경변수가 설정되지 않았습니다.')
    process.exit(1)
  }

  // 삼성전자 테스트
  console.log('\n테스트 1: 삼성전자 (005930)')
  console.log('-'.repeat(60))

  const results1: TestResult[] = []
  results1.push(await testQuote('005930'))
  results1.push(await testProfile('005930'))
  results1.push(await testMetrics('005930'))

  // 네이버 테스트
  console.log('\n\n테스트 2: 네이버 (035420)')
  console.log('-'.repeat(60))

  const results2: TestResult[] = []
  results2.push(await testQuote('035420'))
  results2.push(await testProfile('035420'))
  results2.push(await testMetrics('035420'))

  // 결과 요약
  console.log('\n' + '='.repeat(60))
  console.log('테스트 결과 요약')
  console.log('='.repeat(60))

  const allResults = [...results1, ...results2]
  let totalSuccess = 0
  let totalFailed = 0
  let totalDataReceived = 0
  let totalDataMissing = 0

  allResults.forEach((result) => {
    if (result.success) {
      totalSuccess++
      totalDataReceived += result.dataReceived.length
      totalDataMissing += result.dataMissing.length
    } else {
      totalFailed++
    }
  })

  console.log(`전체 API 호출: ${allResults.length}개`)
  console.log(`성공: ${totalSuccess}개`)
  console.log(`실패: ${totalFailed}개`)
  console.log(`수집된 데이터 필드: ${totalDataReceived}개`)
  console.log(`누락된 데이터 필드: ${totalDataMissing}개`)

  const successRate = allResults.length > 0 ? ((totalSuccess / allResults.length) * 100).toFixed(1) : '0'
  const dataRate = (totalDataReceived + totalDataMissing) > 0
    ? ((totalDataReceived / (totalDataReceived + totalDataMissing)) * 100).toFixed(1)
    : '0'

  console.log(`\nAPI 성공률: ${successRate}%`)
  console.log(`데이터 수집률: ${dataRate}%`)
  console.log('='.repeat(60))
}

main().catch(console.error)
