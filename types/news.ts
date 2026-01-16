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
