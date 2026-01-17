# KeyWordsNews - 실시간 뉴스 PWA 서비스

## 프로젝트 개요

아이폰 홈화면에 추가하여 네이티브 앱처럼 사용할 수 있는 실시간 뉴스 확인 서비스입니다.

### 주요 기능
1. **실시간 긴급 속보** - 주요 언론사의 긴급 속보를 실시간으로 수신
2. **카테고리별 뉴스** - 종합, 정치, 경제, IT/과학, 스포츠 등 카테고리별 뉴스
3. **키워드 뉴스** - 사용자가 지정한 키워드 기반 맞춤형 뉴스 피드
4. **뉴스 검색** - 원하는 키워드로 뉴스 검색 (Google News 통합)
5. **뉴스 소스 관리** - 카테고리별 뉴스 소스 활성화/비활성화 (48개 소스)
6. **AI 뉴스 요약** - Groq API를 활용한 초압축 불릿 포인트 요약 (온디맨드)
7. **경제 지표** - 국내외 주식, 환율, 금시세, 암호화폐 실시간 확인
8. **PWA 지원** - 모바일 홈 화면에 추가하여 앱처럼 사용 가능

### 배포 정보
- **배포 URL**: https://key-words-news.vercel.app
- **GitHub**: https://github.com/MontblancB/KeyWordsNews
- **현재 버전**: 2.8.0
- **마지막 업데이트**: 2026-01-17

---

## 기술 스택

### Frontend
- **Next.js 16.1.2** - React 프레임워크 (App Router)
- **TypeScript** - 타입 안정성
- **Tailwind CSS** - 스타일링
- **React Query (@tanstack/react-query)** - 데이터 페칭 및 캐싱
- **Heroicons** - 프로페셔널 아이콘 시스템

### Backend
- **Next.js API Routes** - RESTful API
- **Prisma 6.3.0** - ORM (TypeScript-first)
- **Vercel Postgres** - PostgreSQL 데이터베이스 (프로덕션)
- **rss-parser** - RSS 피드 파싱
- **Groq SDK** - AI 뉴스 요약 (Llama 3.3 70B)
- **Cheerio** - 웹 스크래핑 (뉴스 본문, 경제 지표, 날씨)

### 인프라 & 배포
- **Vercel** - 프론트엔드 및 API 호스팅
- **GitHub Actions** - RSS 수집 자동화 (10분마다)
- **Vercel Postgres** - 관리형 PostgreSQL

---

## 프로젝트 구조

```
KeyWordsNews/
├── app/                          # Next.js App Router
│   ├── page.tsx                 # 메인 페이지 (속보)
│   ├── topics/[category]/       # 카테고리별 뉴스
│   ├── keywords/                # 키워드 뉴스
│   ├── search/                  # 검색 페이지
│   ├── settings/                # 설정 페이지
│   ├── economy/                 # 경제 지표 페이지
│   └── api/                     # API Routes
│       ├── news/
│       │   ├── breaking/        # 속보 API
│       │   ├── latest/          # 최신 뉴스
│       │   ├── category/        # 카테고리별 뉴스
│       │   ├── search/          # 뉴스 검색
│       │   └── summarize/       # AI 요약 API
│       ├── economy/
│       │   └── indicators/      # 경제 지표 API
│       └── rss/
│           └── collect/         # RSS 수집 API
│
├── components/                   # React 컴포넌트
│   ├── BottomNav.tsx           # 하단 네비게이션 (Heroicons)
│   ├── CategoryTabs.tsx        # 카테고리 탭
│   ├── KeywordTabs.tsx         # 키워드 탭
│   ├── NewsCard.tsx            # 뉴스 카드
│   ├── KeywordManager.tsx      # 키워드 관리
│   ├── RssSourceManager.tsx    # RSS 소스 관리
│   ├── AISummary.tsx           # AI 요약 컴포넌트
│   └── EconomyIndicators.tsx   # 경제 지표 컴포넌트
│
├── hooks/                        # Custom React Hooks
│   ├── useNews.ts              # 뉴스 데이터 훅
│   ├── useKeywords.ts          # 키워드 관리 훅
│   └── useRssSettings.ts       # RSS 설정 훅
│
├── lib/
│   ├── prisma.ts               # Prisma 클라이언트
│   ├── ai/                     # AI 요약 시스템
│   │   ├── summarizer.ts       # AI 요약 메인 클래스
│   │   ├── types.ts            # AI 관련 타입 정의
│   │   └── providers/          # AI 프로바이더
│   │       ├── groq.ts         # Groq AI (Llama 3.3 70B)
│   │       └── openrouter.ts   # OpenRouter (폴백)
│   ├── api/                    # 외부 API 클라이언트
│   │   ├── yahoo-finance.ts    # Yahoo Finance (해외 지수)
│   │   └── finnhub.ts          # Finnhub (암호화폐)
│   ├── scraper/                # 웹 스크래핑
│   │   ├── naver-finance-v2.ts # 네이버 금융 (국내 지수, 환율, 금)
│   │   ├── hybrid-economy.ts   # 하이브리드 경제 데이터 수집
│   │   └── newsContent.ts      # 뉴스 본문 스크래핑
│   └── rss/
│       ├── sources.ts          # RSS 소스 설정
│       ├── parser.ts           # RSS 파서
│       └── collector.ts        # RSS 수집기
│
├── prisma/
│   ├── schema.prisma           # 데이터베이스 스키마
│   └── migrations/             # 마이그레이션 파일
│
├── public/
│   ├── icon.svg                # PWA 아이콘 (SVG)
│   ├── icons/                  # PWA 아이콘 (PNG, 8개 사이즈)
│   ├── manifest.json           # PWA Manifest
│   └── manifest.webmanifest    # PWA Manifest (상세)
│
├── scripts/
│   ├── collect-rss.ts          # RSS 수집 스크립트
│   ├── generate-icons.js       # 아이콘 생성 가이드
│   └── generate-png-icons.js   # PNG 아이콘 자동 생성
│
├── generate-icons.html          # 브라우저 기반 아이콘 생성 도구
│
└── .github/workflows/
    └── collect-rss.yml         # RSS 수집 자동화 (10분마다)
```

