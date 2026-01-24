# KeyWordsNews - 실시간 뉴스 PWA 서비스

## 프로젝트 개요

아이폰 홈화면에 추가하여 네이티브 앱처럼 사용할 수 있는 실시간 뉴스 확인 서비스입니다.

### 주요 기능
1. **실시간 긴급 속보** - 주요 언론사의 긴급 속보를 실시간으로 수신
2. **카테고리별 뉴스** - 11개 카테고리 (종합, 정치, 경제, 사회, 국제, IT, 암호화폐, 글로벌, 스포츠, 연예, 문화)
3. **키워드 뉴스** - 사용자 맞춤형 키워드 기반 피드
4. **뉴스 검색** - Google News 통합 검색
5. **뉴스 소스 관리** - 48개 소스 활성화/비활성화
6. **AI 뉴스 요약** - Groq/Gemini AI 초압축 요약
7. **전문가 의견** - 카테고리별 심층 분석
8. **경제 지표** - 국내외 주식, 환율, 금시세, 암호화폐
9. **PWA 지원** - 모바일 홈 화면 추가

### 배포 정보
- **URL**: https://key-words-news.vercel.app
- **GitHub**: https://github.com/MontblancB/KeyWordsNews
- **현재 버전**: 2.36.0
- **마지막 업데이트**: 2026-01-24

---

## AI 작업 지침

### 작업 완료 후 필수 절차

**모든 코드 수정 작업 완료 시 자동 실행:**

```bash
npm run build                    # 1. 빌드 테스트
git add .                        # 2. 변경사항 스테이징
git commit -m "type: 설명"       # 3. 커밋 생성
git push origin main             # 4. 푸쉬
```

---

## 기술 스택

### Frontend
- Next.js 16.1.2 (App Router) + TypeScript + Tailwind CSS
- React Query (데이터 페칭/캐싱) + Heroicons

### Backend
- Next.js API Routes + Prisma 6.3.0 + Vercel Postgres
- rss-parser, Groq SDK, Cheerio (웹 스크래핑)

### 인프라
- Vercel (호스팅) + GitHub Actions (RSS 수집 10분마다)

---

## 프로젝트 구조

```
KeyWordsNews/
├── app/                          # Next.js App Router
│   ├── page.tsx                 # 메인 페이지
│   ├── topics/[category]/       # 카테고리별 뉴스
│   ├── keywords/                # 키워드 뉴스
│   ├── search/                  # 검색
│   ├── settings/                # 설정
│   ├── economy/                 # 경제 지표
│   └── api/                     # API Routes
│       ├── news/                # 뉴스 API
│       ├── economy/             # 경제 지표 API
│       └── rss/collect/         # RSS 수집 API
│
├── components/                   # React 컴포넌트
├── hooks/                        # Custom Hooks
├── lib/                          # 라이브러리
│   ├── ai/                      # AI 요약 시스템
│   ├── api/                     # 외부 API 클라이언트
│   ├── scraper/                 # 웹 스크래핑
│   └── rss/                     # RSS 수집
│
├── prisma/                       # 데이터베이스
└── public/                       # 정적 파일
```

---

## 데이터베이스

### News 모델
```prisma
model News {
  id              String   @id @default(cuid())
  title           String
  url             String   @unique
  summary         String   @db.Text
  source          String
  category        String
  publishedAt     DateTime
  imageUrl        String?
  isBreaking      Boolean  @default(false)

  // AI 요약
  aiSummary       String?   @db.Text
  aiKeywords      String[]  @default([])
  aiSummarizedAt  DateTime?
  aiProvider      String?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([category, publishedAt, isBreaking, source])
}
```

### 카테고리
```typescript
general, politics, economy, society, world, tech, crypto, global, sports, entertainment, culture
```

---

## 핵심 API

### 뉴스 API
- `GET /api/news/breaking` - 긴급 속보
- `GET /api/news/latest?limit=20` - 최신 뉴스
- `GET /api/news/category?category=politics` - 카테고리별
- `GET /api/news/search?keyword=AI` - 검색
- `POST /api/news/summarize` - AI 요약

### 경제 API
- `GET /api/economy/indicators` - 전체 경제 지표

### RSS 수집
- `POST /api/rss/collect` - RSS 수집 트리거 (Cron)

