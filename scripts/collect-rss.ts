#!/usr/bin/env tsx

import cron from 'node-cron'
import { rssCollector } from '../lib/rss/collector'

// 명령줄 인자 파싱
const args = process.argv.slice(2)
const isWatchMode = args.includes('--watch')

async function runCollection() {
  try {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`📰 RSS 뉴스 수집 시작: ${new Date().toLocaleString('ko-KR')}`)
    console.log('='.repeat(60))

    await rssCollector.collectAll()

    // 오래된 뉴스 정리 (7일 이상)
    await rssCollector.cleanOldNews(7)

    console.log('✨ 수집 완료!\n')
  } catch (error: any) {
    console.error('❌ 수집 중 오류 발생:', error.message)
  }
}

if (isWatchMode) {
  console.log('🤖 RSS 자동 수집 모드 시작')
  console.log('⏰ 5분마다 자동 수집합니다...\n')

  // 즉시 한 번 실행
  runCollection()

  // 5분마다 실행
  cron.schedule('*/5 * * * *', () => {
    console.log('\n⏰ 스케줄 실행: 5분 경과')
    runCollection()
  })

  // 프로세스 종료 방지
  process.on('SIGINT', () => {
    console.log('\n👋 RSS 수집 중단')
    process.exit(0)
  })
} else {
  // 단일 실행
  runCollection().then(() => {
    console.log('프로세스 종료')
    process.exit(0)
  })
}
