import { RSSParserService } from '../lib/rss/parser'

async function testEncoding() {
  console.log('='.repeat(80))
  console.log('🔍 한글 인코딩 테스트 시작')
  console.log('='.repeat(80))

  const parser = new RSSParserService()

  // 다양한 언론사의 RSS 테스트
  const testSources = [
    {
      id: 'donga_breaking',
      name: '동아일보',
      category: 'breaking',
      url: 'http://rss.donga.com/total.xml',
      priority: 10,
      updateInterval: 3,
      enabled: true
    },
    {
      id: 'sbs_breaking',
      name: 'SBS',
      category: 'breaking',
      url: 'https://news.sbs.co.kr/news/SectionRssFeed.do?sectionId=01',
      priority: 10,
      updateInterval: 3,
      enabled: true
    }
  ]

  for (const source of testSources) {
    console.log('\n' + '-'.repeat(80))
    console.log(`📰 ${source.name} 테스트`)
    console.log('-'.repeat(80))

    try {
      const items = await parser.fetchFeed(source)

      if (items.length === 0) {
        console.log('⚠️  수집된 뉴스 없음')
        continue
      }

      // 처음 3개 뉴스만 확인
      const sampleItems = items.slice(0, 3)

      for (let i = 0; i < sampleItems.length; i++) {
        const item = sampleItems[i]
        console.log(`\n[${i + 1}] 제목:`)
        console.log(item.title)

        // 한글 깨짐 검사
        const hasGarbled = /[\uFFFD]|[\\x]/.test(item.title)
        if (hasGarbled) {
          console.log('❌ 한글이 깨진 것으로 보입니다!')
        } else {
          console.log('✅ 한글이 정상적으로 보입니다.')
        }

        // HTML 엔티티가 남아있는지 검사
        const hasEntity = /&[a-z]+;|&#[0-9]+;|&#x[0-9a-fA-F]+;/.test(item.title)
        if (hasEntity) {
          console.log('⚠️  HTML 엔티티가 남아있습니다:', item.title.match(/&[a-z]+;|&#[0-9]+;|&#x[0-9a-fA-F]+;/g))
        }

        console.log('\n요약:')
        console.log(item.contentSnippet?.substring(0, 100) + '...')
      }

      console.log(`\n✅ ${source.name}: ${items.length}개 뉴스 수집 완료`)
    } catch (error) {
      console.error(`❌ ${source.name} 오류:`, error instanceof Error ? error.message : error)
    }
  }

  console.log('\n' + '='.repeat(80))
  console.log('✅ 인코딩 테스트 완료')
  console.log('='.repeat(80))
}

testEncoding()