---

## 환경 변수

```env
# Database (Vercel Postgres)
PRISMA_DATABASE_URL="postgres://..."
POSTGRES_URL="postgres://..."

# AI
GROQ_API_KEY="gsk_..."
GEMINI_API_KEY="..."

# APIs
FINNHUB_API_KEY="..."

# Cron
CRON_SECRET="..."
VERCEL_APP_URL="https://key-words-news.vercel.app"
```

---

## RSS 수집

### GitHub Actions (10분마다)
```yaml
on:
  schedule:
    - cron: '*/10 * * * *'
```

### 수동 실행
```bash
npm run collect
```

---

## 아이콘 시스템

### Heroicons (하단 네비게이션)
- BoltIcon (속보), NewspaperIcon (토픽), StarIcon (키워드)
- MagnifyingGlassIcon (검색), Cog6ToothIcon (설정)

### PWA 아이콘
- SVG: `public/icon.svg` (512x512)
- PNG: `public/icons/` (8개 사이즈: 72~512)
- 생성: `node scripts/generate-png-icons.js`

---

## 개발 가이드

### 로컬 개발
```bash
git clone https://github.com/MontblancB/KeyWordsNews.git
cd KeyWordsNews
npm install
npx prisma migrate dev
npm run dev
npm run collect  # 초기 데이터
```

### 빌드 & 배포
```bash
npm run build     # 로컬 빌드
git push origin main  # Vercel 자동 배포
```

---

## AI 요약 시스템

### 특징
- **초압축 불릿 포인트**: 3-5개, 각 15-20단어
- **키워드 추출**: 3-5개 자동 추출
- **캐싱**: DB 저장으로 재조회 시 즉시 표시
- **폴백**: Groq → Gemini

### 사용
```typescript
<AISummary
  newsId={news.id}
  url={news.url}
  title={news.title}
  summary={news.summary}
/>
```

---

## 경제 지표

### 데이터 소스
| 지표 | 소스 | 방식 |
|------|------|------|
| KOSPI/KOSDAQ | 네이버 금융 | 스크래핑 |
| S&P/NASDAQ/Dow/Nikkei | Yahoo Finance | API |
| 환율 (USD/JPY/EUR/CNY) | 네이버 금융 | 스크래핑 |
| 금시세 | 네이버 금융 | 스크래핑 |
| 암호화폐 | CoinGecko | API |

### 특징
- 하이브리드 방식 (스크래핑 + API)
- 실시간 업데이트
- 시각화 (▲빨강, ▼파랑)

---

## 데이터베이스 마이그레이션

```bash
# 개발
npx prisma migrate dev --name migration_name

# 프로덕션
npx prisma migrate deploy

# GUI
npx prisma studio
```

---

## 트러블슈팅

### DB 연결 오류
- Vercel Postgres 상태 확인
- 환경 변수 확인

### 마이그레이션 실패
```bash
npx prisma migrate status
npx prisma migrate reset  # 개발 환경만
```

### RSS 수집 안됨
- GitHub Actions 워크플로우 확인
- CRON_SECRET 확인
- Vercel 로그 확인

### 빌드 실패
```bash
npm run build
npx prisma generate
rm -rf node_modules && npm install
```

---

## 성능 최적화

### 1. DB 인덱스
- category, publishedAt, isBreaking, source

### 2. React Query 캐싱
```typescript
{
  staleTime: 5 * 60 * 1000,    // 5분
  cacheTime: 10 * 60 * 1000,   // 10분
}
```

### 3. 전략적 프리페칭
- 전체 카테고리, 속보, 경제 지표
- 순차 실행 (100ms 간격)
- 성능 향상: 페이지 전환 95% (500ms → 0-100ms)

### 4. 캐시 우선 로딩
- 캐시 데이터 즉시 표시
- 백그라운드 갱신

---

## PWA 사용 가이드

### iOS (Safari)
1. https://key-words-news.vercel.app 접속
2. "공유" → "홈 화면에 추가"

### Android (Chrome)
1. 앱 접속 → 메뉴(⋮) → "홈 화면에 추가"

---

## 최근 업데이트