---

## 데이터베이스 설계

### Prisma Schema

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("PRISMA_DATABASE_URL")  // Pooled connection
  directUrl = env("POSTGRES_URL")          // Direct connection
}

model News {
  id           String   @id @default(cuid())
  title        String
  url          String   @unique
  summary      String   @db.Text
  source       String
  category     String
  publishedAt  DateTime
  imageUrl     String?
  isBreaking   Boolean  @default(false)

  // AI 요약 필드
  aiSummary       String?   @db.Text
  aiKeywords      String[]  @default([])
  aiSummarizedAt  DateTime?
  aiProvider      String?   // 사용된 AI 프로바이더 (groq, openrouter)

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([category])
  @@index([publishedAt])
  @@index([isBreaking])
  @@index([source])
  @@index([aiSummarizedAt])
}
```

### 카테고리 목록

```typescript
const CATEGORIES = [
  { id: 'general', label: '종합' },
  { id: 'politics', label: '정치' },
  { id: 'economy', label: '경제' },
  { id: 'society', label: '사회' },
  { id: 'world', label: '국제' },
  { id: 'tech', label: 'IT' },
  { id: 'sports', label: '스포츠' },
  { id: 'entertainment', label: '연예' },
  { id: 'culture', label: '문화' },
]
```

---

## API 엔드포인트

### 1. 긴급 속보
```
GET /api/news/breaking
Response: {
  success: true,
  data: NewsItem[]
}
```

### 2. 최신 뉴스
```
GET /api/news/latest?limit=20&offset=0
Response: {
  success: true,
  data: NewsItem[],
  total: number
}
```

### 3. 카테고리별 뉴스
```
GET /api/news/category?category=politics&limit=20
Response: {
  success: true,
  category: string,
  data: NewsItem[]
}
```

### 4. 뉴스 검색
```
GET /api/news/search?keyword=AI&page=1&limit=20
Response: {
  success: true,
  keyword: string,
  data: NewsItem[],
  total: number,
  totalPages: number,
  currentPage: number
}
```

### 5. AI 뉴스 요약
```
POST /api/news/summarize
Body: { newsId: string, url?: string, title?: string, summary?: string }
Response: {
  success: true,
  data: {
    summary: string,      // 불릿 포인트 요약
    keywords: string[],   // 핵심 키워드
    provider: string,     // AI 프로바이더
    cached: boolean       // 캐시 여부
  }
}
```

### 6. 경제 지표
```
GET /api/economy/indicators
Response: {
  success: true,
  data: {
    domestic: { kospi, kosdaq },
    international: { sp500, nasdaq, dow, nikkei },
    exchange: { usd, jpy, eur, cny },
    gold: { international },
    crypto: { btc, eth, xrp, ada },
    lastUpdated: string
  }
}
```

### 7. RSS 수집 트리거
```
POST /api/rss/collect
Headers: { "x-cron-secret": "your-secret" }
Response: {
  success: true,
  collected: number,
  duration: number
}
```

---

## 뉴스 소스 관리

### 현재 등록된 뉴스 소스

**총 48개 소스** (활성화: 42개, 비활성화: 6개)

**속보 (Breaking)** - 4개 (활성화: 2개)
- 연합뉴스 ✅
- 뉴시스 ✅
- 동아일보 ❌
- 조선일보 ❌

**종합 (General)** - 8개 (활성화: 6개)
- 동아일보 ✅
- 조선일보 ❌
- SBS 뉴스 ✅
- YTN ✅
- KBS ✅
- JTBC ✅
- MBC ✅

**정치 (Politics)** - 2개 (100% 활성화)
**경제 (Economy)** - 9개 (89% 활성화)
**사회 (Society)** - 3개 (100% 활성화)
**국제 (World)** - 3개 (100% 활성화)
**IT/과학 (Tech)** - 6개 (83% 활성화)
**스포츠 (Sports)** - 6개 (100% 활성화)
**연예 (Entertainment)** - 5개 (100% 활성화)
**문화 (Culture)** - 2개 (100% 활성화)

### 뉴스 소스 관리 기능

#### 설정 페이지에서 관리
- 카테고리별 소스 ON/OFF 토글
- 전체 소스 일괄 활성화/비활성화
- 개별 언론사 선택적 활성화
- 설정 초기화 기능
- **실시간 반영**: React Query queryKey에 sources 포함하여 즉시 반영

### RSS 소스 추가 방법

`lib/rss/sources.ts` 파일에 새로운 소스 추가:

```typescript
export const RSS_FEED_SOURCES: RSSFeedSource[] = [
  {
    id: 'unique-id',
    name: '언론사명',
    category: 'politics', // 카테고리
    url: 'https://example.com/rss.xml',
    priority: 7,
    updateInterval: 10,
    enabled: true
  },
  // ...
]
```

---

## 환경 변수 설정

### 개발 환경 (.env.local)
```env
# Database (Vercel Postgres)
PRISMA_DATABASE_URL="postgres://..."  # Pooled connection
POSTGRES_URL="postgres://..."          # Direct connection
USE_DATABASE=true                      # DB 사용 여부

