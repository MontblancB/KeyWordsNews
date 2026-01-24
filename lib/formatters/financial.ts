/**
 * 재무 데이터 포맷팅 유틸리티
 *
 * ⚠️ 주의:
 * - FnGuide(한국 주식)는 "억원" 단위로 데이터를 제공
 * - Yahoo Finance(미국 주식)는 이미 formatLargeNumber로 포맷된 값을 제공
 */

/**
 * 숫자 문자열을 파싱하여 숫자로 변환
 * 예: "1,234,567" -> 1234567
 */
function parseFinancialNumber(value: string): number | null {
  if (!value || value === '-' || value === 'N/A') return null

  // 쉼표 제거 후 숫자만 추출
  const cleaned = value.replace(/,/g, '').replace(/[^\d.-]/g, '')
  const num = parseFloat(cleaned)

  return isNaN(num) ? null : num
}

/**
 * 재무제표 금액 포맷팅 (단위 명시)
 *
 * ⚠️ 중요: FnGuide는 "억원" 단위로 데이터를 제공하므로
 * 이 함수는 쉼표만 추가하고 "억원" 단위를 명시합니다.
 *
 * @param value 숫자 문자열 (예: "12345" = 12,345억원)
 * @param isKorean 한국 주식 여부
 * @returns 포맷된 문자열 (예: "12,345억원" 또는 "12,345조")
 */
export function formatFinancialAmount(value: string, isKorean: boolean = true): string {
  // 특수 값 처리
  if (!value || value === '-' || value === 'N/A') return value

  // 이미 단위가 포함된 경우 (Yahoo Finance에서 formatLargeNumber로 처리된 값)
  if (value.includes('억') || value.includes('조') || value.includes('만')) {
    // 이미 포맷된 값은 그대로 반환
    return value
  }

  const num = parseFinancialNumber(value)
  if (num === null) return value

  const absNum = Math.abs(num)
  const isNegative = num < 0
  const sign = isNegative ? '-' : ''

  if (isKorean) {
    // 한국 주식: FnGuide는 "억원" 단위로 제공
    // 예: "12345" → "12,345억원"
    return `${sign}${absNum.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}억원`
  } else {
    // 미국 주식: Yahoo Finance에서 이미 포맷된 값을 제공하므로
    // 이 분기는 거의 사용되지 않음
    return value
  }
}

/**
 * 비율 값 포맷팅 (%, 배수 등)
 * @param value 비율 문자열 (예: "12.34%" 또는 "1.23배")
 * @returns 포맷된 문자열
 */
export function formatFinancialRatio(value: string): string {
  if (!value || value === '-' || value === 'N/A') return value

  // 이미 %나 배가 포함되어 있으면 그대로 반환
  if (value.includes('%') || value.includes('배')) return value

  const num = parseFinancialNumber(value)
  if (num === null) return value

  // 소수점 2자리까지 표시
  return num.toLocaleString('ko-KR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

/**
 * 일반 숫자에 쉼표 추가
 * @param value 숫자 문자열
 * @returns 쉼표가 추가된 문자열
 */
export function formatNumberWithCommas(value: string): string {
  if (!value || value === '-' || value === 'N/A') return value

  const num = parseFinancialNumber(value)
  if (num === null) return value

  return num.toLocaleString('ko-KR')
}
