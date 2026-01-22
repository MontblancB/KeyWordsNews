/**
 * DART (전자공시시스템) Open API 클라이언트
 * https://opendart.fss.or.kr/
 */

import type { CompanyInfo, FinancialData } from '@/types/stock'

const DART_API_KEY = process.env.DART_API_KEY || ''
const BASE_URL = 'https://opendart.fss.or.kr/api'

/**
 * 주요 종목 코드 -> DART 기업 고유번호 매핑
 * TODO: 전체 매핑 파일 다운로드 기능 추가
 */
const STOCK_CODE_TO_CORP_CODE: Record<string, string> = {
  // KOSPI 주요 종목
  '005930': '00126380', // 삼성전자
  '000660': '00164742', // SK하이닉스
  '035420': '00164779', // NAVER
  '035720': '00164830', // 카카오
  '005380': '00125170', // 현대차
  '051910': '00164560', // LG화학
  '006400': '00126904', // 삼성SDI
  '003670': '00120733', // 포스코퓨처엠
  '105560': '00187301', // KB금융
  '055550': '00173132', // 신한지주
  '000270': '00102037', // 기아
  '012330': '00138987', // 현대모비스
  '066570': '00164869', // LG전자
  '003550': '00120528', // LG
  '034730': '00163092', // SK
  '028260': '00155148', // 삼성물산
  '207940': '00413046', // 삼성바이오로직스
  '068270': '00167519', // 셀트리온
  '005490': '00125821', // POSCO홀딩스
  '017670': '00144080', // SK텔레콤
  '030200': '00155530', // KT
  '018260': '00144394', // 삼성에스디에스
  '032830': '00161421', // 삼성생명
  '086790': '00177432', // 하나금융지주
  '009150': '00132563', // 삼성전기
  '352820': '00877936', // 하이브
  '259960': '00626577', // 크래프톤
  '003490': '00120480', // 대한항공
  '180640': '00341826', // 한진칼
  '010130': '00134011', // 고려아연
  // KOSDAQ 주요 종목
  '247540': '00574489', // 에코프로비엠
  '086520': '00177161', // 에코프로
  '293490': '00699027', // 카카오게임즈
  '263750': '00637493', // 펄어비스
  '041510': '00150478', // 에스엠
}

interface LogEntry {
  timestamp: string
  level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS'
  source: string
  message: string
  data?: any
}

/**
 * 로깅 함수
 */
function log(entry: Omit<LogEntry, 'timestamp'>): void {
  const logEntry: LogEntry = {
    timestamp: new Date().toISOString(),
    ...entry,
  }

  const prefix = `[DART API] [${logEntry.level}] [${logEntry.source}]`
  const message = `${prefix} ${logEntry.message}`

  if (logEntry.level === 'ERROR') {
    console.error(message, logEntry.data || '')
  } else if (logEntry.level === 'WARN') {
    console.warn(message, logEntry.data || '')
  } else {
    console.log(message, logEntry.data || '')
  }
}

/**
 * 종목코드 -> DART 기업 고유번호 변환
 */
export function getCorpCode(stockCode: string): string | null {
  log({
    level: 'INFO',
    source: 'getCorpCode',
    message: `종목코드 변환 시도: ${stockCode}`,
  })

  const corpCode = STOCK_CODE_TO_CORP_CODE[stockCode]

  if (corpCode) {
    log({
      level: 'SUCCESS',
      source: 'getCorpCode',
      message: `변환 성공: ${stockCode} -> ${corpCode}`,
    })
    return corpCode
  }

  log({
    level: 'WARN',
    source: 'getCorpCode',
    message: `매핑되지 않은 종목코드: ${stockCode}`,
  })

  return null
}

/**
 * DART API 호출 공통 함수
 */
async function callDartAPI<T>(endpoint: string, params: Record<string, string>): Promise<T | null> {
  const queryParams = new URLSearchParams({
    crtfc_key: DART_API_KEY,
    ...params,
  })

  const url = `${BASE_URL}/${endpoint}?${queryParams.toString()}`

  log({
    level: 'INFO',
    source: 'callDartAPI',
    message: `API 호출: ${endpoint}`,
    data: { params },
  })

  try {
    const response = await fetch(url)

    if (!response.ok) {
      log({
        level: 'ERROR',
        source: 'callDartAPI',
        message: `HTTP 오류: ${response.status} ${response.statusText}`,
      })
      return null
    }

    const data = await response.json()

    // DART API 에러 체크
    if (data.status && data.status !== '000') {
      log({
        level: 'ERROR',
        source: 'callDartAPI',
        message: `DART API 오류: ${data.message} (${data.status})`,
        data,
      })
      return null
    }

    log({
      level: 'SUCCESS',
      source: 'callDartAPI',
      message: `API 호출 성공: ${endpoint}`,
    })

    return data as T
  } catch (error) {
    log({
      level: 'ERROR',
      source: 'callDartAPI',
      message: `네트워크 오류: ${error instanceof Error ? error.message : String(error)}`,
    })
    return null
  }
}