# AI 요약 기능
AI_PROVIDER="groq"                     # groq 또는 openrouter
GROQ_API_KEY="gsk_..."                 # Groq API 키

# 경제 지표 API
FINNHUB_API_KEY="..."                  # Finnhub API 키 (암호화폐)

# GitHub Actions Cron Secret
CRON_SECRET="your-random-secret-key"

# Vercel App URL
VERCEL_APP_URL="https://key-words-news.vercel.app"
```

### Vercel 환경 변수
1. Vercel Dashboard → Settings → Environment Variables
2. 다음 변수들을 설정:
   - `PRISMA_DATABASE_URL` (Vercel Postgres Integration에서 자동 생성)
   - `POSTGRES_URL` (Vercel Postgres Integration에서 자동 생성)
   - `CRON_SECRET` (GitHub Secrets와 동일한 값)

### GitHub Secrets
1. GitHub Repository → Settings → Secrets and variables → Actions
2. 다음 시크릿 추가:
   - `CRON_SECRET`: RSS 수집 API 인증 키
   - `VERCEL_APP_URL`: 배포된 앱 URL

---

## RSS 수집 자동화

### GitHub Actions Workflow

```yaml
# .github/workflows/collect-rss.yml
name: Collect RSS News

on:
  schedule:
    - cron: '*/10 * * * *'  # 10분마다 실행
  workflow_dispatch:          # 수동 실행 가능

jobs:
  collect:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger RSS Collection
        run: |
          curl -X POST "${{ secrets.VERCEL_APP_URL }}/api/rss/collect" \
            -H "x-cron-secret: ${{ secrets.CRON_SECRET }}"
```

### 수동 RSS 수집

```bash
# 로컬에서 실행
npm run collect

# 또는
npx tsx scripts/collect-rss.ts
```

---

## 아이콘 시스템

### Heroicons 사용

프로젝트는 Tailwind CSS 팀의 **Heroicons**를 사용합니다.

#### 하단 네비게이션 아이콘

```typescript
// components/BottomNav.tsx
import {
  BoltIcon,           // 속보 (빨강)
  NewspaperIcon,      // 토픽 (파랑)
  StarIcon,          // 키워드 (노랑)
  MagnifyingGlassIcon, // 검색 (보라)
  Cog6ToothIcon,     // 설정 (회색)
} from '@heroicons/react/24/outline'

// Solid 버전 (선택된 상태)
import {
  BoltIcon as BoltIconSolid,
  // ...
} from '@heroicons/react/24/solid'
```

#### 아이콘 스타일
- **기본 (미선택)**: Outline 스타일 + 회색
- **선택됨**: Solid 스타일 + 해당 색상
- **크기**: 24x24 (w-6 h-6)

### PWA 아이콘

프로젝트는 Heroicons Bookmark-square를 기반으로 한 PWA 아이콘을 사용합니다.

#### 아이콘 디자인
- **SVG 아이콘**: `public/icon.svg`
  - 흰색 배경 (#ffffff)
  - 파란색 북마크 아이콘 (#2563eb)
  - 512x512 크기, 둥근 모서리 (rx=110)
  - 확장 가능한 벡터 그래픽

- **PNG 아이콘**: `public/icons/`
  - 8개 사이즈: 72, 96, 128, 144, 152, 192, 384, 512
  - SVG에서 Sharp 라이브러리로 자동 생성
  - iOS/Android 호환성 보장

#### PWA 설정

```typescript
// app/layout.tsx
export const metadata: Metadata = {
  manifest: '/manifest.json',
  themeColor: '#2563eb',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-192x192.png', sizes: '192x192' },
      { url: '/icons/icon-512x512.png', sizes: '512x512' },
    ],
    apple: [
      { url: '/icons/icon-192x192.png', sizes: '192x192' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: '키워드뉴스',
  },
}
```

#### PNG 아이콘 생성 방법

```bash
# Sharp를 사용한 자동 생성 (권장)
node scripts/generate-png-icons.js

