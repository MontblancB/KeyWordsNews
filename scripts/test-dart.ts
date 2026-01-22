/**
 * DART (전자공시시스템) Open API 테스트
 *
 * API Key 발급: https://opendart.fss.or.kr/
 * 무료, 간단한 회원가입 후 즉시 발급
 */

const DART_API_KEY = process.env.DART_API_KEY || ''

interface TestResult {
  success: boolean
  endpoint: string
  symbol?: string
  status?: string
  dataReceived: string[]
  dataMissing: string[]
  error?: string
  rawData?: any
}

/**
 * 기업 고유번호 조회
 * 종목코드 -> DART 기업 고유번호 변환
 */
async function getCorpCode(stockCode: string): Promise<string | null> {
  // DART에서는 기업 고유번호를 사용
  // 공개된 기업코드 매핑 파일 다운로드 필요
  // https://opendart.fss.or.kr/api/corpCode.xml?crtfc_key=API_KEY

  console.log(`\n[기업코드 매핑 조회]`)
  console.log(`⚠️  DART API는 기업 고유번호를 사용합니다.`)
  console.log(`   종목코드(${stockCode}) -> 기업 고유번호 변환이 필요합니다.`)
  console.log(`   corpCode.xml 파일을 다운로드하여 매핑해야 합니다.`)

  // 삼성전자 기업 고유번호 (알려진 값)
  if (stockCode === '005930') {
    return '00126380'
  }

  // 네이버 기업 고유번호
  if (stockCode === '035420') {
    return '00164779'
  }

  return null
}

/**
 * 기업 개황 정보 조회
 */
