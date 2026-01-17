export interface NewsItem {
  id?: string
  title: string
  url: string
  summary: string
  source: string
  category: string
  publishedAt: Date | string // Date 객체 또는 ISO 문자열
  imageUrl?: string | null
  isBreaking?: boolean

  // AI 요약 필드
  aiSummary?: string | null
  aiKeywords?: string[]
  aiSummarizedAt?: Date | string | null
  aiProvider?: string | null

  createdAt?: Date
  updatedAt?: Date
}

export interface RSSFeedSource {
  id: string
  name: string
  category: string
  url: string
  priority: number
  updateInterval: number
  enabled: boolean
  // 시간대 보정: 일부 RSS 피드가 GMT로 표기하지만 실제로 KST 값을 사용하는 경우
  // true로 설정하면 파싱된 날짜에서 9시간을 빼서 실제 UTC로 변환
  dateIsKSTLabeledAsGMT?: boolean
}

export interface ParsedRSSItem {
  title: string
  link: string
  pubDate: Date
  content?: string
  contentSnippet?: string
  creator?: string
  categories?: string[]
  guid?: string
  imageUrl?: string
}