# 또는 브라우저 도구 사용
npm run dev
# http://localhost:3000/generate-icons.html 접속

# 또는 온라인 도구
# https://realfavicongenerator.net/
# public/icon.svg 업로드 후 생성
```

---

## 개발 가이드

### 로컬 개발 환경 설정

1. **레포지토리 클론**
```bash
git clone https://github.com/MontblancB/KeyWordsNews.git
cd KeyWordsNews
```

2. **의존성 설치**
```bash
npm install
```

3. **환경 변수 설정**
`.env.local` 파일 생성 후 환경 변수 입력

4. **데이터베이스 마이그레이션**
```bash
npx prisma migrate dev
npx prisma generate
```

5. **개발 서버 실행**
```bash
npm run dev
```

6. **RSS 수집 (초기 데이터)**
```bash
npm run collect
```

### 빌드 및 배포

```bash
# 로컬 빌드 테스트
npm run build

# Vercel 배포 (자동)
git push origin main
```

---

## AI 뉴스 요약

### 개요

Groq AI (Llama 3.3 70B)를 활용한 온디맨드 뉴스 요약 시스템입니다.

### 주요 특징

1. **초압축 불릿 포인트**
   - 3-5개 불릿으로 핵심 내용 정리
   - 각 불릿은 15-20단어 이내로 초압축
   - 숫자, 날짜, 금액 등 구체적 정보 우선
   - 제목 내용 반복 금지

2. **핵심 키워드 추출**
   - 3-5개 키워드 자동 추출
   - 배지 형태로 시각화

3. **캐싱 시스템**
   - DB에 요약 저장하여 재조회 시 즉시 표시
   - API 비용 절감 및 빠른 응답 속도

4. **폴백 메커니즘**
   - Primary: Groq AI (Llama 3.3 70B)
   - Fallback: OpenRouter (Llama 3.1 70B)
   - URL 기반 폴백: DB에 없는 RSS 뉴스도 지원

### 사용 방법

```typescript
// components/AISummary.tsx
<AISummary
  newsId={news.id}
  url={news.url}
  title={news.title}
  summary={news.summary}
  initialSummary={news.aiSummary}
  initialKeywords={news.aiKeywords}
  initialProvider={news.aiProvider}
/>
```

### API 엔드포인트

```typescript
POST /api/news/summarize
Body: {
  newsId: string,
  url?: string,      // 폴백용
  title?: string,    // 폴백용
  summary?: string   // 폴백용
}
```

### 요약 예시

**불릿 포인트:**
- • 2026년 최저임금 시간당 1만2천원 확정 (7.3%↑)
- • 노동계 '물가 대비 불충분' 반발, 경영계 '중소기업 부담' 우려
- • 적용 대상 약 300만명, 2026.1.1 시행

**키워드:** #최저임금 #1만2천원 #노사갈등

---

## 경제 지표

### 개요

국내외 주식, 환율, 금시세, 암호화폐를 실시간으로 확인할 수 있는 하이브리드 데이터 수집 시스템입니다.

### 데이터 소스

| 지표 | 소스 | 수집 방식 |
|------|------|----------|
| KOSPI, KOSDAQ | 네이버 금융 | 스크래핑 (Cheerio) |
| S&P 500, NASDAQ, Dow, Nikkei | Yahoo Finance | API |
| 환율 (USD, JPY, EUR, CNY) | 네이버 금융 | 스크래핑 (Cheerio) |
| 금시세 | 네이버 금융 | 스크래핑 (Cheerio) |
| 암호화폐 (BTC, ETH, XRP, ADA) | Finnhub | API |

### 주요 특징

1. **하이브리드 방식**
   - 스크래핑: 국내 지수, 환율, 금시세 (네이버 금융)
   - API: 해외 지수 (Yahoo Finance), 암호화폐 (Finnhub)
   - 각 소스의 장점을 활용한 최적의 조합

2. **실시간 업데이트**
   - 페이지 접속 시 최신 데이터 자동 조회
   - React Query 캐싱으로 중복 요청 방지

3. **시각화**
   - 상승: 빨간색 (▲)
   - 하락: 파란색 (▼)
   - 보합: 회색 (-)
   - 변동폭과 변동률 동시 표시

### API 엔드포인트

```typescript
GET /api/economy/indicators
Response: {
  success: true,
  data: {
    domestic: {
      kospi: { name, value, change, changePercent, changeType },
      kosdaq: { name, value, change, changePercent, changeType }
    },
    international: {
      sp500: { name, value, change, changePercent, changeType },
      nasdaq: { name, value, change, changePercent, changeType },
      dow: { name, value, change, changePercent, changeType },
      nikkei: { name, value, change, changePercent, changeType }
    },
    exchange: {
      usd: { name, value, change, changePercent, changeType },
      jpy: { name, value, change, changePercent, changeType },
      eur: { name, value, change, changePercent, changeType },
      cny: { name, value, change, changePercent, changeType }
    },
    gold: {
      international: { name, value, change, changePercent, changeType }
    },
    crypto: {
      btc: { name, value, change, changePercent, changeType },
      eth: { name, value, change, changePercent, changeType },
      xrp: { name, value, change, changePercent, changeType },
      ada: { name, value, change, changePercent, changeType }
    },
    lastUpdated: "2026-01-16 18:30"
  }
}
```

### 사용 예시

```typescript
// app/economy/page.tsx
const { data, isLoading } = useQuery({
  queryKey: ['economy-indicators'],
  queryFn: async () => {
    const res = await fetch('/api/economy/indicators')
    return res.json()
  },
  staleTime: 5 * 60 * 1000,  // 5분
})
```

---

## 데이터베이스 마이그레이션

### 새로운 마이그레이션 생성

```bash
npx prisma migrate dev --name migration_name
```

### 프로덕션 마이그레이션 적용

```bash
npx prisma migrate deploy
```

### Prisma Studio (데이터베이스 GUI)

```bash
npx prisma studio
```

---

## 트러블슈팅

### 1. 데이터베이스 연결 오류

**증상**: `Error: P1001: Can't reach database server`