async function testCompanyInfo(corpCode: string): Promise<TestResult> {
  const endpoint = `https://opendart.fss.or.kr/api/company.json?crtfc_key=${DART_API_KEY}&corp_code=${corpCode}`

  console.log(`\n[기업 개황 테스트] DART Company API`)

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

    // 에러 응답 체크
    if (data.status && data.status !== '000') {
      return {
        success: false,
        endpoint,
        dataReceived: [],
        dataMissing: [],
        error: `DART API Error: ${data.message} (${data.status})`,
        rawData: data,
      }
    }

    const dataReceived: string[] = []
    const dataMissing: string[] = []

    if (data.corp_name) dataReceived.push('기업명')
    else dataMissing.push('기업명')

    if (data.corp_name_eng) dataReceived.push('영문명')
    else dataMissing.push('영문명')

    if (data.stock_name) dataReceived.push('종목명')
    else dataMissing.push('종목명')

    if (data.stock_code) dataReceived.push('종목코드')
    else dataMissing.push('종목코드')

    if (data.ceo_nm) dataReceived.push('대표자명')
    else dataMissing.push('대표자명')

    if (data.corp_cls) dataReceived.push('법인구분')
    else dataMissing.push('법인구분')

    if (data.jurir_no) dataReceived.push('법인등록번호')
    else dataMissing.push('법인등록번호')

    if (data.bizr_no) dataReceived.push('사업자등록번호')
    else dataMissing.push('사업자등록번호')

    if (data.adres) dataReceived.push('주소')
    else dataMissing.push('주소')

    if (data.hm_url) dataReceived.push('홈페이지')
    else dataMissing.push('홈페이지')

    if (data.ir_url) dataReceived.push('IR홈페이지')
    else dataMissing.push('IR홈페이지')

    if (data.phn_no) dataReceived.push('전화번호')
    else dataMissing.push('전화번호')

    if (data.fax_no) dataReceived.push('팩스번호')
    else dataMissing.push('팩스번호')

    if (data.induty_code) dataReceived.push('업종코드')
    else dataMissing.push('업종코드')

    if (data.est_dt) dataReceived.push('설립일')
    else dataMissing.push('설립일')

    if (data.acc_mt) dataReceived.push('결산월')
    else dataMissing.push('결산월')

    console.log(`✅ 수집 성공 (${dataReceived.length}개): ${dataReceived.join(', ')}`)
    if (dataMissing.length > 0) {
      console.log(`❌ 수집 실패 (${dataMissing.length}개): ${dataMissing.join(', ')}`)
    }

    console.log(`\n📊 기업정보 샘플:`)
    console.log(`  - 기업명: ${data.corp_name}`)
    console.log(`  - 종목명: ${data.stock_name}`)
    console.log(`  - 종목코드: ${data.stock_code}`)
    console.log(`  - 대표자: ${data.ceo_nm}`)
    console.log(`  - 설립일: ${data.est_dt}`)
    console.log(`  - 주소: ${data.adres}`)
    console.log(`  - 홈페이지: ${data.hm_url}`)
    console.log(`  - 업종코드: ${data.induty_code}`)

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
 * 재무제표 조회 (단일 회사)
 */
async function testFinancialStatements(corpCode: string, year: string = '2024'): Promise<TestResult> {
  const endpoint = `https://opendart.fss.or.kr/api/fnlttSinglAcnt.json?crtfc_key=${DART_API_KEY}&corp_code=${corpCode}&bsns_year=${year}&reprt_code=11011`

  console.log(`\n[재무제표 테스트] DART Financial Statements API`)
  console.log(`   - 연도: ${year}`)
  console.log(`   - 보고서 코드: 11011 (사업보고서)`)

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

    // 에러 응답 체크
    if (data.status && data.status !== '000') {
      return {
        success: false,
        endpoint,
        dataReceived: [],
        dataMissing: [],
        error: `DART API Error: ${data.message} (${data.status})`,
        rawData: data,
      }
    }

    const list = data.list || []

    if (list.length === 0) {
      return {
        success: false,
        endpoint,
        dataReceived: [],
        dataMissing: [],
        error: '재무제표 데이터가 없습니다.',
        rawData: data,
      }
    }

    const dataReceived: string[] = []
    const dataMissing: string[] = []

    // 재무제표 항목 확인
    const accounts = list.map((item: any) => item.account_nm)
    const uniqueAccounts = [...new Set(accounts)]

    console.log(`\n📊 재무제표 항목 (${uniqueAccounts.length}개):`)
    uniqueAccounts.slice(0, 20).forEach((account: string) => {
      console.log(`  - ${account}`)
    })

    if (uniqueAccounts.length > 20) {
      console.log(`  ... 외 ${uniqueAccounts.length - 20}개 항목`)
    }

    // 주요 항목 확인
    const hasRevenue = accounts.some((acc: string) => acc.includes('매출') || acc.includes('영업수익'))
    const hasOperatingProfit = accounts.some((acc: string) => acc.includes('영업이익'))
    const hasNetIncome = accounts.some((acc: string) => acc.includes('당기순이익'))
    const hasTotalAssets = accounts.some((acc: string) => acc.includes('자산총계'))
    const hasTotalLiabilities = accounts.some((acc: string) => acc.includes('부채총계'))
    const hasTotalEquity = accounts.some((acc: string) => acc.includes('자본총계'))

    if (hasRevenue) dataReceived.push('매출액/영업수익')
    else dataMissing.push('매출액/영업수익')

    if (hasOperatingProfit) dataReceived.push('영업이익')
    else dataMissing.push('영업이익')

    if (hasNetIncome) dataReceived.push('당기순이익')
    else dataMissing.push('당기순이익')

    if (hasTotalAssets) dataReceived.push('자산총계')
    else dataMissing.push('자산총계')

    if (hasTotalLiabilities) dataReceived.push('부채총계')
    else dataMissing.push('부채총계')

    if (hasTotalEquity) dataReceived.push('자본총계')
    else dataMissing.push('자본총계')

    console.log(`\n✅ 주요 항목 수집 성공 (${dataReceived.length}개): ${dataReceived.join(', ')}`)
    if (dataMissing.length > 0) {
      console.log(`❌ 주요 항목 수집 실패 (${dataMissing.length}개): ${dataMissing.join(', ')}`)
    }

    // 샘플 데이터 출력
    console.log(`\n📊 재무제표 샘플 (최근 3개 항목):`)
    list.slice(0, 3).forEach((item: any) => {
      console.log(`  - ${item.account_nm}: ${item.thstrm_amount} (${item.currency})`)
    })

    return {
      success: true,
      endpoint,
      dataReceived,
      dataMissing,
      rawData: { totalItems: list.length, uniqueAccounts: uniqueAccounts.length },
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
  console.log('DART (전자공시시스템) Open API 테스트')
  console.log('API Key:', DART_API_KEY ? '✅ 설정됨' : '❌ 없음')
  console.log('='.repeat(60))

  if (!DART_API_KEY) {
    console.log('\n⚠️  DART API Key가 설정되지 않았습니다.')
    console.log('   1. https://opendart.fss.or.kr/ 접속')
    console.log('   2. 회원가입 (무료)')
    console.log('   3. API Key 발급')
    console.log('   4. .env.local에 DART_API_KEY 추가')
    console.log('\n테스트를 진행하려면 API Key가 필요합니다.')
    process.exit(1)
  }

  // 삼성전자 테스트
  console.log('\n테스트 1: 삼성전자 (005930)')
  console.log('-'.repeat(60))

  const samsungCorpCode = await getCorpCode('005930')
  if (!samsungCorpCode) {
    console.error('❌ 삼성전자 기업 고유번호를 찾을 수 없습니다.')
    return
  }

  console.log(`✅ 기업 고유번호: ${samsungCorpCode}`)

  const results: TestResult[] = []
  results.push(await testCompanyInfo(samsungCorpCode))
  results.push(await testFinancialStatements(samsungCorpCode, '2024'))
  results.push(await testFinancialStatements(samsungCorpCode, '2023'))

  // 결과 요약
  console.log('\n' + '='.repeat(60))
  console.log('테스트 결과 요약')
  console.log('='.repeat(60))

  let totalSuccess = 0
  let totalFailed = 0
  let totalDataReceived = 0
  let totalDataMissing = 0

  results.forEach((result, index) => {
    const testName = ['기업 개황', '재무제표 2024', '재무제표 2023'][index]
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

  console.log(`\nAPI 성공률: ${successRate}%`)
  console.log(`데이터 수집률: ${dataRate}%`)
  console.log('='.repeat(60))

  console.log('\n✅ DART API는 한국 주식 재무제표와 기업정보에 최적화되어 있습니다.')
  console.log('   - 장점: 공식 데이터, 정확함, 무료, 호출 제한 관대')
  console.log('   - 단점: 실시간 시세 없음, 투자지표 직접 제공 안 함')
  console.log('\n💡 추천: Yahoo Finance (시세) + DART (재무/기업정보) 조합')
}

main().catch(console.error)
