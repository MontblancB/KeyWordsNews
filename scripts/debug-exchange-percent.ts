import * as cheerio from 'cheerio'

/**
 * 환율 변동률 디버깅
 */
async function debugExchangePercent() {
  const url = 'https://finance.naver.com/marketindex/'

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  })

  const html = await response.text()
  const $ = cheerio.load(html)

  console.log('=== USD/KRW 전체 구조 ===\n')
  const usd = $('.market1 .data_lst li').eq(0)

  console.log('1. li 전체 HTML (처음 500자):')
  console.log(usd.html()?.substring(0, 500))

  console.log('\n2. 모든 span 요소:')
  usd.find('span').each((i, el) => {
    const $el = $(el)
    const className = $el.attr('class') || 'no-class'
    const text = $el.text().trim()
    console.log(`   span.${className}: "${text}"`)
  })

  console.log('\n3. 모든 em 요소:')
  usd.find('em').each((i, el) => {
    const $el = $(el)
    const className = $el.attr('class') || 'no-class'
    const text = $el.text().trim()
    console.log(`   em.${className}: "${text}"`)
  })

  console.log('\n4. div 요소들:')
  usd.find('div').each((i, el) => {
    const $el = $(el)
    const className = $el.attr('class') || 'no-class'
    const text = $el.text().trim().substring(0, 50)
    console.log(`   div.${className}: "${text}"`)
  })

  console.log('\n5. p 요소들:')
  usd.find('p').each((i, el) => {
    const $el = $(el)
    const className = $el.attr('class') || 'no-class'
    const text = $el.text().trim()
    console.log(`   p.${className}: "${text}"`)
  })

  console.log('\n6. 전체 text (공백 제거):')
  const fullText = usd.text().replace(/\s+/g, ' ').trim()
  console.log(fullText)

  // 변동률 패턴 찾기
  console.log('\n7. 변동률 패턴 찾기:')
  const percentMatches = fullText.match(/([+-]?\d+\.?\d*)%/g)
  console.log('   % 패턴들:', percentMatches)
}

debugExchangePercent()
