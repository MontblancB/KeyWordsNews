import { scrapeNewsContent } from '../lib/scraper/newsContent'
import { NewsSummarizer } from '../lib/ai/summarizer'

async function testMultipleNews() {
  const testCases = [
    {
      url: 'https://www.yna.co.kr/view/AKR20250116051700001',
      title: '연합뉴스 최신 뉴스',
    },
    {
      url: 'https://www.mk.co.kr/news/economy/11211391',
      title: '경제 뉴스',
    },
    {
      url: 'https://www.hankyung.com/article/2026011607591',
      title: '한국경제 뉴스',
    },
  ]

  for (let i = 0; i < testCases.length; i++) {
    const { url, title } = testCases[i]

    console.log('\n' + '='.repeat(80))
    console.log(`📰 테스트 ${i + 1}/${testCases.length}`)
    console.log('URL:', url)
    console.log('='.repeat(80))

    try {
      const content = await scrapeNewsContent(url, 5000)
      console.log(`✅ 스크래핑 성공: ${content.length}자`)

      const result = await NewsSummarizer.summarize(title, content)

      console.log('\n📝 요약:')
      console.log(result.summary)
      console.log(`(${result.summary.length}자)`)
      console.log('\n🏷️  키워드:', result.keywords.join(', '))
      console.log('🔧 AI:', result.provider)

      if (result.summary.length < 80) {
        console.log('⚠️  경고: 요약이 너무 짧습니다!')
      } else if (result.summary.length >= 100) {
        console.log('✅ 요약 길이 우수!')
      }

    } catch (error) {
      console.error('❌ 오류:', error instanceof Error ? error.message : error)
    }

    // 다음 테스트 전 잠시 대기 (API rate limit 방지)
    if (i < testCases.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }

  console.log('\n' + '='.repeat(80))
  console.log('✅ 모든 테스트 완료!')
  console.log('='.repeat(80))
}

testMultipleNews()
