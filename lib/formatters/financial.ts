/**
 * 재무 데이터 포맷팅 유틸리티
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
 * 숫자를 한국 화폐 단위로 포맷팅
 * @param value 숫자 문자열 (예: "1234567890000")
 * @param isKorean 한국 주식 여부 (true: 원화, false: 달러)
 * @returns 포맷된 문자열 (예: "1조 2,346억원" 또는 "$1.23B")
 */
export function formatFinancialAmount(value: string, isKorean: boolean = true): string {
  const num = parseFinancialNumber(value)

  if (num === null) return value // 파싱 실패 시 원본 반환

  if (isKorean) {
    // 한국 주식: 억원, 조원 단위
    const absNum = Math.abs(num)
    const isNegative = num < 0
    const sign = isNegative ? '-' : ''

    // 조원 (1,000,000,000,000 이상)
    if (absNum >= 1_000_000_000_000) {
      const trillion = absNum / 1_000_000_000_000
      const billion = (absNum % 1_000_000_000_000) / 100_000_000

      if (billion >= 1) {
        return `${sign}${trillion.toFixed(0)}조 ${billion.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}억원`
      }
      return `${sign}${trillion.toLocaleString('ko-KR', { maximumFractionDigits: 2 })}조원`
    }

    // 억원 (100,000,000 이상)
    if (absNum >= 100_000_000) {
      const billion = absNum / 100_000_000
      return `${sign}${billion.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}억원`
    }

    // 만원 (10,000 이상)
    if (absNum >= 10_000) {
      const tenThousand = absNum / 10_000
      return `${sign}${tenThousand.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}만원`
    }

    // 천원 미만
    return `${sign}${absNum.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}원`
  } else {
    // 미국 주식: Million, Billion, Trillion
    const absNum = Math.abs(num)
    const isNegative = num < 0
    const sign = isNegative ? '-' : ''

    // Trillion (1,000,000,000,000 이상)
    if (absNum >= 1_000_000_000_000) {
      const trillion = absNum / 1_000_000_000_000
      return `${sign}$${trillion.toLocaleString('en-US', { maximumFractionDigits: 2 })}T`
    }

    // Billion (1,000,000,000 이상)
    if (absNum >= 1_000_000_000) {
      const billion = absNum / 1_000_000_000
      return `${sign}$${billion.toLocaleString('en-US', { maximumFractionDigits: 2 })}B`
    }

    // Million (1,000,000 이상)
    if (absNum >= 1_000_000) {
      const million = absNum / 1_000_000
      return `${sign}$${million.toLocaleString('en-US', { maximumFractionDigits: 2 })}M`
    }

    // Thousand (1,000 이상)
    if (absNum >= 1_000) {
      const thousand = absNum / 1_000
      return `${sign}$${thousand.toLocaleString('en-US', { maximumFractionDigits: 2 })}K`
    }

    // 천 미만
    return `${sign}$${absNum.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
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
