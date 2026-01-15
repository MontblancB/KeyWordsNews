# KeyWordsNews - 실시간 뉴스 PWA 서비스

## 프로젝트 개요

아이폰 홈화면에 추가하여 네이티브 앱처럼 사용할 수 있는 실시간 뉴스 확인 서비스입니다.

### 주요 기능
1. **실시간 긴급 속보** - 주요 언론사의 긴급 속보를 실시간으로 수신
2. **카테고리별 뉴스** - 종합, 정치, 경제, IT/과학, 스포츠 등 카테고리별 뉴스
3. **키워드 뉴스** - 사용자가 지정한 키워드 기반 맞춤형 뉴스 피드
4. **뉴스 검색** - 원하는 키워드로 뉴스 검색 (Google News 통합)
5. **뉴스 소스 관리** - 카테고리별 뉴스 소스 활성화/비활성화 (48개 소스)
6. **PWA 지원** - 모바일 홈 화면에 추가하여 앱처럼 사용 가능

### 배포 정보
- **배포 URL**: https://key-words-news.vercel.app
- **GitHub**: https://github.com/MontblancB/KeyWordsNews
- **현재 버전**: 2.1.0
- **마지막 업데이트**: 2026-01-16

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
│   └── api/                     # API Routes
│       ├── news/
│       │   ├── breaking/        # 속보 API
│       │   ├── latest/          # 최신 뉴스
│       │   ├── category/        # 카테고리별 뉴스
│       │   └── search/          # 뉴스 검색
│       └── rss/
│           └── collect/         # RSS 수집 API
│
├── components/                   # React 컴포넌트
│   ├── BottomNav.tsx           # 하단 네비게이션 (Heroicons)
│   ├── CategoryTabs.tsx        # 카테고리 탭
│   ├── KeywordTabs.tsx         # 키워드 탭
│   ├── NewsCard.tsx            # 뉴스 카드
│   ├── KeywordManager.tsx      # 키워드 관리
│   └── RssSourceManager.tsx    # RSS 소스 관리
│
├── hooks/                        # Custom React Hooks
│   ├── useNews.ts              # 뉴스 데이터 훅
│   ├── useKeywords.ts          # 키워드 관리 훅
│   └── useRssSettings.ts       # RSS 설정 훅
│
├── lib/
│   ├── prisma.ts               # Prisma 클라이언트
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
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([category])
  @@index([publishedAt])
  @@index([isBreaking])
  @@index([source])
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

### 5. RSS 수집 트리거
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

---

## 향후 개선 사항

### 단기
- [x] PWA 기능 추가 (Manifest, Icons) ✅ v2.1.0
- [ ] PWA 오프라인 지원 (Service Worker)
- [ ] 푸시 알림 기능
- [ ] 다크 모드 지원
- [ ] 뉴스 북마크 기능

### 중기
- [ ] 사용자 계정 시스템
- [ ] 개인화 추천 알고리즘
- [ ] 뉴스 공유 기능
- [ ] 댓글 시스템

### 장기
- [ ] AI 기반 뉴스 요약
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

## 최근 업데이트 (v2.1.0)

### 2026-01-16
- ✨ **PWA 아이콘 추가**: Heroicons Bookmark-square 기반 아이콘
  - SVG 아이콘 (확장 가능)
  - PNG 아이콘 8개 사이즈 (72~512px)
  - Sharp 라이브러리로 자동 생성
- 🎨 **UI 개선**: "RSS 소스" → "뉴스 소스" 용어 통일
- 📱 **모바일 최적화**: 홈 화면 추가 완벽 지원
- 🔧 **설정 개선**: React Query queryKey에 sources 포함하여 즉시 반영

---

**Last Updated**: 2026-01-16
**Version**: 2.1.0