**해결**:
1. Vercel Postgres가 정상 작동 중인지 확인
2. 환경 변수 `PRISMA_DATABASE_URL`과 `POSTGRES_URL`이 올바른지 확인
3. Vercel Dashboard에서 데이터베이스 상태 확인

### 2. 마이그레이션 실패

**증상**: Migration failed

**해결**:
```bash
# 마이그레이션 상태 확인
npx prisma migrate status

# 강제 재설정 (개발 환경에서만)
npx prisma migrate reset

# 프로덕션에서는 직접 SQL 실행
npx prisma migrate deploy
```

### 3. RSS 수집이 작동하지 않음

**증상**: 뉴스가 업데이트되지 않음

**해결**:
1. GitHub Actions 워크플로우 상태 확인
2. CRON_SECRET이 올바르게 설정되었는지 확인
3. `/api/rss/collect` API를 수동으로 호출해보기
4. Vercel 함수 로그 확인

### 4. 빌드 실패

**증상**: Vercel 빌드가 실패함

**해결**:
```bash
# 로컬에서 빌드 테스트
npm run build

# Prisma 클라이언트 재생성
npx prisma generate

# node_modules 재설치
rm -rf node_modules package-lock.json
npm install
```

---

## 성능 최적화

### 1. 데이터베이스 인덱스

중요한 쿼리에 대해 인덱스가 설정되어 있습니다:
- `category` - 카테고리별 뉴스 조회
- `publishedAt` - 최신 뉴스 정렬
- `isBreaking` - 속보 필터링
- `source` - 언론사별 필터링

### 2. React Query 캐싱

```typescript
// 기본 캐싱 전략
{
  staleTime: 5 * 60 * 1000,    // 5분간 캐시 유지
  cacheTime: 10 * 60 * 1000,   // 10분간 메모리 유지
  refetchOnWindowFocus: true,   // 포커스 시 자동 새로고침
}
```

### 3. 무한 스크롤

검색 및 키워드 페이지에서 React Query의 `useInfiniteQuery`를 사용하여 효율적인 무한 스크롤 구현

### 4. 전략적 프리페칭

모든 페이지에서 사용자가 방문할 가능성이 높은 데이터를 미리 로드합니다:

#### 프리페칭 전략
- **전체 카테고리**: 정치, 경제, 사회, 국제, IT, 스포츠, 연예, 문화 (8개)
- **속보**: 긴급 뉴스 피드
- **경제 지표**: 국내외 주식, 환율, 금시세, 암호화폐
- **키워드**: 사용자가 등록한 상위 3개 키워드

#### 동적 순차 실행

```typescript
setTimeout(async () => {
  for (const category of allCategories) {
    const start = Date.now()

    await queryClient.prefetchInfiniteQuery({...})

    // 최소 100ms 간격 보장 (서버 부하 분산)
    const elapsed = Date.now() - start
    if (elapsed < 100) {
      await new Promise(resolve => setTimeout(resolve, 100 - elapsed))
    }
  }
}, 500)
```

#### 성능 개선 효과
- 빠른 네트워크(200ms/요청): **60% 향상** (4초 → 1.6초)
- 일반 네트워크(300ms/요청): **40% 향상** (4초 → 2.4초)
- 페이지 전환: **95% 향상** (500ms-2s → 0-100ms)
- 캐시 hit 시: **즉시 표시** (0-50ms)

