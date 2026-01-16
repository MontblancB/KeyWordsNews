import { scrapeNewsContent } from '../lib/scraper/newsContent'

async function testScraping() {
  const testUrl = 'https://www.mt.co.kr/living/2026/01/16/2026011615415560115'

  console.log('='.repeat(80))
  console.log('🔍 스크래핑 테스트 시작')
  console.log('URL:', testUrl)
  console.log('='.repeat(80))

  try {
    const content = await scrapeNewsContent(testUrl, 5000)

    console.log('\n✅ 스크래핑 성공!')
    console.log(`📊 확보한 글자 수: ${content.length}자`)
    console.log('\n📰 확보한 내용 (처음 500자):')
    console.log('-'.repeat(80))
    console.log(content.substring(0, 500))
    console.log('-'.repeat(80))

    if (content.length >= 1000) {
      console.log('\n📰 중간 부분 (1000-1500자):')
      console.log('-'.repeat(80))
      console.log(content.substring(1000, 1500))
      console.log('-'.repeat(80))
    }

  } catch (error) {
    console.error('\n❌ 스크래핑 실패:', error)
  }
}

testScraping()
