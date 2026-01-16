import * as cheerio from 'cheerio'

/**
 * 네이버 금융 상세 구조 분석
 */

async function analyzeKospiStructure() {
  console.log('=== KOSPI 상세 분석 ===\n')
  const url = 'https://finance.naver.com/sise/sise_index.naver?code=KOSPI'

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  })

  const html = await response.text()
  const $ = cheerio.load(html)

  // 전체 시세 정보 영역 확인
  const siseArea = $('#contentarea_left')

  console.log('1. 현재가:')
  console.log('   #now_value:', $('#now_value').text().trim())

  console.log('\n2. 변동 정보:')
  const changeArea = $('#change_value_and_rate')
  console.log('   parent class:', changeArea.parent().attr('class'))
  console.log('   parent parent class:', changeArea.parent().parent().attr('class'))

  // 상승/하락 정보는 부모 요소의 class에 있을 가능성
  const statusDiv = changeArea.closest('.num')
  console.log('   .num class:', statusDiv.attr('class'))

  // 또는 em.no_up, em.no_down 같은 요소
  console.log('\n3. em 태그들:')
  $('em').each((i, el) => {
    const $el = $(el)
    const className = $el.attr('class') || ''
    const text = $el.text().trim()
    if (className.includes('no')) {
      console.log(`   em.${className}: "${text}"`)
    }
  })
}

async function analyzeExchangeStructure() {
  console.log('\n\n=== 환율 상세 분석 ===\n')
  const url = 'https://finance.naver.com/marketindex/'

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  })

  const html = await response.text()
  const $ = cheerio.load(html)

  console.log('환율 첫 번째 항목 (USD) 상세:')
  const usd = $('.market1 .data_lst li').eq(0)

  console.log('  li 전체 text:', usd.text().trim().replace(/\s+/g, ' ').substring(0, 150))
  console.log('  li.a href:', usd.find('a').attr('href'))
  console.log('  h3:', usd.find('h3').text().trim())

  console.log('\n  span 요소들:')
  usd.find('span').each((i, el) => {
    const $el = $(el)
    const className = $el.attr('class') || ''
    const text = $el.text().trim()
    if (text && !className.includes('blind')) {
      console.log(`    span.${className}: "${text}"`)
    }
  })

  console.log('\n  em 요소들:')
  usd.find('em').each((i, el) => {
    const $el = $(el)
    const className = $el.attr('class') || ''
    const text = $el.text().trim()
    console.log(`    em.${className}: "${text}"`)
  })
}

async function analyzeWorldIndicesStructure() {
  console.log('\n\n=== 해외 지수 상세 분석 ===\n')
  const url = 'https://finance.naver.com/world/'

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  })

  const html = await response.text()
  const $ = cheerio.load(html)

  console.log('페이지 구조 분석:')
  console.log('  .tb_data 존재:', $('.tb_data').length > 0)
  console.log('  table 개수:', $('table').length)

  // 모든 table 찾기
  $('table').each((i, el) => {
    const $table = $(el)
    const className = $table.attr('class') || ''
    console.log(`\nTable ${i + 1} (class="${className}"):`)

    // 첫 3개 행 분석
    $table.find('tr').each((j, tr) => {
      if (j < 3) {
        const $tr = $(tr)
        const cols = $tr.find('th, td').map((_, td) => $(td).text().trim()).get()
        console.log(`  Row ${j + 1}:`, cols.slice(0, 5))
      }
    })
  })
}

async function analyzeGoldStructure() {
  console.log('\n\n=== 금시세 상세 분석 ===\n')
  const url = 'https://finance.naver.com/marketindex/goldDetail.naver'

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  })

  const html = await response.text()
  const $ = cheerio.load(html)

  console.log('금시세 구조:')
  console.log('  .spot 존재:', $('.spot').length > 0)
  console.log('  .today 존재:', $('.today').length > 0)
  console.log('  .no_today 존재:', $('.no_today').length > 0)

  console.log('\n.no_today 내부:')
  const noToday = $('.no_today')
  console.log('  em class:', noToday.find('em').attr('class'))
  console.log('  em 전체 text:', noToday.find('em').text().trim())

  console.log('\n  개별 span들:')
  noToday.find('em span').each((i, el) => {
    const $el = $(el)
    const className = $el.attr('class') || ''
    const text = $el.text().trim()
    console.log(`    span.${className}: "${text}"`)
  })

  console.log('\n변동 정보:')
  const exday = $('.no_exday')
  console.log('  .no_exday 전체:', exday.text().trim())
  console.log('  em 요소들:')
  exday.find('em').each((i, el) => {
    const $el = $(el)
    const className = $el.attr('class') || ''
    const text = $el.text().trim()
    if (text) {
      console.log(`    em.${className}: "${text}"`)
    }
  })
}

async function main() {
  try {
    await analyzeKospiStructure()
    await analyzeExchangeStructure()
    await analyzeWorldIndicesStructure()
    await analyzeGoldStructure()
  } catch (error) {
    console.error('에러:', error)
  }
}

main()