### 5. 캐시 우선 로딩

```typescript
// 캐시가 없을 때만 로딩 스피너 표시
{isLoading && !data && (
  <LoadingSpinner />
)}

// 백그라운드 갱신 중 표시 (선택사항)
{!isLoading && isFetching && (
  <BackgroundRefreshIndicator />
)}
```

**효과**:
- 캐시된 데이터가 있으면 즉시 표시 (0-50ms)
- 백그라운드에서 최신 데이터 갱신
- 사용자는 로딩 대기 없이 즉시 콘텐츠 확인 가능

---

## 향후 개선 사항

### 단기
- [x] PWA 기능 추가 (Manifest, Icons) ✅ v2.1.0
- [x] AI 기반 뉴스 요약 ✅ v2.2.0
- [x] 경제 지표 실시간 확인 ✅ v2.2.0
- [x] 다크 모드 지원 ✅ v2.5.0
- [x] 네이티브 앱 수준 성능 최적화 ✅ v2.5.0
- [ ] PWA 오프라인 지원 (Service Worker)
- [ ] 푸시 알림 기능
- [ ] 뉴스 북마크 기능

### 중기
- [ ] 사용자 계정 시스템
- [ ] 개인화 추천 알고리즘
- [ ] 뉴스 공유 기능
- [ ] 댓글 시스템

### 장기
- [ ] 음성으로 뉴스 듣기 (TTS)
- [ ] 멀티 언어 지원
- [ ] 네이티브 모바일 앱

---

## 라이선스 및 주의사항

### 법적 고려사항
- **뉴스 저작권**: 원문 링크를 제공하고 전체 복제 금지
- **로봇 배제 표준**: robots.txt 준수
- **RSS 사용 윤리**: 개인적 용도로만 사용, 상업적 재배포 금지
- **개인정보 보호**: 사용자 데이터 처리 시 GDPR, 개인정보보호법 준수

### RSS 수집 윤리
- 과도한 요청 방지 (현재: 10분 간격)
- User-Agent 명시
- 캐싱을 통한 서버 부하 최소화
- 각 언론사의 이용약관 준수

---

## 참고 자료

