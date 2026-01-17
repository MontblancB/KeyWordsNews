import { RSSParserService } from '../lib/rss/parser'
import { RSS_FEED_SOURCES } from '../lib/rss/sources'

async function testDateParsing() {
  const parser = new RSSParserService()

  // 노컷뉴스와 경향신문만 테스트
  const testSources = RSS_FEED_SOURCES.filter(
    source => source.id === 'nocutnews' || source.id === 'khan'
  )

  console.log('📅 날짜 파싱 테스트 시작\n')

  for (const source of testSources) {
    console.log(`🔍 ${source.name} 테스트...`)

    try {
      const items = await parser.fetchFeed(source)

      if (items.length > 0) {
        const firstItem = items[0]
        const now = new Date()
        const timeDiff = now.getTime() - firstItem.pubDate.getTime()
        const hoursDiff = Math.floor(timeDiff / (1000 * 60 * 60))
        const minutesDiff = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))

        console.log(`  제목: ${firstItem.title.substring(0, 50)}...`)
        console.log(`  발행 시간: ${firstItem.pubDate.toISOString()}`)
        console.log(`  현재 시간: ${now.toISOString()}`)
        console.log(`  시간 차이: ${hoursDiff}시간 ${minutesDiff}분 전`)
        console.log(`  ✅ 날짜 파싱 성공\n`)
      } else {
        console.log(`  ⚠️ 뉴스를 가져오지 못했습니다\n`)
      }
    } catch (error: any) {
      console.log(`  ❌ 오류: ${error.message}\n`)
    }
  }

  console.log('✅ 테스트 완료')
}

testDateParsing()
