import { RSSParserService } from '../lib/rss/parser'
import { RSS_FEED_SOURCES } from '../lib/rss/sources'

async function testNocutnewsDate() {
  const parser = new RSSParserService()
  const nocutnews = RSS_FEED_SOURCES.find(s => s.id === 'nocutnews')!

  console.log('🔍 노컷뉴스 RSS 날짜 상세 분석\n')

  const items = await parser.fetchFeed(nocutnews)
  const now = new Date()

  console.log(`현재 시간 (로컬): ${now.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`)
  console.log(`현재 시간 (UTC): ${now.toISOString()}\n`)

  console.log('최신 5개 뉴스 분석:')
  console.log('=' .repeat(80))

  for (let i = 0; i < Math.min(5, items.length); i++) {
    const item = items[i]
    const diff = now.getTime() - item.pubDate.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    console.log(`\n${i + 1}. ${item.title.substring(0, 50)}...`)
    console.log(`   발행 시간 (UTC): ${item.pubDate.toISOString()}`)
    console.log(`   발행 시간 (KST): ${item.pubDate.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`)
    console.log(`   경과 시간: ${hours}시간 ${minutes}분 전`)

    // 1분 이내면 문제 있음
    if (Math.abs(diff) < 60 * 1000) {
      console.log(`   ⚠️  경고: 거의 같은 시간 (${Math.abs(diff / 1000).toFixed(1)}초 차이)`)
    } else if (hours < 0) {
      console.log(`   ⚠️  경고: 미래 시간!`)
    } else {
      console.log(`   ✅ 정상`)
    }
  }

  console.log('\n' + '=' .repeat(80))
}

testNocutnewsDate()