### 기술 문서
- [Next.js 공식 문서](https://nextjs.org/docs)
- [Prisma 문서](https://www.prisma.io/docs)
- [React Query 문서](https://tanstack.com/query/latest)
- [Heroicons](https://heroicons.com/)
- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)

### RSS 피드 자료
- [GitHub - akngs/knews-rss](https://github.com/akngs/knews-rss): 한국 언론사 RSS 모음
- [Korean News RSS URLs](https://gist.github.com/koorukuroo/330a644fcc3c9ffdc7b6d537efd939c3): 188개 언론사 RSS 주소

---

## 문의 및 기여

문제가 발생하거나 개선 아이디어가 있다면 GitHub Issues를 통해 제보해주세요.

**Repository**: https://github.com/MontblancB/KeyWordsNews

---

## PWA 사용 가이드

### 모바일 홈 화면에 추가하기

#### iOS (Safari)
1. https://key-words-news.vercel.app 접속
2. 화면 하단 "공유" 버튼 탭
3. "홈 화면에 추가" 선택
4. 이름 확인 후 "추가" 탭
5. 홈 화면에 북마크 아이콘 생성 완료! 📱

#### Android (Chrome)
1. https://key-words-news.vercel.app 접속
2. 우측 상단 메뉴(⋮) 탭
3. "홈 화면에 추가" 선택
4. 이름 확인 후 "추가" 탭
5. 홈 화면에 북마크 아이콘 생성 완료! 📱

### PWA 특징
- **앱처럼 실행**: 브라우저 UI 없이 전체 화면으로 실행
- **빠른 접근**: 홈 화면에서 바로 실행
- **오프라인 준비**: manifest 설정 완료 (Service Worker는 향후 추가 예정)

---

## 최근 업데이트

### v2.8.0 (2026-01-17)
**날씨 위젯 기능 제거**

#### 제거된 기능
- 🗑️ **날씨 위젯 제거**: 메인 페이지 헤더의 날씨 위젯 삭제
- 🗑️ **날씨 모달 제거**: 날씨 상세 정보 모달 삭제
- 🗑️ **날씨 API 제거**: 네이버 날씨 크롤링 API 삭제

#### 삭제된 파일
- 📄 **components/WeatherWidget.tsx**: 날씨 위젯 컴포넌트
- 📄 **components/WeatherDetailModal.tsx**: 날씨 모달 컴포넌트
- 📄 **hooks/useWeather.ts**: 날씨 데이터 훅
- 📄 **lib/scraper/naver-weather.ts**: 네이버 날씨 크롤러
- 📄 **app/api/weather/route.ts**: 날씨 API 엔드포인트
- 📄 **types/weather.ts**: 날씨 타입 정의

#### UI 개선
- 🎨 **깔끔한 헤더**: 날씨 위젯 제거로 더 깔끔한 메인 페이지 헤더

---

### v2.5.0 (2026-01-17)
**네이티브 앱 수준 성능 최적화**

#### 전략적 프리페칭 시스템
- 🚀 **전체 프리페칭**: 모든 페이지에서 전체 카테고리(8개) + 속보 + 경제지표 + 키워드(3개) 프리페칭
- ⚡ **동적 순차 실행**: async/await 패턴으로 네트워크 효율성 60% 향상
  - 빠른 네트워크(200ms/요청): 4초 → 1.6초
  - 일반 네트워크(300ms/요청): 4초 → 2.4초
  - 느린 네트워크: 자동 적응형 속도 조절
- 📦 **최소 간격 보장**: 100ms 간격으로 서버 부하 분산
- 🎯 **스마트 캐싱**: 5분간 캐시 유지로 즉시 로드 (0-50ms)

#### 로딩 UX 개선
- 💨 **캐시 우선 표시**: 캐시된 데이터가 있으면 즉시 표시 후 백그라운드 갱신
- 🔄 **백그라운드 인디케이터**: 갱신 중 작은 점 애니메이션으로 시각적 피드백
- ⏱️ **초기 로딩만 스피너**: 캐시가 없을 때만 로딩 스피너 표시
- 📱 **검색 페이지 개선**: `isLoading && !data` 패턴 적용

#### 다크모드 완성
- 🌙 **KeywordManager**: 입력 필드, 버튼, 키워드 리스트 전체 다크모드
- 🎨 **KeywordTabs**: 활성/비활성 탭 다크모드 색상 적용
- 🖤 **완전한 다크모드**: 모든 컴포넌트에 dark: 클래스 적용

#### UI/UX 개선
- 🧹 **속보 배지 제거**: 중복 정보 제거로 깔끔한 UI
- 📊 **성능 지표**: 페이지 전환 0-100ms (캐시 hit 시)
- 🔧 **일관된 경험**: 모든 페이지에서 동일한 프리페칭 전략

#### 기술적 개선
- 🏗️ **lib/rss-settings.ts**: `getTopKeywords()` 함수 추가
- 📄 **app/page.tsx**: 전체 카테고리 + 경제지표 + 키워드 프리페칭
- 📄 **app/topics/[category]/page.tsx**: 속보 + 전체 카테고리 + 경제지표 + 키워드 프리페칭
- 📄 **app/keywords/page.tsx**: 속보 + 전체 카테고리 + 경제지표 프리페칭
- 📄 **app/search/page.tsx**: 캐시 우선 로딩 UX 적용
- 🎨 **components/KeywordManager.tsx**: 완전한 다크모드 지원
- 🎨 **components/KeywordTabs.tsx**: 다크모드 탭 스타일링
- 🧹 **components/NewsCard.tsx**: 속보 배지 제거

#### 성능 측정
- **메인 → 정치 카테고리**: 500ms-2s → 0-100ms (95% 개선)
- **카테고리 전환**: 항상 새로 로드 → 캐시 hit 시 즉시 (100% 개선)
- **서버 부하**: 동시 요청 → 순차 100ms 간격 (부하 분산)
- **네트워크 효율**: 고정 간격 → 동적 적응형 (40-60% 빠름)

---

### v2.2.0 (2026-01-16)
**AI 요약 & 경제 지표 추가**

#### AI 뉴스 요약 기능
- 🤖 **Groq AI 통합**: Llama 3.3 70B 모델 활용
- 📝 **초압축 불릿 포인트**: 3-5개 불릿으로 핵심 내용 정리 (15-20단어)
- 🔑 **핵심 키워드 추출**: 3-5개 키워드 자동 추출
- 💾 **캐싱 시스템**: DB에 요약 저장하여 빠른 재조회
- 🎨 **폴백 지원**: OpenRouter 폴백으로 안정성 확보
- 📱 **온디맨드 방식**: 사용자가 "AI 요약 보기" 클릭 시 생성
- 🔄 **URL 기반 폴백**: DB에 없는 RSS 뉴스도 URL로 요약 생성 가능

#### 경제 지표 실시간 확인
- 📊 **하이브리드 데이터 수집**: 스크래핑 + API 조합
- 🇰🇷 **국내 지수**: KOSPI, KOSDAQ (네이버 금융 스크래핑)
- 🌍 **해외 지수**: S&P 500, NASDAQ, Dow Jones, Nikkei 225 (Yahoo Finance API)
- 💱 **환율**: USD, JPY, EUR, CNY (네이버 금융)
- 🏆 **금시세**: 국제 금 시세 (네이버 금융)
- ₿ **암호화폐**: BTC, ETH, XRP, ADA (Finnhub API)
- 🎨 **시각화**: 변동률에 따른 색상 표시 (상승/하락/보합)

#### 데이터베이스 개선
- 🗄️ **AI 요약 필드 추가**:
  - `aiSummary`: 불릿 포인트 요약
  - `aiKeywords`: 키워드 배열
  - `aiSummarizedAt`: 요약 생성 시간
  - `aiProvider`: 사용된 AI 프로바이더
- 📇 **인덱스 추가**: `aiSummarizedAt` 인덱스로 검색 성능 향상

#### 기술적 개선
- ⚡ **성능 최적화**: React Query로 데이터 캐싱
- 🔧 **에러 핸들링**: 스크래핑 실패 시 RSS 요약 폴백
- 📝 **TypeScript**: 완전한 타입 안정성
- 🧪 **테스트**: 빌드 테스트 통과

### v2.1.0 (2026-01-16)
**PWA 기능 추가**

- ✨ **PWA 아이콘 추가**: Heroicons Bookmark-square 기반 아이콘
  - SVG 아이콘 (확장 가능)
  - PNG 아이콘 8개 사이즈 (72~512px)
  - Sharp 라이브러리로 자동 생성
- 🎨 **UI 개선**: "RSS 소스" → "뉴스 소스" 용어 통일
- 📱 **모바일 최적화**: 홈 화면 추가 완벽 지원
- 🔧 **설정 개선**: React Query queryKey에 sources 포함하여 즉시 반영

---

## 버전 관리 가이드

### 커밋 시 필수 업데이트 항목

기능 추가, 개선, 버그 수정 등 의미있는 변경사항이 있을 때마다 다음 항목들을 업데이트해야 합니다:

#### 1. 버전 번호 (Semantic Versioning)

```
MAJOR.MINOR.PATCH

- MAJOR: 주요 기능 추가, 호환성 없는 변경 (예: 1.0.0 → 2.0.0)
- MINOR: 기능 추가, 개선 (예: 2.1.0 → 2.2.0)
- PATCH: 버그 수정, 사소한 개선 (예: 2.2.0 → 2.2.1)
```

#### 2. 업데이트할 파일

**필수 업데이트:**
```bash
# 1. 설정 페이지 (app/settings/page.tsx)
- 버전 번호: 38번째 줄
- 마지막 업데이트 날짜: 39번째 줄

# 2. CLAUDE.md (이 파일)
- 현재 버전 (20번째 줄)
- 마지막 업데이트 (21번째 줄)
- 최근 업데이트 섹션에 변경사항 추가
- 파일 맨 아래 버전 정보 (937-938번째 줄)
```

#### 3. 커밋 메시지 형식

```bash
<type>: <subject>

[optional body]

<type> 종류:
- feat: 새로운 기능 추가
- fix: 버그 수정
- docs: 문서 수정
- style: 코드 포맷팅, 세미콜론 누락 등
- refactor: 코드 리팩토링
- perf: 성능 개선
- test: 테스트 코드
- chore: 빌드 업무, 패키지 매니저 설정 등
```

#### 4. 버전 업데이트 예시

**MINOR 버전 업데이트 (기능 추가):**
```bash
# 1. app/settings/page.tsx 수정
<p>버전: 2.3.0</p>  # 2.2.1 → 2.3.0
<p>마지막 업데이트: 2026-01-17</p>

# 2. CLAUDE.md 수정
- **현재 버전**: 2.3.0
- **마지막 업데이트**: 2026-01-17

### v2.3.0 (2026-01-17)
**새로운 기능 제목**

- 변경사항 1
- 변경사항 2

# 3. 커밋
git add app/settings/page.tsx CLAUDE.md
git commit -m "feat: 새로운 기능 추가

- 구체적인 변경사항 설명
- 버전 2.2.1 → 2.3.0
"
```

**PATCH 버전 업데이트 (버그 수정):**
```bash
# 1. app/settings/page.tsx 수정
<p>버전: 2.2.2</p>  # 2.2.1 → 2.2.2
<p>마지막 업데이트: 2026-01-17</p>

# 2. CLAUDE.md 수정
- **현재 버전**: 2.2.2
- **마지막 업데이트**: 2026-01-17

(최근 업데이트 섹션에는 PATCH는 보통 추가하지 않음)

# 3. 커밋
git add app/settings/page.tsx CLAUDE.md
git commit -m "fix: 버그 수정

- 구체적인 버그 및 수정 내용
- 버전 2.2.1 → 2.2.2
"
```

#### 5. 체크리스트

커밋 전 확인사항:
- [ ] app/settings/page.tsx 버전 번호 업데이트
- [ ] app/settings/page.tsx 날짜 업데이트
- [ ] CLAUDE.md 현재 버전 업데이트 (20번째 줄)
- [ ] CLAUDE.md 마지막 업데이트 날짜 업데이트 (21번째 줄)
- [ ] CLAUDE.md 최근 업데이트 섹션에 변경사항 추가 (MINOR 이상만)
- [ ] CLAUDE.md 맨 아래 버전 정보 업데이트
- [ ] 적절한 커밋 메시지 작성
- [ ] 빌드 테스트 통과 (`npm run build`)

---

**Last Updated**: 2026-01-17
**Version**: 2.6.0
