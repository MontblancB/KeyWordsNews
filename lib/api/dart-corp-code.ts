/**
 * DART 전체 상장사 코드 매핑 시스템
 * public/data/corp-code.json 로드
 */

import * as fs from 'fs'
import * as path from 'path'

interface CorpCodeData {
  updatedAt: string
  count: number
  mapping: {
    [stockCode: string]: string // stockCode -> corpCode
  }
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

  const prefix = `[DART CorpCode] [${logEntry.level}] [${logEntry.source}]`
  const message = `${prefix} ${logEntry.message}`

  if (logEntry.level === 'ERROR') {
    console.error(message, logEntry.data || '')
  } else if (logEntry.level === 'WARN') {
    console.warn(message, logEntry.data || '')
  } else {
    console.log(message, logEntry.data || '')
  }
}

// 메모리 캐시
let corpCodeCache: Map<string, string> | null = null // stockCode -> corpCode

/**
 * corp-code.json 로드
 */
function loadCorpCodeJson(): Map<string, string> {
  log({
    level: 'INFO',
    source: 'loadCorpCodeJson',
    message: 'corp-code.json 로드 시작',
  })

  try {
    const jsonPath = path.join(process.cwd(), 'public', 'data', 'corp-code.json')

    if (!fs.existsSync(jsonPath)) {
      log({
        level: 'ERROR',
        source: 'loadCorpCodeJson',
        message: 'corp-code.json 파일이 없습니다. npm run update-dart를 실행하세요.',
      })
      return new Map()
    }

    const jsonContent = fs.readFileSync(jsonPath, 'utf8')
    const data: CorpCodeData = JSON.parse(jsonContent)

    const corpCodeMap = new Map<string, string>()
    Object.entries(data.mapping).forEach(([stockCode, corpCode]) => {
      corpCodeMap.set(stockCode, corpCode)
    })

    log({
      level: 'SUCCESS',
      source: 'loadCorpCodeJson',
      message: `매핑 로드 완료: ${corpCodeMap.size}개 상장사 (업데이트: ${data.updatedAt})`,
    })

    return corpCodeMap
  } catch (error) {
    log({
      level: 'ERROR',
      source: 'loadCorpCodeJson',
      message: `로드 실패: ${error instanceof Error ? error.message : String(error)}`,
      data: error,
    })

    return new Map()
  }
}

/**
 * 종목코드 -> 기업 고유번호 변환
 */
export function getCorpCode(stockCode: string): string | null {
  // 최초 호출 시 캐시 로드
  if (!corpCodeCache) {
    corpCodeCache = loadCorpCodeJson()
  }

  const corpCode = corpCodeCache.get(stockCode)

  if (corpCode) {
    log({
      level: 'SUCCESS',
      source: 'getCorpCode',
      message: `변환 성공: ${stockCode} -> ${corpCode}`,
    })
    return corpCode
  } else {
    log({
      level: 'WARN',
      source: 'getCorpCode',
      message: `매핑되지 않은 종목코드: ${stockCode}`,
    })
    return null
  }
}

/**
 * 캐시 통계 조회
 */
export function getCorpCodeCacheStats(): {
  size: number
  loaded: boolean
} {
  return {
    size: corpCodeCache?.size || 0,
    loaded: corpCodeCache !== null,
  }
}