### v2.36.0 (2026-01-24) - TrendNow 실시간 트렌드
- 🔥 **TrendNow 기능**: Google Trends 한국 실시간 검색어 상위 20개 표시
- 📦 **google-trends-api**: Node.js 네이티브 라이브러리 사용 (Vercel 호환)
- 📊 **종합 탭 전용**: 가장 왼쪽에 TrendNow 버튼 배치 (모달 방식)
- ⏰ **자동 수집**: GitHub Actions로 1시간마다 자동 수집
- 🔍 **검색 연동**: 트렌드 키워드 클릭 시 검색 페이지로 이동
- 💾 **캐싱**: DB에 1시간 캐시, 7일 자동 삭제
- 🎛️ **Feature Flag**: `ENABLE_TREND_NOW` 플래그로 ON/OFF
- 🔧 **Vercel 호환**: Python 의존성 제거, 완전 Node.js 환경

### v2.35.0 (2026-01-24) - 주식 데이터 수집 대폭 개선
- 🚀 **DART 전체 종목 매핑**: 하드코딩 55개 → 3,911개 전체 상장사 동적 매핑
- 📊 **투자지표 수집 강화**: ROE, ROA, 유동비율, 당좌비율, 베타 수집 (43% → 93%)
- 💰 **재무제표 소스 개선**: FnGuide > DART > 네이버 순으로 우선순위 변경 (40% → 90%)
- 🏢 **기업정보 보완**: 직원수, 주요사업, 대표제품 스크래핑 추가 (33% → 80%)
- 🔧 **하드코딩 제거**: 빌드 시 DART API에서 자동 업데이트

### v2.34.0 (2026-01-24) - 재무제표 전체 표시
- 📊 **재무제표 UX 개선**: 주식 카테고리의 재무제표를 기본적으로 전체 표시
- 🎛️ **Feature Flag 추가**: `SHOW_ALL_FINANCIALS` 플래그로 전체 표시/폴딩 형식 전환 가능
- 🔧 **유연한 설정**: `lib/feature-flags.ts`에서 쉽게 폴딩 형식으로 복귀 가능

### v2.33.0 (2026-01-24) - BubbleNow Feature Flag
- 🎛️ **Feature Flag 시스템**: `ENABLE_BUBBLE_NOW` 플래그 추가 (현재 비활성화)
- 🔍 **키워드 클릭 기능**: 버블맵 키워드 클릭 시 관련 뉴스 표시
- 📄 **추가 파일**: `lib/feature-flags.ts`, `components/KeywordBubbleMap/KeywordNewsModal.tsx`, `app/api/news/by-ids/route.ts`

### v2.32.0 (2026-01-23) - BubbleNow 군집 색상
- 🎨 **군집별 색상**: BFS 알고리즘으로 연결된 키워드를 같은 색상으로 표시
- 🐛 **캐시 키 개선**: 뉴스 개수 포함 (`category:politics:70`)

### v2.31.0 (2026-01-23) - InsightNow/SummarizeNow 키워드
- 🔍 **키워드 인터랙션**: 키워드 클릭 → 용어 설명 + 내 키워드 추가

### v2.30.0 (2026-01-23) - 카테고리 순서 커스터마이징
- 📋 **드래그 앤 드롭**: 토픽 카테고리 순서 변경 기능 (@dnd-kit)

### v2.29.0 (2026-01-23) - BubbleNow 기능
- 🗺️ **버블맵**: D3.js Force Graph로 키워드 시각화
- 📊 **키워드 분석**: 빈도, 공동 출현, TF-IDF, 연결 강도
- ⚡ **캐싱**: 10분 캐시, AI 배치 처리

<details>
<summary>📋 이전 버전 히스토리 (v2.28.0 ~ v2.1.0)</summary>

### v2.28.0 (2026-01-23) - 글로벌 카테고리
- 🌍 Google News Global, Reuters, AP, BBC, Bloomberg (영어 직접 소스)

### v2.27.0 (2026-01-23) - 암호화폐 카테고리
- 🪙 CoinTelegraph, CoinDesk, Decrypt, The Block

### v2.26.0 (2026-01-23) - Yahoo Finance + DART API
- 🔄 스크래핑 → 공식 API 전환
- 📊 Yahoo Finance Chart API (한국 주식)
- 🏢 DART API (기업정보, 재무제표)

