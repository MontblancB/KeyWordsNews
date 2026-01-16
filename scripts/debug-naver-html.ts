import * as cheerio from 'cheerio'

/**
 * 네이버 금융 HTML 구조 디버깅
 */

async function debugKospiPage() {
  console.log('=== KOSPI 페이지 분석 ===\n')
  const url = 'https://finance.naver.com/sise/sise_index.naver?code=KOSPI'

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  })

  const html = await response.text()
  const $ = cheerio.load(html)

  console.log('현재가 (#now_value):', $('#now_value').text().trim())
  console.log('변동값 영역 HTML:', $('#change_value_and_rate').html())
  console.log('변동값 텍스트:', $('#change_value_and_rate').text().trim())
  console.log('변동값 class:', $('#change_value_and_rate').attr('class'))

  // 모든 em 태그 찾기
  console.log('\n전체 변동 관련 요소들:')
  $('em').each((i, el) => {
    const $el = $(el)
    const className = $el.attr('class')
    const text = $el.text().trim()
    if (className && (className.includes('no') || className.includes('up') || className.includes('down'))) {
      console.log(`  class="${className}": "${text}"`)
    }
  })
}

async function debugExchangePage() {
  console.log('\n\n=== 환율 페이지 분석 ===\n')
  const url = 'https://finance.naver.com/marketindex/'

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  })

  const html = await response.text()
  const $ = cheerio.load(html)

  console.log('환율 영역 HTML 구조:')
  $('.market1 .data_lst li').each((i, el) => {
    if (i < 4) {
      const $el = $(el)
      console.log(`\n환율 ${i + 1}:`)
      console.log('  전체 HTML:', $el.html()?.substring(0, 300))
      console.log('  .value:', $el.find('.value').text().trim())
      console.log('  .change:', $el.find('.change').text().trim())
      console.log('  .ratio:', $el.find('.ratio').text().trim())
      console.log('  classes:', $el.attr('class'))
    }
  })
}

async function debugWorldIndicesPage() {
  console.log('\n\n=== 해외 지수 페이지 분석 ===\n')
  const url = 'https://finance.naver.com/world/'

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  })

  const html = await response.text()
  const $ = cheerio.load(html)

  console.log('해외 지수 테이블 HTML:')
  $('.tb_data tbody tr').each((i, el) => {
    if (i < 8) {
      const $el = $(el)
      const name = $el.find('th a').text().trim()
      const value = $el.find('td').eq(0).text().trim()
      const change = $el.find('td').eq(1).text().trim()

      console.log(`\n${i + 1}. ${name}`)
      console.log('   현재가:', value)
      console.log('   변동:', change)
      console.log('   HTML:', $el.html()?.substring(0, 200))
    }
  })
}

async function debugGoldPage() {
  console.log('\n\n=== 금시세 페이지 분석 ===\n')
  const url = 'https://finance.naver.com/marketindex/goldDetail.naver'

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  })

  const html = await response.text()
  const $ = cheerio.load(html)

  console.log('.spot HTML:', $('.spot').html()?.substring(0, 500))
  console.log('.spot .value:', $('.spot .value').text().trim())
  console.log('.spot .change:', $('.spot .change').text().trim())
  console.log('.spot .ratio:', $('.spot .ratio').text().trim())
  console.log('.spot class:', $('.spot').attr('class'))

  // 다른 선택자들 시도
  console.log('\n다른 가능한 선택자들:')
  console.log('.today:', $('.today').text().trim().substring(0, 200))
  console.log('#content:', $('#content').text().trim().substring(0, 200))
}

async function main() {
  try {
    await debugKospiPage()
    await debugExchangePage()
    await debugWorldIndicesPage()
    await debugGoldPage()
  } catch (error) {
    console.error('에러:', error)
  }
}

main()