interface DartCompanyResponse {
  corp_name: string // 정식명칭
  corp_name_eng?: string // 영문명칭
  stock_name?: string // 종목명
  stock_code?: string // 종목코드
  ceo_nm?: string // 대표자명
  corp_cls?: string // 법인구분
  jurir_no?: string // 법인등록번호
  bizr_no?: string // 사업자등록번호
  adres?: string // 주소
  hm_url?: string // 홈페이지
  ir_url?: string // IR홈페이지
  phn_no?: string // 전화번호
  fax_no?: string // 팩스번호
  induty_code?: string // 업종코드
  est_dt?: string // 설립일
  acc_mt?: string // 결산월
}

/**
 * 기업 개황 정보 조회
 */
export async function getDartCompanyInfo(stockCode: string): Promise<Partial<CompanyInfo> | null> {
  const corpCode = getCorpCode(stockCode)

  if (!corpCode) {
    log({
      level: 'WARN',
      source: 'getDartCompanyInfo',
      message: `기업코드 변환 실패로 인한 조회 불가: ${stockCode}`,
    })
    return null
  }

  const data = await callDartAPI<DartCompanyResponse>('company.json', {
    corp_code: corpCode,
  })

  if (!data) {
    return null
  }

  const collectedFields: string[] = []
  const missingFields: string[] = []

  const companyInfo: Partial<CompanyInfo> = {}

  // 기업명은 항상 있어야 함 (필수 필드)
  if (data.corp_name) {
    companyInfo.industry = '' // 업종코드는 별도 매핑 필요
    collectedFields.push('기업명')
  }

  if (data.ceo_nm) {
    companyInfo.ceo = data.ceo_nm
    collectedFields.push('대표자')
  } else {
    missingFields.push('대표자')
  }

  if (data.est_dt) {
    // YYYYMMDD -> YYYY-MM-DD 변환
    const year = data.est_dt.substring(0, 4)
    const month = data.est_dt.substring(4, 6)
    const day = data.est_dt.substring(6, 8)
    companyInfo.establishedDate = `${year}-${month}-${day}`
    collectedFields.push('설립일')
  } else {
    missingFields.push('설립일')
  }

  if (data.acc_mt) {
    companyInfo.fiscalMonth = data.acc_mt + '월'
    collectedFields.push('결산월')
  } else {
    missingFields.push('결산월')
  }

  if (data.adres) {
    companyInfo.headquarters = data.adres
    collectedFields.push('본사소재지')
  } else {
    missingFields.push('본사소재지')
  }

  if (data.hm_url) {
    companyInfo.website = data.hm_url
    collectedFields.push('홈페이지')
  } else {
    missingFields.push('홈페이지')
  }

  // 업종코드 -> 업종명 변환 (간단한 매핑)
  if (data.induty_code) {
    companyInfo.industry = getIndustryName(data.induty_code)
    collectedFields.push('업종')
  } else {
    missingFields.push('업종')
  }

  log({
    level: 'SUCCESS',
    source: 'getDartCompanyInfo',
    message: `기업정보 수집 완료: ${collectedFields.length}/${collectedFields.length + missingFields.length}개`,
    data: { collected: collectedFields, missing: missingFields },
  })

  return companyInfo
}

interface DartFinancialStatement {
  rcept_no: string // 접수번호
  reprt_code: string // 보고서 코드
  bsns_year: string // 사업 연도
  corp_code: string // 고유번호
  sj_div: string // 재무제표구분
  sj_nm: string // 재무제표명
  account_id: string // 계정ID
  account_nm: string // 계정명
  account_detail?: string // 계정상세
  thstrm_nm: string // 당기명
  thstrm_amount: string // 당기금액
  thstrm_add_amount?: string // 당기누적금액
  frmtrm_nm?: string // 전기명
  frmtrm_amount?: string // 전기금액
  frmtrm_add_amount?: string // 전기누적금액
  bfefrmtrm_nm?: string // 전전기명
  bfefrmtrm_amount?: string // 전전기금액
  ord: string // 계정과목 정렬순서
  currency: string // 통화 단위
}

interface DartFinancialResponse {
  status: string
  message: string
  list?: DartFinancialStatement[]
}

/**
 * 재무제표 조회
 */
