import { RSSFeedSource } from '@/types/news'

export const RSS_FEED_SOURCES: RSSFeedSource[] = [
  // ========== 속보 ==========
  {
    id: 'google_news_breaking',
    name: 'Google News 속보',
    category: 'breaking',
    url: 'https://news.google.com/rss/search?q=%EC%86%8D%EB%B3%B4+OR+%EA%B8%B4%EA%B8%89&hl=ko&gl=KR&ceid=KR:ko',
    priority: 10,
    updateInterval: 3,
    enabled: true
  },

  // ========== Google News 카테고리별 ==========
  // 정치
  {
    id: 'google_news_politics',
    name: 'Google News 정치',
    category: 'politics',
    url: 'https://news.google.com/rss/search?q=%EC%A0%95%EC%B9%98+OR+%EA%B5%AD%ED%9A%8C+OR+%EB%8C%80%ED%86%B5%EB%A0%B9&hl=ko&gl=KR&ceid=KR:ko',
    priority: 9,
    updateInterval: 5,
    enabled: true
  },

  // 경제 키워드 (경제, 증시, 금융)
  {
    id: 'google_news_economy',
    name: 'Google News 경제',
    category: 'economy',
    url: 'https://news.google.com/rss/search?q=%EA%B2%BD%EC%A0%9C+OR+%EC%A1%B1%EC%8B%9C+OR+%EA%B8%88%EC%9C%B5&hl=ko&gl=KR&ceid=KR:ko',
    priority: 9,
    updateInterval: 5,
    enabled: true
  },

  // IT/과학 키워드 (과학, 기술, AI)
  {
    id: 'google_news_tech',
    name: 'Google News IT',
    category: 'tech',
    url: 'https://news.google.com/rss/search?q=%EA%B3%BC%ED%95%99+OR+%EA%B8%B0%EC%88%A0+OR+AI&hl=ko&gl=KR&ceid=KR:ko',
    priority: 8,
    updateInterval: 10,
    enabled: true
  },

  // 스포츠 키워드 (스포츠, 축구, 야구)
  {
    id: 'google_news_sports',
    name: 'Google News 스포츠',
    category: 'sports',
    url: 'https://news.google.com/rss/search?q=%EC%8A%A4%ED%8F%AC%EC%B8%A0+OR+%EC%B6%95%EA%B5%AC+OR+%EC%95%BC%EA%B5%AC&hl=ko&gl=KR&ceid=KR:ko',
    priority: 8,
    updateInterval: 10,
    enabled: true
  },

  // ========== 종합 일간지 ==========
  {
    id: 'donga',
    name: '동아일보',
    category: 'general',
    url: 'http://rss.donga.com/total.xml',
    priority: 8,
    updateInterval: 5,
    enabled: true
  },

  {
    id: 'chosun',
    name: '조선일보',
    category: 'general',
    url: 'https://www.chosun.com/arc/outboundfeeds/rss/?outputType=xml',
    priority: 8,
    updateInterval: 5,
    enabled: true
  },

  {
    id: 'khan',
    name: '경향신문',
    category: 'general',
    url: 'http://www.khan.co.kr/rss/rssdata/total_news.xml',
    priority: 8,
    updateInterval: 5,
    enabled: true
  },

  {
    id: 'ohmynews',
    name: '오마이뉴스',
    category: 'general',
    url: 'https://rss.ohmynews.com/rss/ohmynews.xml',
    priority: 6,
    updateInterval: 10,
    enabled: true
  },

  {
    id: 'nocutnews',
    name: '노컷뉴스',
    category: 'general',
    url: 'http://rss.nocutnews.co.kr/nocutnews.xml',
    priority: 7,
    updateInterval: 10,
    enabled: true,
    dateIsKSTLabeledAsGMT: true  // RSS가 GMT로 표기하지만 실제로는 KST 값 사용
  },

  {
    id: 'segye',
    name: '세계일보',
    category: 'general',
    url: 'http://www.segye.com/Articles/RSSList/segye_recent.xml',
    priority: 7,
    updateInterval: 5,
    enabled: true
  },

  // ========== 방송사 ==========
  {
    id: 'sbs',
    name: 'SBS',
    category: 'general',
    url: 'https://news.sbs.co.kr/news/SectionRssFeed.do?sectionId=01',
    priority: 7,
    updateInterval: 5,
    enabled: true
  },

  // ========== 정치 ==========
  {
    id: 'donga_politics',
    name: '동아일보 정치',
    category: 'politics',
    url: 'http://rss.donga.com/politics.xml',
    priority: 7,
    updateInterval: 10,
    enabled: true
  },

  {
    id: 'sbs_politics',
    name: 'SBS 정치',
    category: 'politics',
    url: 'https://news.sbs.co.kr/news/SectionRssFeed.do?sectionId=07',
    priority: 7,
    updateInterval: 10,
    enabled: true
  },

  // ========== 경제 ==========
  {
    id: 'donga_economy',
    name: '동아일보 경제',
    category: 'economy',
    url: 'http://rss.donga.com/economy.xml',
    priority: 7,
    updateInterval: 10,
    enabled: true
  },

  {
    id: 'mk',
    name: '매일경제',
    category: 'economy',
    url: 'https://www.mk.co.kr/rss/30100041/',
    priority: 7,
    updateInterval: 10,
    enabled: true
  },

  {
    id: 'moneytoday',
    name: '머니투데이',
    category: 'economy',
    url: 'https://rss.mt.co.kr/mt_news.xml',
    priority: 7,
    updateInterval: 10,
    enabled: true
  },

  {
    id: 'sbs_economy',
    name: 'SBS 경제',
    category: 'economy',
    url: 'https://news.sbs.co.kr/news/SectionRssFeed.do?sectionId=01&plink=SUBTYPE',
    priority: 6,
    updateInterval: 10,
    enabled: true
  },

  {
    id: 'edaily',
    name: '이데일리',
    category: 'economy',
    url: 'http://rss.edaily.co.kr/edaily_news.xml',
    priority: 7,
    updateInterval: 10,
    enabled: true
  },

  // ========== IT/과학 ==========
  {
    id: 'donga_tech',
    name: '동아일보 IT',
    category: 'tech',
    url: 'http://rss.donga.com/science.xml',
    priority: 6,
    updateInterval: 15,
    enabled: true
  },

  {
    id: 'etnews',
    name: '전자신문',
    category: 'tech',
    url: 'http://rss.etnews.com/Section901.xml',
    priority: 7,
    updateInterval: 10,
    enabled: true
  },

  // ========== 스포츠 ==========
  {
    id: 'donga_sports',
    name: '동아일보 스포츠',
    category: 'sports',
    url: 'http://rss.donga.com/sports.xml',
    priority: 5,
    updateInterval: 15,
    enabled: true
  },

  {
    id: 'sbs_sports',
    name: 'SBS 스포츠',
    category: 'sports',
    url: 'https://news.sbs.co.kr/news/SectionRssFeed.do?sectionId=07&plink=SUBTYPE',
    priority: 6,
    updateInterval: 15,
    enabled: true
  },

  // ========== 사회 ==========
  {
    id: 'google_news_society',
    name: 'Google News 사회',
    category: 'society',
    url: 'https://news.google.com/rss/search?q=%EC%82%AC%ED%9A%8C+OR+%EA%B5%90%EC%9C%A1+OR+%ED%99%98%EA%B2%BD&hl=ko&gl=KR&ceid=KR:ko',
    priority: 7,
    updateInterval: 10,
    enabled: true
  },

  {
    id: 'donga_society',
    name: '동아일보 사회',
    category: 'society',
    url: 'http://rss.donga.com/national.xml',
    priority: 7,
    updateInterval: 10,
    enabled: true
  },

  {
    id: 'sbs_society',
    name: 'SBS 사회',
    category: 'society',
    url: 'https://news.sbs.co.kr/news/SectionRssFeed.do?sectionId=08',
    priority: 6,
    updateInterval: 10,
    enabled: true
  },

  // ========== 국제 ==========
  {
    id: 'google_news_world',
    name: 'Google News 국제',
    category: 'world',
    url: 'https://news.google.com/rss/search?q=%EA%B5%AD%EC%A0%9C+OR+%ED%95%B4%EC%99%B8+OR+%EA%B8%80%EB%A1%9C%EB%B2%8C&hl=ko&gl=KR&ceid=KR:ko',
    priority: 7,
    updateInterval: 10,
    enabled: true
  },

  {
    id: 'donga_world',
    name: '동아일보 국제',
    category: 'world',
    url: 'http://rss.donga.com/international.xml',
    priority: 7,
    updateInterval: 10,
    enabled: true
  },

  {
    id: 'sbs_world',
    name: 'SBS 국제',
    category: 'world',
    url: 'https://news.sbs.co.kr/news/SectionRssFeed.do?sectionId=02',
    priority: 6,
    updateInterval: 10,
    enabled: true
  },

  // ========== 연예 ==========
  {
    id: 'google_news_entertainment',
    name: 'Google News 연예',
    category: 'entertainment',
    url: 'https://news.google.com/rss/search?q=%EC%97%B0%EC%98%88+OR+%EC%98%81%ED%99%94+OR+%EB%93%9C%EB%9D%BC%EB%A7%88&hl=ko&gl=KR&ceid=KR:ko',
    priority: 6,
    updateInterval: 15,
    enabled: true
  },

  {
    id: 'donga_entertainment',
    name: '동아일보 연예',
    category: 'entertainment',
    url: 'http://rss.donga.com/entertainment.xml',
    priority: 6,
    updateInterval: 15,
    enabled: true
  },

  // ========== 문화 ==========
  {
    id: 'google_news_culture',
    name: 'Google News 문화',
    category: 'culture',
    url: 'https://news.google.com/rss/search?q=%EB%AC%B8%ED%99%94+OR+%EC%A0%84%EC%8B%9C+OR+%EA%B3%B5%EC%97%B0&hl=ko&gl=KR&ceid=KR:ko',
    priority: 5,
    updateInterval: 20,
    enabled: true
  },

  {
    id: 'donga_culture',
    name: '동아일보 문화',
    category: 'culture',
    url: 'http://rss.donga.com/culture.xml',
    priority: 5,
    updateInterval: 20,
    enabled: true
  }
]

export const CATEGORY_MAPPING: Record<string, string> = {
  'breaking': '속보',
  'general': '종합',
  'politics': '정치',
  'economy': '경제',
  'society': '사회',
  'world': '국제',
  'tech': 'IT/과학',
  'sports': '스포츠',
  'entertainment': '연예',
  'culture': '문화'
}

export function getCategorySources(category: string): RSSFeedSource[] {
  return RSS_FEED_SOURCES.filter(source =>
    source.category === category && source.enabled
  )
}

export function getAllSources(): RSSFeedSource[] {
  return RSS_FEED_SOURCES.filter(source => source.enabled)
}
