/**
 * Database 사용 여부 설정
 *
 * USE_DATABASE=true: PostgreSQL DB + Cron Job 사용
 * USE_DATABASE=false: 실시간 RSS만 사용 (DB 불필요)
 */

export function isDatabaseEnabled(): boolean {
  return process.env.USE_DATABASE === 'true'
}

export function getDatabaseConfig() {
  return {
    enabled: isDatabaseEnabled(),
    url: process.env.DATABASE_URL,
    directUrl: process.env.DIRECT_URL
  }
}
