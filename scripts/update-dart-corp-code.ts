/**
 * DART 전체 상장사 매핑 파일 업데이트 스크립트
 * corpCode.xml 다운로드 → JSON 변환 → public/data/corp-code.json 저장
 */

import * as fs from 'fs'
import * as path from 'path'
import AdmZip from 'adm-zip'
import * as cheerio from 'cheerio'

const DART_API_KEY = process.env.DART_API_KEY || ''
const CORP_CODE_URL = 'https://opendart.fss.or.kr/api/corpCode.xml'
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'data')
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'corp-code.json')

interface CorpCodeMapping {
  [stockCode: string]: string // stockCode -> corpCode
}

async function downloadCorpCodeXml(): Promise<void> {
  console.log('🚀 DART corpCode.xml 다운로드 시작...')

  if (!DART_API_KEY) {
    throw new Error('❌ DART_API_KEY 환경 변수가 설정되지 않았습니다.')
  }

  const url = `${CORP_CODE_URL}?crtfc_key=${DART_API_KEY}`

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP 오류: ${response.status} ${response.statusText}`)
    }

    // ZIP 파일로 제공됨
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    console.log(`✅ 다운로드 완료: ${buffer.length} bytes`)

    // ZIP 압축 해제
    const zip = new AdmZip(buffer)
    const zipEntries = zip.getEntries()

    if (zipEntries.length === 0) {
      throw new Error('ZIP 파일에 엔트리가 없습니다.')
    }

    // 첫 번째 엔트리가 CORPCODE.xml
    const xmlEntry = zipEntries[0]
    const xmlContent = xmlEntry.getData().toString('utf8')

    console.log(`✅ XML 압축 해제 완료: ${xmlContent.length} bytes`)

    // XML 파싱
    const corpCodeMapping = parseCorpCodeXml(xmlContent)

    // JSON 저장
    saveCorpCodeJson(corpCodeMapping)

    console.log('🎉 DART corpCode 매핑 파일 업데이트 완료!')
  } catch (error) {
    console.error('❌ 다운로드 실패:', error)
    throw error
  }
}

function parseCorpCodeXml(xmlContent: string): CorpCodeMapping {
  console.log('📄 XML 파싱 시작...')

  const $ = cheerio.load(xmlContent, { xmlMode: true })
  const corpCodeMapping: CorpCodeMapping = {}
  let count = 0

  $('list').each((_, elem) => {
    const corpCode = $(elem).find('corp_code').text().trim()
    const stockCode = $(elem).find('stock_code').text().trim()

    // 종목코드가 있는 상장사만 매핑 (6자리 숫자)
    if (stockCode && /^\d{6}$/.test(stockCode)) {
      corpCodeMapping[stockCode] = corpCode
      count++
    }
  })

  console.log(`✅ XML 파싱 완료: ${count}개 상장사 매핑`)

  return corpCodeMapping
}

function saveCorpCodeJson(corpCodeMapping: CorpCodeMapping): void {
  console.log('💾 JSON 파일 저장 시작...')

  // 디렉토리 생성
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
    console.log(`✅ 디렉토리 생성: ${OUTPUT_DIR}`)
  }

  // JSON 저장
  const jsonContent = JSON.stringify(
    {
      updatedAt: new Date().toISOString(),
      count: Object.keys(corpCodeMapping).length,
      mapping: corpCodeMapping,
    },
    null,
    2
  )

  fs.writeFileSync(OUTPUT_FILE, jsonContent, 'utf8')

  console.log(`✅ JSON 파일 저장 완료: ${OUTPUT_FILE}`)
  console.log(`   종목 수: ${Object.keys(corpCodeMapping).length}개`)
  console.log(`   파일 크기: ${(jsonContent.length / 1024).toFixed(2)} KB`)
}

// 실행
downloadCorpCodeXml().catch((error) => {
  console.error('스크립트 실행 실패:', error)
  process.exit(1)
})
