import { RSSParserService } from '../lib/rss/parser'
import { RSS_FEED_SOURCES } from '../lib/rss/sources'

async function detailedDateCheck() {
  const parser = new RSSParserService()

  console.log('📅 전체 RSS 소스 날짜 상세 검토\n')
  console.log('=' .repeat(80))

  const now = new Date()
  const problemSources: string[] = []

  for (const source of RSS_FEED_SOURCES) {
    try {
      const items = await parser.fetchFeed(source)

      if (items.length === 0) {
        console.log(`⚠️  ${source.name}: 뉴스 없음`)
        continue
      }

      // 최신 3개 뉴스 확인
      const recentItems = items.slice(0, 3)
      let hasProblem = false

      console.log(`\n📰 ${source.name} (${items.length}개 수집)`)

      for (let i = 0; i < recentItems.length; i++) {
        const item = recentItems[i]
        const timeDiff = now.getTime() - item.pubDate.getTime()
        const hoursDiff = timeDiff / (1000 * 60 * 60)

        // 1분 이내면 의심스러운 경우
        if (Math.abs(hoursDiff * 60) < 1) {
          hasProblem = true
          console.log(`  ⚠️  #${i + 1}: "${item.title.substring(0, 40)}..."`)
          console.log(`      발행시간: ${item.pubDate.toISOString()}`)
          console.log(`      현재시간: ${now.toISOString()}`)
          console.log(`      차이: ${Math.abs(hoursDiff * 60).toFixed(1)}분`)
        } else {
          const hoursAgo = Math.floor(Math.abs(hoursDiff))
          const minutesAgo = Math.floor(Math.abs((hoursDiff % 1) * 60))
          console.log(`  ✅ #${i + 1}: ${hoursAgo}시간 ${minutesAgo}분 전`)
        }
      }

      if (hasProblem) {
        problemSources.push(source.name)
      }

    } catch (error: any) {
      console.log(`❌ ${source.name}: 오류 - ${error.message}`)
    }
  }

  console.log('\n' + '=' .repeat(80))
  console.log('\n📊 문제 있는 소스 요약:')
  if (problemSources.length > 0) {
    problemSources.forEach(name => console.log(`  - ${name}`))
  } else {
    console.log('  ✅ 모든 소스 정상')
  }
  console.log()
}

detailedDateCheck()
