export interface NewsItem {
  id?: string
  title: string
  url: string
  summary: string
  source: string
  category: string
  publishedAt: Date
  imageUrl?: string | null
  isBreaking?: boolean
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