export async function getDartFinancials(
  stockCode: string,
  year: string = new Date().getFullYear().toString()
): Promise<FinancialData[]> {
  const corpCode = getCorpCode(stockCode)

  if (!corpCode) {
    log({
      level: 'WARN',
      source: 'getDartFinancials',
      message: `기업코드 변환 실패로 인한 조회 불가: ${stockCode}`,
    })
    return []
  }

  // 사업보고서 (연간)
  const data = await callDartAPI<DartFinancialResponse>('fnlttSinglAcnt.json', {
    corp_code: corpCode,
    bsns_year: year,
    reprt_code: '11011', // 사업보고서
  })

  if (!data || !data.list || data.list.length === 0) {
    log({
      level: 'WARN',
      source: 'getDartFinancials',
      message: `재무제표 데이터 없음: ${stockCode} (${year}년)`,
    })
    return []
  }

  const statements = data.list

  // 계정과목별로 데이터 추출
  const findAccount = (keywords: string[]): string => {
    for (const keyword of keywords) {
      const account = statements.find(
        (item) =>
          item.account_nm.includes(keyword) &&
          item.sj_div === 'CFS' // 연결재무제표
      )
      if (account && account.thstrm_amount) {
        return account.thstrm_amount
      }
    }
    return '-'
  }

  const financials: FinancialData[] = []
  const collectedFields: string[] = []
  const missingFields: string[] = []

  const financial: FinancialData = {
    period: year,
    periodType: 'annual',
    revenue: findAccount(['매출액', '영업수익', '수익(매출액)']),
    costOfRevenue: findAccount(['매출원가', '영업비용']),
    grossProfit: findAccount(['매출총이익', '매출총손익']),
    grossMargin: '-', // 계산 필요
    operatingProfit: findAccount(['영업이익', '영업손익']),
    operatingMargin: '-', // 계산 필요
    netIncome: findAccount(['당기순이익', '순이익', '당기순손익']),
    netMargin: '-', // 계산 필요
    ebitda: '-', // 직접 제공 안 함
    totalAssets: findAccount(['자산총계', '자산총액']),
    totalLiabilities: findAccount(['부채총계', '부채총액']),
    totalEquity: findAccount(['자본총계', '자본총액']),
    debtRatio: '-', // 계산 필요
    operatingCashFlow: '-', // 현금흐름표 별도 조회 필요
    freeCashFlow: '-', // 현금흐름표 별도 조회 필요
  }

  // 수집 통계
  Object.entries(financial).forEach(([key, value]) => {
    if (key === 'period' || key === 'periodType') return

    if (value !== '-') {
      collectedFields.push(key)
    } else {
      missingFields.push(key)
    }
  })

  // 비율 계산
  const parseAmount = (value: string): number => {
    if (value === '-') return 0
    return parseFloat(value.replace(/,/g, ''))
  }

  const revenue = parseAmount(financial.revenue)
  const costOfRevenue = parseAmount(financial.costOfRevenue)
  const grossProfit = parseAmount(financial.grossProfit)
  const operatingProfit = parseAmount(financial.operatingProfit)
  const netIncome = parseAmount(financial.netIncome)
  const totalAssets = parseAmount(financial.totalAssets)
  const totalLiabilities = parseAmount(financial.totalLiabilities)
  const totalEquity = parseAmount(financial.totalEquity)

  // 매출총이익률 = (매출총이익 / 매출액) * 100
  if (revenue > 0 && grossProfit > 0) {
    financial.grossMargin = ((grossProfit / revenue) * 100).toFixed(2) + '%'
  }

  // 영업이익률 = (영업이익 / 매출액) * 100
  if (revenue > 0 && operatingProfit > 0) {
    financial.operatingMargin = ((operatingProfit / revenue) * 100).toFixed(2) + '%'
  }

  // 순이익률 = (당기순이익 / 매출액) * 100
  if (revenue > 0 && netIncome > 0) {
    financial.netMargin = ((netIncome / revenue) * 100).toFixed(2) + '%'
  }

  // 부채비율 = (부채총계 / 자본총계) * 100
  if (totalEquity > 0 && totalLiabilities > 0) {
    financial.debtRatio = ((totalLiabilities / totalEquity) * 100).toFixed(2) + '%'
  }

  financials.push(financial)

  log({
    level: 'SUCCESS',
    source: 'getDartFinancials',
    message: `재무제표 수집 완료: ${collectedFields.length}/${collectedFields.length + missingFields.length}개`,
    data: { year, collected: collectedFields, missing: missingFields },
  })

  return financials
}

/**
 * 업종코드 -> 업종명 변환
 * 간단한 매핑만 제공 (전체 매핑은 별도 파일 필요)
 */
function getIndustryName(code: string): string {
  const industryMap: Record<string, string> = {
    '264': '전자부품, 컴퓨터, 영상, 음향 및 통신장비 제조업',
    '268': '의료, 정밀, 광학기기 및 시계 제조업',
    '291': '자동차 및 트레일러 제조업',
    '620': '컴퓨터 프로그래밍, 시스템 통합 및 관리업',
    '582': '소프트웨어 개발 및 공급업',
    '591': '영화, 비디오물 및 방송프로그램 제작업',
    '722': '건축기술, 엔지니어링 및 관련 기술 서비스업',
    '642': '금융지주회사',
    '201': '기초 화학물질 제조업',
    '241': '1차 철강 제조업',
  }

  return industryMap[code] || code
}
