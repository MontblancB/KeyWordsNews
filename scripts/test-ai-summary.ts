import { scrapeNewsContent } from '../lib/scraper/newsContent'
import { NewsSummarizer } from '../lib/ai/summarizer'

async function testAISummary() {
  const testUrl = 'https://www.mt.co.kr/living/2026/01/16/2026011615415560115'
  const testTitle = '키즈카페 공짜, 롯데월드 3만원... 쿠팡 보상 쿠폰'

  console.log('='.repeat(80))
  console.log('🤖 AI 요약 테스트 시작')
  console.log('URL:', testUrl)
  console.log('제목:', testTitle)
  console.log('='.repeat(80))

  try {
    // 1. 스크래핑
    console.log('\n📥 1단계: 본문 스크래핑 중...')
    const content = await scrapeNewsContent(testUrl, 5000)
    console.log(`✅ 스크래핑 성공: ${content.length}자 확보`)

    console.log('\n📰 확보한 본문 내용 (처음 800자):')
    console.log('-'.repeat(80))
    console.log(content.substring(0, 800))
    console.log('-'.repeat(80))

    // 2. AI 요약
    console.log('\n🤖 2단계: AI 요약 생성 중...')
    console.log('AI에게 전달할 내용 길이:', content.length, '자')

    const result = await NewsSummarizer.summarize(testTitle, content)

    console.log('\n✅ AI 요약 성공!')
    console.log('='.repeat(80))
    console.log('📝 요약:')
    console.log(result.summary)
    console.log(`(${result.summary.length}자)`)
    console.log('\n🏷️  키워드:')
    console.log(result.keywords.join(', '))
    console.log('\n🔧 사용된 AI:')
    console.log(result.provider)
    console.log('='.repeat(80))

    // 3. 분석
    console.log('\n📊 분석 결과:')
    console.log(`- 입력 본문 길이: ${content.length}자`)
    console.log(`- 요약 길이: ${result.summary.length}자`)
    console.log(`- 압축률: ${((result.summary.length / content.length) * 100).toFixed(1)}%`)
    console.log(`- 키워드 개수: ${result.keywords.length}개`)

    if (result.summary.length < 50) {
      console.log('\n⚠️  경고: 요약이 너무 짧습니다!')
    } else if (result.summary.length < 100) {
      console.log('\n⚠️  주의: 요약이 다소 짧습니다.')
    } else {
      console.log('\n✅ 요약 길이가 적절합니다.')
    }

  } catch (error) {
    console.error('\n❌ 오류 발생:', error)
  }
}

testAISummary()