### v2.24.1 (2026-01-22) - 주식 정보 강화
- 🏷️ 종목명 표시, 본사, 홈페이지, 사업 내용
- 📊 ROA, 유동비율, 당좌비율, 베타
- 💰 매출원가, EBITDA, 현금흐름

### v2.23.0 (2026-01-22) - 공유 기능
- 🔗 Web Share API + 클립보드 폴백

### v2.22.0 (2026-01-20) - TradingView 차트
- 📈 캔들차트, 기간 선택 (1일~5년)

### v2.21.0 (2026-01-20) - 주식 카테고리
- 📈 종목 검색, 기업 정보, 투자 지표, 재무제표

### v2.20.0 (2026-01-19) - 개별 전문가 의견
- 💬 각 뉴스마다 전문가 관점 분석

### v2.18.0 (2026-01-19) - SummarizeNow
- 📝 뉴스 종합 정리 (현재 로드된 뉴스)

### v2.17.0 (2026-01-18) - Gemini AI + InsightNow
- 🤖 Gemini 2.0 Flash 추가
- 💡 오늘의 Insight (전문가 프롬프트)

### v2.16.0 (2026-01-18) - 오늘의 Insight
- 💡 카테고리별 심층 분석

### v2.15.6 (2026-01-18) - Pull-to-Refresh
- 🔄 완전 개선 및 UI 최적화

### v2.15.0 (2026-01-18) - UI 구조 개선
- ✨ 속보 탭 → 종합 탭

### v2.14.0 (2026-01-18) - 소스 관리
- 🎛️ 토픽 탭 카테고리별 소스 관리

### v2.13.0 (2026-01-18) - RSS 소스 대폭 개선
- 📰 33개 정상 소스

### v2.12.0 (2026-01-17) - CoinGecko API
- 💰 글로벌 크립토 지표 + 공포탐욕 지수

### v2.10.0 (2026-01-17) - 폰트 크기 조절
- 🔤 7단계, 스마트 리스트 조절

### v2.5.0 (2026-01-17) - 성능 최적화
- ⚡ 전략적 프리페칭, 다크모드

### v2.2.0 (2026-01-16) - AI 요약 & 경제 지표
- 🤖 Groq AI (Llama 3.3 70B)
- 📊 하이브리드 경제 데이터

### v2.1.0 (2026-01-16) - PWA
- 📱 모바일 홈 화면 추가

</details>

---

## 버전 관리 가이드

### Semantic Versioning
- **MAJOR**: 주요 기능, 호환성 없는 변경 (1.0.0 → 2.0.0)
- **MINOR**: 기능 추가, 개선 (2.1.0 → 2.2.0)
- **PATCH**: 버그 수정 (2.2.0 → 2.2.1)

### 커밋 시 필수 업데이트

**1. 버전 번호**
- `app/settings/page.tsx` (38번째 줄)
- `CLAUDE.md` (20번째 줄)

**2. 날짜**
- `app/settings/page.tsx` (39번째 줄)
- `CLAUDE.md` (21번째 줄)

**3. 최근 업데이트 섹션** (MINOR 이상)
- `CLAUDE.md` 최근 업데이트에 변경사항 추가

**4. 커밋 메시지**
```bash
<type>: <subject>

type: feat, fix, docs, style, refactor, perf, test, chore
```

### 예시
```bash
# MINOR 업데이트
feat: 새로운 기능 추가

- 구체적인 변경사항
- 버전 2.2.1 → 2.3.0

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

### 체크리스트
- [ ] app/settings/page.tsx 버전/날짜 업데이트
- [ ] CLAUDE.md 버전/날짜 업데이트
- [ ] CLAUDE.md 최근 업데이트 섹션 추가 (MINOR 이상)
- [ ] 적절한 커밋 메시지
- [ ] `npm run build` 통과

---

## 참고 자료

### 기술 문서
- [Next.js](https://nextjs.org/docs) | [Prisma](https://www.prisma.io/docs)
- [React Query](https://tanstack.com/query/latest) | [Heroicons](https://heroicons.com/)
- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)

### RSS 피드
- [GitHub - akngs/knews-rss](https://github.com/akngs/knews-rss)
- [Korean News RSS URLs](https://gist.github.com/koorukuroo/330a644fcc3c9ffdc7b6d537efd939c3)

---

**Last Updated**: 2026-01-24
**Version**: 2.33.0
