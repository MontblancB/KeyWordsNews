# KeyWordsNews - 실시간 뉴스 PWA 서비스

## 프로젝트 개요

아이폰 홈화면에 추가하여 네이티브 앱처럼 사용할 수 있는 실시간 뉴스 확인 서비스입니다.

### 주요 기능
1. **실시간 긴급 속보** - 주요 언론사의 긴급 속보를 실시간으로 수신
2. **탑10 토픽** - 사용자가 설정한 분야별(정치, 경제, IT, 스포츠 등) 인기 뉴스 상위 10개
3. **키워드 뉴스** - 사용자가 지정한 키워드 기반 맞춤형 뉴스 피드

---

## 기술 스택

### Frontend
- **React** 또는 **Next.js** - UI 프레임워크
- **TypeScript** - 타입 안정성
- **Tailwind CSS** - 스타일링
- **PWA 기능** - Service Worker, Web App Manifest
- **React Query** 또는 **SWR** - 데이터 페칭 및 캐싱

### Backend
- **Node.js + Express** 또는 **Next.js API Routes** - RESTful API
- **PostgreSQL** 또는 **MongoDB** - 사용자 설정 및 키워드 저장
- **Redis** - 뉴스 캐싱 및 실시간 데이터 처리

### 뉴스 데이터 소스

> **상세 조사 보고서** - 아래는 무료로 사용 가능한 뉴스 데이터 소스들을 조사한 결과입니다.

#### 1. 한국 뉴스 API

##### 네이버 뉴스 검색 API (추천 ⭐)
- **공식 API**: [네이버 오픈 API](https://naver.github.io/naver-openapi-guide/apilist.html)
- **가격**: 무료
- **제한사항**:
  - 일일 호출 제한: **25,000회**
  - 한 번 호출당 최대: **100건**
  - start 파라미터 최대값: **1000**
- **필요사항**:
  - 네이버 개발자센터에서 애플리케이션 등록
  - CLIENT_ID 및 CLIENT_SECRET 발급
- **장점**:
  - 한국어 뉴스에 최적화
  - 실시간 검색 가능
  - 날짜별 정렬 지원
- **단점**:
  - 일일 호출 제한이 있어 대용량 서비스에는 부족할 수 있음

##### 공공데이터포털 보도자료 API
- **공식 사이트**: [공공데이터포털](https://www.data.go.kr/)
- **가격**: 무료
- **제공 기관**:
  - 과학기술정보통신부 보도자료
  - 국제방송교류재단 뉴스기사 API (아리랑TV)
  - 각 정부부처 보도자료
- **필요사항**:
  - 공공데이터포털 회원가입
  - 개발 계정 신청 (약 1,000 트래픽/일 제공)
  - 신청 후 1-2시간 대기 시간
- **장점**:
  - 공식 정부 보도자료 제공
  - 무료 사용
- **단점**:
  - 실시간 속보에는 부적합
  - 정부 관련 뉴스에 한정됨

#### 2. RSS 피드 (가장 추천 ⭐⭐⭐)

RSS 피드는 **별도의 API 키 없이** 무료로 사용 가능하며, 대부분의 언론사가 제공합니다.

##### 주요 언론사 RSS 피드

**종합 일간지**
- 동아일보
  - 전체: `http://rss.donga.com/total.xml`
  - 정치: `http://rss.donga.com/politics.xml`
  - 경제: `http://rss.donga.com/economy.xml`
  - 사회: `http://rss.donga.com/national.xml`
  - 국제: `http://rss.donga.com/international.xml`
- 조선일보, 중앙일보, 한국일보 등도 RSS 제공

**방송사**
- SBS 뉴스: [RSS 피드 페이지](https://news.sbs.co.kr/news/rss.do)
- KBS, MBC 등도 RSS 제공

**경제지**
- 한국경제: [RSS 페이지](https://www.hankyung.com/feed)
- 매일경제, 서울경제 등

**통신사**
- 연합뉴스: `http://en.yna.co.kr/RSS/news.xml` (영문)
- 연합뉴스경제TV: [RSS 인덱스](https://www.yonhapnewseconomytv.com/rssIndex.html)
- 뉴시스: [RSS 서비스](https://www.newsis.com/RSS/)

**IT/기술**
- 다양한 IT 전문 매체들이 RSS 제공

**RSS 피드 모음 자료**
- [GitHub - akngs/knews-rss](https://github.com/akngs/knews-rss): 한국 언론사 RSS 모음
- [Korean News RSS URLs](https://gist.github.com/koorukuroo/330a644fcc3c9ffdc7b6d537efd939c3): 188개 언론사 RSS 주소 모음
- [국내 뉴스 언론사 RSS 모음](http://w3devlabs.net/wp/?p=50): 48곳 언론사 RSS

**중요 주의사항**:
- RSS는 **개인적 용도**로만 사용 가능
- 상업적 재배포 또는 2차 RSS 서비스 시 저작권자 허락 필요
- robots.txt 확인 및 준수 필수

#### 3. 해외 뉴스 API

##### NewsAPI.org
- **공식 사이트**: [https://newsapi.org/](https://newsapi.org/)
- **무료 티어 제한사항** (중요!):
  - **일일 호출 제한: 100회** (매우 제한적)
  - **24시간 지연**: 무료 플랜은 실시간 뉴스 불가능
  - SLA 없음
  - 개발 및 테스트 용도만 가능
- **유료 플랜**:
  - **$449/월** (이전 $49가 아님)
- **장점**:
  - CORS 지원으로 localhost 개발 용이
  - 최대 1개월 전 기사 검색 가능
- **단점**:
  - 무료 플랜은 실시간 서비스에 부적합
  - 매우 비싼 유료 플랜
- **평가**: 실시간 뉴스 앱에는 부적합

##### NewsData.io (추천 대안)
- **공식 사이트**: [https://newsdata.io/](https://newsdata.io/)
- **제공 범위**:
  - 87,287개 이상의 뉴스 소스
  - 206개국, 89개 언어
  - 18개 검색 카테고리
- **무료 플랜**:
  - **상업적 용도 가능** (NewsAPI와의 차이점)
  - 기본 기능 및 API 크레딧 제공
- **장점**:
  - 무료 플랜으로 상업 서비스 가능
  - 광범위한 글로벌 뉴스 커버리지
- **단점**:
  - 감정 분석, 클러스터링 등 고급 필터링 부족

##### Mediastack
- **공식 사이트**: [https://mediastack.com/](https://mediastack.com/)
- **무료 플랜**:
  - **500 요청/월**
  - 개인 프로젝트 및 테스트 용도
- **유료 플랜**: $11/월부터
- **평가**: 무료 플랜은 매우 제한적

##### GNews API
- **특징**:
  - 간단한 API와 명확한 문서
  - 기본 필터링 기능 제공
- **단점**:
  - 고급 필터링 기능 부족

##### NewsCatcher
- **특징**:
  - 실시간/속보 뉴스에 특화
  - 시간 중요 애플리케이션에 적합
- **평가**: 속보 서비스에 유용

##### NewsAPI.ai (구 Event Registry)
- **특징**:
  - 아카이브 및 실시간 뉴스 모두 제공
  - 강력한 검색 및 분석 기능
- **단점**:
  - 사용량 기반 토큰 가격제로 비용 증가 가능

#### 4. 크롤링 방식

웹 크롤링으로 직접 뉴스를 수집할 수도 있지만, 법적 주의사항을 반드시 확인해야 합니다.

##### 크롤링 합법성
- **합법적인 경우**:
  - 공개된 데이터 수집
  - robots.txt 준수
  - 적절한 요청 빈도 유지
  - 개인적/비상업적 용도

- **불법이 될 수 있는 경우**:
  - 서비스 약관 위반
  - 수집 데이터의 상업적 판매
  - 서버에 과부하 발생
  - robots.txt 무시
  - 기술적 보호조치 우회

##### 크롤링 시 주의사항 (대법원 2022. 5. 12. 선고 2021도1533 판결 참고)
1. **robots.txt 확인**: 크롤링 전 반드시 확인
2. **이용약관 확인**: 플랫폼의 크롤링 금지 조항 확인
3. **Rate Limiting**: 과도한 요청으로 서버 부하 방지
4. **User-Agent 명시**: 크롤러 신원 명확히 표시
5. **상업적 이용 제한**: 무단 상업적 데이터 판매 금지

##### 크롤링 가능한 사이트
- 네이버 뉴스 (robots.txt 확인 필수)
- 각 언론사 사이트 (개별 확인 필요)

**권장사항**: RSS 피드나 공식 API를 우선 사용하고, 크롤링은 최후 수단으로 고려

#### 5. 추천 구성 방안

**최적의 무료 조합** (이 프로젝트에 권장):

1. **주 데이터 소스**:
   - 📰 **RSS 피드**: 주요 언론사 RSS (무료, 제한 없음, 실시간)
   - 🔍 **네이버 뉴스 API**: 키워드 검색 (25,000회/일)

2. **보조 데이터 소스**:
   - 📢 공공데이터포털: 정부 보도자료
   - 🌏 NewsData.io: 해외 뉴스 (무료 상업 이용 가능)

3. **캐싱 전략**:
   - Redis로 뉴스 캐싱 (5-10분)
   - 중복 API 호출 방지

4. **크롤링**:
   - 긴급 상황에만 보조 수단으로 활용
   - robots.txt 및 법적 요구사항 준수

**비용**: 완전 무료 (호스팅 비용 제외)

#### 6. 데이터 수집 주기

- **긴급 속보**: RSS 피드 5분마다 체크 + WebSocket 실시간 푸시
- **토픽별 뉴스**: 10분마다 업데이트
- **키워드 검색**: 사용자 요청 시 (캐시 우선)

### 실시간 업데이트
- **WebSocket** 또는 **Server-Sent Events (SSE)** - 실시간 속보 푸시
- **Push Notifications API** - 백그라운드 알림

### 배포
- **Vercel** 또는 **Netlify** - 프론트엔드 호스팅
- **Railway** 또는 **AWS** - 백엔드 서버
- **GitHub Actions** - CI/CD

---

## 프로젝트 구조

```
KeyWordsNews/
├── frontend/                    # 프론트엔드 (React/Next.js)
│   ├── public/
│   │   ├── manifest.json       # PWA 매니페스트
│   │   ├── service-worker.js   # 서비스 워커
│   │   ├── icons/              # 앱 아이콘 (다양한 사이즈)
│   │   └── favicon.ico
│   ├── src/
│   │   ├── components/
│   │   │   ├── NewsCard.tsx           # 뉴스 카드 컴포넌트
│   │   │   ├── BreakingNews.tsx       # 긴급 속보 배너
│   │   │   ├── TopicSelector.tsx      # 토픽 선택기
│   │   │   ├── KeywordManager.tsx     # 키워드 관리
│   │   │   ├── NewsList.tsx           # 뉴스 리스트
│   │   │   └── BottomNav.tsx          # 하단 네비게이션
│   │   ├── pages/
│   │   │   ├── index.tsx              # 메인 페이지 (실시간 속보)
│   │   │   ├── topics.tsx             # 토픽별 뉴스
│   │   │   ├── keywords.tsx           # 키워드 뉴스
│   │   │   └── settings.tsx           # 설정 페이지
│   │   ├── hooks/
│   │   │   ├── useNews.ts             # 뉴스 데이터 훅
│   │   │   ├── useWebSocket.ts        # 실시간 업데이트 훅
│   │   │   └── useKeywords.ts         # 키워드 관리 훅
│   │   ├── services/
│   │   │   ├── api.ts                 # API 클라이언트
│   │   │   ├── websocket.ts           # WebSocket 연결
│   │   │   └── notification.ts        # 푸시 알림 처리
│   │   ├── store/
│   │   │   └── userStore.ts           # 사용자 설정 상태 관리
│   │   └── types/
│   │       └── news.ts                # 타입 정의
│   └── package.json
│
├── backend/                     # 백엔드 서버
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── newsController.ts      # 뉴스 조회 로직
│   │   │   ├── keywordController.ts   # 키워드 관리
│   │   │   └── userController.ts      # 사용자 설정
│   │   ├── services/
│   │   │   ├── newsService.ts         # 뉴스 수집 비즈니스 로직
│   │   │   ├── crawlerService.ts      # 뉴스 크롤러
│   │   │   ├── cacheService.ts        # Redis 캐싱
│   │   │   └── notificationService.ts # 알림 발송
│   │   ├── models/
│   │   │   ├── User.ts                # 사용자 모델
│   │   │   ├── Keyword.ts             # 키워드 모델
│   │   │   └── News.ts                # 뉴스 모델
│   │   ├── routes/
│   │   │   ├── news.ts                # /api/news
│   │   │   ├── keywords.ts            # /api/keywords
│   │   │   └── users.ts               # /api/users
│   │   ├── websocket/
│   │   │   └── newsSocket.ts          # 실시간 뉴스 푸시
│   │   ├── jobs/
│   │   │   ├── newsCrawler.job.ts     # 주기적 뉴스 수집
│   │   │   └── breakingNews.job.ts    # 긴급 속보 모니터링
│   │   ├── config/
│   │   │   ├── database.ts            # DB 설정
│   │   │   ├── redis.ts               # Redis 설정
│   │   │   └── newsApi.ts             # 뉴스 API 키
│   │   └── server.ts                  # 서버 엔트리 포인트
│   └── package.json
│
├── database/
│   ├── migrations/              # DB 마이그레이션
│   └── seeds/                   # 초기 데이터
│
└── README.md
```

---

## 데이터베이스 설계

### Users 테이블
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id VARCHAR(255) UNIQUE NOT NULL,  -- 디바이스 식별자
    push_token TEXT,                          -- 푸시 알림 토큰
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Keywords 테이블
```sql
CREATE TABLE keywords (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    keyword VARCHAR(100) NOT NULL,
    priority INTEGER DEFAULT 1,               -- 우선순위 (1-10)
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_keywords_user_id ON keywords(user_id);
```

### Topics 테이블
```sql
CREATE TABLE user_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    topic_name VARCHAR(50) NOT NULL,         -- 정치, 경제, IT, 스포츠 등
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_topics_user_id ON user_topics(user_id);
```

### News 캐시 (Redis)
```
news:breaking:{timestamp}        # 긴급 속보
news:topic:{category}:top10      # 카테고리별 탑10
news:keyword:{keyword}:{page}    # 키워드별 뉴스
```

---

## API 엔드포인트

### 1. 긴급 속보
```
GET /api/news/breaking
Response:
{
  "success": true,
  "data": [
    {
      "id": "news_123",
      "title": "긴급 속보 제목",
      "summary": "요약 내용",
      "source": "언론사명",
      "url": "원문 URL",
      "publishedAt": "2026-01-15T10:30:00Z",
      "imageUrl": "썸네일 URL",
      "isBreaking": true
    }
  ]
}
```

### 2. 토픽별 탑10 뉴스
```
GET /api/news/topics/:topicName/top10
Parameters:
  - topicName: 정치, 경제, IT, 스포츠, 연예, 사회, 세계 등

Response:
{
  "success": true,
  "topic": "IT",
  "data": [
    {
      "id": "news_456",
      "title": "뉴스 제목",
      "summary": "요약",
      "source": "언론사",
      "url": "원문 URL",
      "publishedAt": "2026-01-15T09:00:00Z",
      "imageUrl": "썸네일",
      "rank": 1,
      "views": 15000
    },
    // ... 10개
  ]
}
```

### 3. 키워드 뉴스 검색
```
GET /api/news/keywords/:keyword
Parameters:
  - keyword: 검색 키워드
  - page: 페이지 번호 (default: 1)
  - limit: 페이지당 개수 (default: 20)

Response:
{
  "success": true,
  "keyword": "AI",
  "page": 1,
  "totalPages": 10,
  "data": [
    {
      "id": "news_789",
      "title": "AI 관련 뉴스",
      "summary": "요약",
      "source": "언론사",
      "url": "원문 URL",
      "publishedAt": "2026-01-15T08:00:00Z",
      "imageUrl": "썸네일",
      "relevanceScore": 0.95
    },
    // ...
  ]
}
```

### 4. 사용자 키워드 관리
```
POST /api/keywords
Body: { "keyword": "AI", "priority": 5 }

GET /api/keywords
Response: { "data": [{ "id": "...", "keyword": "AI", "priority": 5 }] }

PUT /api/keywords/:id
Body: { "priority": 3, "is_active": true }

DELETE /api/keywords/:id
```

### 5. 사용자 토픽 설정
```
POST /api/users/topics
Body: { "topics": ["IT", "경제", "스포츠"] }

GET /api/users/topics
Response: { "data": ["IT", "경제", "스포츠"] }
```

### 6. WebSocket 연결
```
WS /ws/news
- 클라이언트 연결 시 실시간 속보 구독
- 새로운 긴급 속보 발생 시 자동 푸시
```

---

## PWA 구현 가이드

### 1. manifest.json 설정
```json
{
  "name": "KeyWordsNews - 실시간 뉴스",
  "short_name": "키워드뉴스",
  "description": "맞춤형 실시간 뉴스 서비스",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1a73e8",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### 2. Service Worker (service-worker.js)
```javascript
const CACHE_NAME = 'keywords-news-v1';
const urlsToCache = [
  '/',
  '/styles/main.css',
  '/scripts/main.js',
  '/offline.html'
];

// 설치
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

// 활성화
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// 네트워크 요청 가로채기
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 캐시에 있으면 반환, 없으면 네트워크 요청
        return response || fetch(event.request);
      })
      .catch(() => {
        // 오프라인 시 대체 페이지
        return caches.match('/offline.html');
      })
  );
});

// 푸시 알림
self.addEventListener('push', (event) => {
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// 알림 클릭
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
```

### 3. HTML에 PWA 메타 태그 추가
```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="theme-color" content="#1a73e8">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="키워드뉴스">

  <!-- iOS 아이콘 -->
  <link rel="apple-touch-icon" href="/icons/icon-152x152.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-180x180.png">

  <!-- Manifest -->
  <link rel="manifest" href="/manifest.json">

  <title>KeyWordsNews - 실시간 뉴스</title>
</head>
<body>
  <div id="root"></div>

  <script>
    // Service Worker 등록
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
          .then((registration) => {
            console.log('SW registered:', registration);
          })
          .catch((error) => {
            console.log('SW registration failed:', error);
          });
      });
    }
  </script>
</body>
</html>
```

---

## 구현 단계별 가이드

### Phase 1: 프로젝트 초기 설정 (1-2일)

#### 1.1 Next.js 프로젝트 생성
```bash
npx create-next-app@latest keywords-news --typescript --tailwind --app
cd keywords-news
```

#### 1.2 필요한 패키지 설치
```bash
# Frontend
npm install @tanstack/react-query axios zustand
npm install -D @types/node

# PWA
npm install next-pwa

# UI 라이브러리 (선택)
npm install @headlessui/react @heroicons/react
```

#### 1.3 Next.js PWA 설정 (next.config.js)
```javascript
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development'
});

module.exports = withPWA({
  reactStrictMode: true,
});
```

### Phase 2: UI 컴포넌트 개발 (3-4일)

#### 2.1 레이아웃 구조
```typescript
// src/app/layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <meta name="theme-color" content="#1a73e8" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body>
        <main className="max-w-md mx-auto bg-white min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
```

#### 2.2 주요 컴포넌트

**긴급 속보 배너**
```typescript
// components/BreakingNews.tsx
interface BreakingNewsProps {
  news: NewsItem[];
}

export default function BreakingNews({ news }: BreakingNewsProps) {
  return (
    <div className="bg-red-600 text-white p-3 sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold">🚨 속보</span>
        <marquee className="flex-1">{news[0]?.title}</marquee>
      </div>
    </div>
  );
}
```

**뉴스 카드**
```typescript
// components/NewsCard.tsx
interface NewsCardProps {
  news: NewsItem;
  onClick: () => void;
}

export default function NewsCard({ news, onClick }: NewsCardProps) {
  return (
    <article
      className="border-b p-4 hover:bg-gray-50 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex gap-3">
        <div className="flex-1">
          <h3 className="font-bold text-sm mb-1">{news.title}</h3>
          <p className="text-xs text-gray-600 mb-2">{news.summary}</p>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>{news.source}</span>
            <span>•</span>
            <time>{formatTime(news.publishedAt)}</time>
          </div>
        </div>
        {news.imageUrl && (
          <img
            src={news.imageUrl}
            alt=""
            className="w-20 h-20 object-cover rounded"
          />
        )}
      </div>
    </article>
  );
}
```

**하단 네비게이션**
```typescript
// components/BottomNav.tsx
export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { icon: '⚡', label: '속보', path: '/' },
    { icon: '📌', label: '토픽', path: '/topics' },
    { icon: '🔍', label: '키워드', path: '/keywords' },
    { icon: '⚙️', label: '설정', path: '/settings' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t">
      <div className="max-w-md mx-auto flex justify-around">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => router.push(item.path)}
            className={`flex-1 py-3 ${
              pathname === item.path ? 'text-blue-600' : 'text-gray-500'
            }`}
          >
            <div className="text-2xl">{item.icon}</div>
            <div className="text-xs">{item.label}</div>
          </button>
        ))}
      </div>
    </nav>
  );
}
```

### Phase 3: 백엔드 API 개발 (4-5일)

#### 3.1 Express 서버 설정
```bash
mkdir backend
cd backend
npm init -y
npm install express typescript @types/express @types/node
npm install axios cheerio node-cron redis ws
npm install dotenv cors helmet
npm install prisma @prisma/client
npm install -D ts-node nodemon
```

#### 3.2 뉴스 크롤러 서비스
```typescript
// backend/src/services/crawlerService.ts
import axios from 'axios';
import * as cheerio from 'cheerio';

export class NewsCrawlerService {
  // 네이버 뉴스 속보
  async getNaverBreakingNews(): Promise<NewsItem[]> {
    try {
      const url = 'https://news.naver.com/main/list.naver?mode=LSD&mid=sec&sid1=001';
      const { data } = await axios.get(url);
      const $ = cheerio.load(data);

      const news: NewsItem[] = [];
      $('.type06_headline li').each((i, elem) => {
        const title = $(elem).find('dt:not(.photo) a').text().trim();
        const url = $(elem).find('dt:not(.photo) a').attr('href');
        const summary = $(elem).find('dd').text().trim();

        if (title && url) {
          news.push({
            id: `naver_${Date.now()}_${i}`,
            title,
            summary,
            url: `https://news.naver.com${url}`,
            source: '네이버뉴스',
            publishedAt: new Date().toISOString(),
            isBreaking: true
          });
        }
      });

      return news;
    } catch (error) {
      console.error('네이버 뉴스 크롤링 실패:', error);
      return [];
    }
  }

  // 키워드 기반 뉴스 검색
  async searchNewsByKeyword(keyword: string, page: number = 1): Promise<NewsItem[]> {
    try {
      const url = `https://openapi.naver.com/v1/search/news.json`;
      const { data } = await axios.get(url, {
        params: {
          query: keyword,
          display: 20,
          start: (page - 1) * 20 + 1,
          sort: 'date'
        },
        headers: {
          'X-Naver-Client-Id': process.env.NAVER_CLIENT_ID,
          'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET
        }
      });

      return data.items.map((item: any, index: number) => ({
        id: `search_${keyword}_${page}_${index}`,
        title: item.title.replace(/<\/?b>/g, ''),
        summary: item.description.replace(/<\/?b>/g, ''),
        url: item.link,
        source: item.originallink.includes('naver') ? '네이버' : '기타',
        publishedAt: item.pubDate,
        relevanceScore: 0.9
      }));
    } catch (error) {
      console.error('키워드 검색 실패:', error);
      return [];
    }
  }
}
```

#### 3.3 캐싱 서비스 (Redis)
```typescript
// backend/src/services/cacheService.ts
import Redis from 'redis';

export class CacheService {
  private client: Redis.RedisClientType;

  constructor() {
    this.client = Redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    this.client.connect();
  }

  async setBreakingNews(news: NewsItem[]): Promise<void> {
    const key = `news:breaking:${Date.now()}`;
    await this.client.setEx(key, 300, JSON.stringify(news)); // 5분 캐시
  }

  async getBreakingNews(): Promise<NewsItem[] | null> {
    const keys = await this.client.keys('news:breaking:*');
    if (keys.length === 0) return null;

    const latestKey = keys.sort().reverse()[0];
    const data = await this.client.get(latestKey);
    return data ? JSON.parse(data) : null;
  }

  async setTopicNews(topic: string, news: NewsItem[]): Promise<void> {
    const key = `news:topic:${topic}:top10`;
    await this.client.setEx(key, 600, JSON.stringify(news)); // 10분 캐시
  }

  async getTopicNews(topic: string): Promise<NewsItem[] | null> {
    const key = `news:topic:${topic}:top10`;
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null;
  }
}
```

#### 3.4 WebSocket 실시간 푸시
```typescript
// backend/src/websocket/newsSocket.ts
import WebSocket from 'ws';

export class NewsWebSocket {
  private wss: WebSocket.Server;

  constructor(server: any) {
    this.wss = new WebSocket.Server({ server, path: '/ws/news' });

    this.wss.on('connection', (ws) => {
      console.log('클라이언트 연결됨');

      ws.on('message', (message) => {
        console.log('받은 메시지:', message);
      });

      ws.on('close', () => {
        console.log('클라이언트 연결 해제');
      });
    });
  }

  // 모든 클라이언트에게 긴급 속보 전송
  broadcastBreakingNews(news: NewsItem): void {
    const message = JSON.stringify({
      type: 'BREAKING_NEWS',
      data: news
    });

    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
}
```

### Phase 4: 실시간 업데이트 구현 (2-3일)

#### 4.1 프론트엔드 WebSocket 훅
```typescript
// hooks/useWebSocket.ts
import { useEffect, useState } from 'react';

export function useWebSocket() {
  const [breakingNews, setBreakingNews] = useState<NewsItem | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3001/ws/news');

    ws.onopen = () => {
      console.log('WebSocket 연결됨');
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.type === 'BREAKING_NEWS') {
        setBreakingNews(message.data);

        // 브라우저 알림
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('긴급 속보', {
            body: message.data.title,
            icon: '/icons/icon-192x192.png'
          });
        }
      }
    };

    ws.onclose = () => {
      console.log('WebSocket 연결 해제');
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, []);

  return { breakingNews, isConnected };
}
```

#### 4.2 푸시 알림 권한 요청
```typescript
// components/NotificationPermission.tsx
export default function NotificationPermission() {
  const requestPermission = async () => {
    if (!('Notification' in window)) {
      alert('이 브라우저는 알림을 지원하지 않습니다.');
      return;
    }

    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
      console.log('알림 권한 허용됨');
    }
  };

  return (
    <button
      onClick={requestPermission}
      className="bg-blue-600 text-white px-4 py-2 rounded"
    >
      알림 받기
    </button>
  );
}
```

### Phase 5: 데이터베이스 및 사용자 설정 (2-3일)

#### 5.1 Prisma 스키마 정의
```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id          String    @id @default(uuid())
  deviceId    String    @unique
  pushToken   String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  keywords    Keyword[]
  topics      UserTopic[]
}

model Keyword {
  id        String   @id @default(uuid())
  userId    String
  keyword   String
  priority  Int      @default(1)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

model UserTopic {
  id           String   @id @default(uuid())
  userId       String
  topicName    String
  isActive     Boolean  @default(true)
  displayOrder Int      @default(0)
  createdAt    DateTime @default(now())
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}
```

#### 5.2 마이그레이션 실행
```bash
npx prisma migrate dev --name init
npx prisma generate
```

### Phase 6: 배포 및 최적화 (2일)

#### 6.1 Vercel 배포 (Frontend)
```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel

# 프로덕션 배포
vercel --prod
```

#### 6.2 Railway 배포 (Backend)
1. Railway 계정 생성
2. New Project 클릭
3. GitHub 저장소 연결
4. 환경 변수 설정:
   - `DATABASE_URL`
   - `REDIS_URL`
   - `NAVER_CLIENT_ID`
   - `NAVER_CLIENT_SECRET`

#### 6.3 성능 최적화
- **이미지 최적화**: Next.js Image 컴포넌트 사용
- **코드 스플리팅**: Dynamic Import 활용
- **캐싱 전략**: SWR 또는 React Query의 staleTime 설정
- **지연 로딩**: Intersection Observer로 무한 스크롤

---

## RSS 피드 기반 뉴스 수집 상세 구현 가이드

> 이 섹션은 주요 언론사 RSS 피드를 활용한 뉴스 수집 시스템의 구체적인 구현 방법을 다룹니다.

### 1. RSS 피드 소스 관리

#### 1.1 언론사 RSS 피드 목록 파일 생성

```typescript
// backend/src/config/rssFeeds.ts

export interface RSSFeedSource {
  id: string;
  name: string;
  category: string;
  url: string;
  priority: number; // 1-10 (긴급도)
  updateInterval: number; // 분 단위
  enabled: boolean;
}

export const RSS_FEED_SOURCES: RSSFeedSource[] = [
  // 통신사 (최우선)
  {
    id: 'yonhap',
    name: '연합뉴스',
    category: 'breaking',
    url: 'https://www.yonhapnewstv.co.kr/category/news/headline/feed/',
    priority: 10,
    updateInterval: 3,
    enabled: true
  },
  {
    id: 'newsis',
    name: '뉴시스',
    category: 'breaking',
    url: 'https://www.newsis.com/RSS/',
    priority: 9,
    updateInterval: 3,
    enabled: true
  },

  // 종합 일간지
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
    id: 'donga_politics',
    name: '동아일보 정치',
    category: 'politics',
    url: 'http://rss.donga.com/politics.xml',
    priority: 7,
    updateInterval: 10,
    enabled: true
  },
  {
    id: 'donga_economy',
    name: '동아일보 경제',
    category: 'economy',
    url: 'http://rss.donga.com/economy.xml',
    priority: 7,
    updateInterval: 10,
    enabled: true
  },

  // 방송사
  {
    id: 'sbs',
    name: 'SBS 뉴스',
    category: 'general',
    url: 'https://news.sbs.co.kr/news/SectionRssFeed.do?sectionId=01',
    priority: 8,
    updateInterval: 5,
    enabled: true
  },

  // 경제지
  {
    id: 'hankyung',
    name: '한국경제',
    category: 'economy',
    url: 'https://www.hankyung.com/feed',
    priority: 7,
    updateInterval: 10,
    enabled: true
  },

  // IT/기술
  {
    id: 'zdnet',
    name: 'ZDNet Korea',
    category: 'tech',
    url: 'https://zdnet.co.kr/rss/',
    priority: 6,
    updateInterval: 15,
    enabled: true
  },

  // 스포츠
  {
    id: 'sportal',
    name: 'Sportal Korea',
    category: 'sports',
    url: 'http://rss.sportalkorea.com/www/news/football.xml',
    priority: 5,
    updateInterval: 15,
    enabled: true
  }
];

// 카테고리별 매핑
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
};
```

### 2. RSS 파서 구현

#### 2.1 RSS 파서 패키지 설치

```bash
npm install rss-parser
npm install @types/rss-parser --save-dev
```

#### 2.2 RSS 파서 서비스 구현

```typescript
// backend/src/services/rssParserService.ts
import Parser from 'rss-parser';
import { RSSFeedSource } from '../config/rssFeeds';

export interface ParsedNewsItem {
  title: string;
  link: string;
  pubDate: Date;
  content?: string;
  contentSnippet?: string;
  creator?: string;
  categories?: string[];
  guid?: string;
  enclosure?: {
    url: string;
    type: string;
  };
}

export class RSSParserService {
  private parser: Parser;

  constructor() {
    this.parser = new Parser({
      customFields: {
        item: [
          ['media:content', 'media'],
          ['media:thumbnail', 'thumbnail'],
          ['dc:creator', 'creator'],
          ['description', 'description']
        ]
      }
    });
  }

  async fetchFeed(feedSource: RSSFeedSource): Promise<ParsedNewsItem[]> {
    try {
      console.log(`Fetching RSS from ${feedSource.name}...`);

      const feed = await this.parser.parseURL(feedSource.url);

      const newsItems: ParsedNewsItem[] = feed.items.map((item) => {
        // 이미지 URL 추출
        let imageUrl: string | undefined;

        if (item.enclosure?.url) {
          imageUrl = item.enclosure.url;
        } else if (item['media:content']?.$?.url) {
          imageUrl = item['media:content'].$.url;
        } else if (item['media:thumbnail']?.$?.url) {
          imageUrl = item['media:thumbnail'].$.url;
        }

        // 본문 요약 추출
        const summary = this.extractSummary(
          item.contentSnippet || item.description || ''
        );

        return {
          title: this.cleanText(item.title || ''),
          link: item.link || '',
          pubDate: item.pubDate ? new Date(item.pubDate) : new Date(),
          content: item.content,
          contentSnippet: summary,
          creator: item.creator || item['dc:creator'] || feedSource.name,
          categories: item.categories || [feedSource.category],
          guid: item.guid || item.link,
          enclosure: imageUrl ? { url: imageUrl, type: 'image' } : undefined
        };
      });

      console.log(`✅ ${feedSource.name}: ${newsItems.length}개 뉴스 수집`);
      return newsItems;

    } catch (error) {
      console.error(`❌ ${feedSource.name} RSS 파싱 실패:`, error);
      return [];
    }
  }

  // HTML 태그 제거 및 텍스트 정리
  private cleanText(text: string): string {
    return text
      .replace(/<[^>]*>/g, '') // HTML 태그 제거
      .replace(/&nbsp;/g, ' ')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();
  }

  // 요약문 추출 (150자 제한)
  private extractSummary(text: string): string {
    const cleaned = this.cleanText(text);
    return cleaned.length > 150
      ? cleaned.substring(0, 150) + '...'
      : cleaned;
  }
}
```

### 3. 뉴스 수집 스케줄러

#### 3.1 Cron Job 설정

```typescript
// backend/src/jobs/rssCollector.job.ts
import cron from 'node-cron';
import { RSSParserService } from '../services/rssParserService';
import { RSS_FEED_SOURCES, RSSFeedSource } from '../config/rssFeeds';
import { NewsService } from '../services/newsService';
import { CacheService } from '../services/cacheService';

export class RSSCollectorJob {
  private rssParser: RSSParserService;
  private newsService: NewsService;
  private cacheService: CacheService;

  constructor() {
    this.rssParser = new RSSParserService();
    this.newsService = new NewsService();
    this.cacheService = new CacheService();
  }

  // 초기화 및 스케줄 시작
  start() {
    console.log('🚀 RSS 수집 스케줄러 시작...');

    // 즉시 한 번 실행
    this.collectAllFeeds();

    // 속보용 RSS (3분마다)
    cron.schedule('*/3 * * * *', () => {
      this.collectBreakingNews();
    });

    // 일반 뉴스 (5분마다)
    cron.schedule('*/5 * * * *', () => {
      this.collectGeneralNews();
    });

    // 카테고리별 뉴스 (10분마다)
    cron.schedule('*/10 * * * *', () => {
      this.collectCategoryNews();
    });
  }

  // 긴급 속보 수집
  private async collectBreakingNews() {
    console.log('⚡ 긴급 속보 수집 시작...');

    const breakingSources = RSS_FEED_SOURCES.filter(
      source => source.category === 'breaking' && source.enabled
    );

    for (const source of breakingSources) {
      const newsItems = await this.rssParser.fetchFeed(source);

      // 최신 5개만 긴급 속보로 처리
      const recentNews = newsItems.slice(0, 5);

      for (const item of recentNews) {
        await this.newsService.saveNews({
          title: item.title,
          url: item.link,
          summary: item.contentSnippet || '',
          source: source.name,
          category: source.category,
          publishedAt: item.pubDate,
          imageUrl: item.enclosure?.url,
          isBreaking: true
        });
      }

      // Redis 캐시 업데이트
      await this.cacheService.setBreakingNews(recentNews);
    }
  }

  // 일반 뉴스 수집
  private async collectGeneralNews() {
    console.log('📰 일반 뉴스 수집 시작...');

    const generalSources = RSS_FEED_SOURCES.filter(
      source => source.category === 'general' && source.enabled
    );

    for (const source of generalSources) {
      const newsItems = await this.rssParser.fetchFeed(source);

      for (const item of newsItems) {
        await this.newsService.saveNews({
          title: item.title,
          url: item.link,
          summary: item.contentSnippet || '',
          source: source.name,
          category: source.category,
          publishedAt: item.pubDate,
          imageUrl: item.enclosure?.url,
          isBreaking: false
        });
      }
    }
  }

  // 카테고리별 뉴스 수집
  private async collectCategoryNews() {
    console.log('📂 카테고리별 뉴스 수집 시작...');

    const categories = ['politics', 'economy', 'tech', 'sports'];

    for (const category of categories) {
      const sources = RSS_FEED_SOURCES.filter(
        source => source.category === category && source.enabled
      );

      const allCategoryNews: any[] = [];

      for (const source of sources) {
        const newsItems = await this.rssParser.fetchFeed(source);
        allCategoryNews.push(...newsItems);
      }

      // 날짜순 정렬 후 상위 10개
      const top10 = allCategoryNews
        .sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime())
        .slice(0, 10);

      // Redis 캐시에 저장
      await this.cacheService.setTopicNews(category, top10);
    }
  }

  // 모든 피드 수집 (초기 실행)
  private async collectAllFeeds() {
    console.log('🔄 전체 RSS 피드 수집 시작...');

    await this.collectBreakingNews();
    await this.collectGeneralNews();
    await this.collectCategoryNews();

    console.log('✅ 전체 RSS 피드 수집 완료!');
  }
}
```

### 4. 뉴스 데이터 저장 서비스

#### 4.1 Prisma 스키마 확장

```prisma
// prisma/schema.prisma

model News {
  id           String   @id @default(uuid())
  title        String
  url          String   @unique
  summary      String   @db.Text
  content      String?  @db.Text
  source       String
  category     String
  publishedAt  DateTime
  imageUrl     String?
  isBreaking   Boolean  @default(false)
  viewCount    Int      @default(0)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([category])
  @@index([publishedAt])
  @@index([isBreaking])
  @@index([source])
}
```

#### 4.2 뉴스 저장 서비스

```typescript
// backend/src/services/newsService.ts
import { PrismaClient } from '@prisma/client';

export interface SaveNewsInput {
  title: string;
  url: string;
  summary: string;
  source: string;
  category: string;
  publishedAt: Date;
  imageUrl?: string;
  isBreaking?: boolean;
  content?: string;
}

export class NewsService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async saveNews(input: SaveNewsInput): Promise<void> {
    try {
      // 중복 체크 (URL 기준)
      const existing = await this.prisma.news.findUnique({
        where: { url: input.url }
      });

      if (existing) {
        // 이미 존재하면 업데이트
        await this.prisma.news.update({
          where: { url: input.url },
          data: {
            title: input.title,
            summary: input.summary,
            isBreaking: input.isBreaking || false,
            updatedAt: new Date()
          }
        });
      } else {
        // 새로운 뉴스 저장
        await this.prisma.news.create({
          data: {
            title: input.title,
            url: input.url,
            summary: input.summary,
            content: input.content,
            source: input.source,
            category: input.category,
            publishedAt: input.publishedAt,
            imageUrl: input.imageUrl,
            isBreaking: input.isBreaking || false
          }
        });
      }
    } catch (error) {
      console.error('뉴스 저장 실패:', error);
    }
  }

  // 최신 속보 조회
  async getBreakingNews(limit: number = 10) {
    return await this.prisma.news.findMany({
      where: { isBreaking: true },
      orderBy: { publishedAt: 'desc' },
      take: limit
    });
  }

  // 카테고리별 탑10 조회
  async getTopNewsByCategory(category: string, limit: number = 10) {
    return await this.prisma.news.findMany({
      where: { category },
      orderBy: [
        { viewCount: 'desc' },
        { publishedAt: 'desc' }
      ],
      take: limit
    });
  }

  // 키워드 검색
  async searchNews(keyword: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [news, total] = await Promise.all([
      this.prisma.news.findMany({
        where: {
          OR: [
            { title: { contains: keyword } },
            { summary: { contains: keyword } }
          ]
        },
        orderBy: { publishedAt: 'desc' },
        skip,
        take: limit
      }),
      this.prisma.news.count({
        where: {
          OR: [
            { title: { contains: keyword } },
            { summary: { contains: keyword } }
          ]
        }
      })
    ]);

    return {
      news,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    };
  }
}
```

### 5. API 엔드포인트 구현

```typescript
// backend/src/routes/news.ts
import express from 'express';
import { NewsService } from '../services/newsService';
import { CacheService } from '../services/cacheService';

const router = express.Router();
const newsService = new NewsService();
const cacheService = new CacheService();

// 긴급 속보
router.get('/breaking', async (req, res) => {
  try {
    // 캐시 먼저 확인
    const cached = await cacheService.getBreakingNews();

    if (cached) {
      return res.json({
        success: true,
        source: 'cache',
        data: cached
      });
    }

    // 캐시 없으면 DB 조회
    const news = await newsService.getBreakingNews();

    // 캐시에 저장
    await cacheService.setBreakingNews(news);

    res.json({
      success: true,
      source: 'database',
      data: news
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 카테고리별 탑10
router.get('/topics/:category/top10', async (req, res) => {
  try {
    const { category } = req.params;

    // 캐시 확인
    const cached = await cacheService.getTopicNews(category);

    if (cached) {
      return res.json({
        success: true,
        topic: category,
        source: 'cache',
        data: cached
      });
    }

    // DB 조회
    const news = await newsService.getTopNewsByCategory(category);

    // 캐시 저장
    await cacheService.setTopicNews(category, news);

    res.json({
      success: true,
      topic: category,
      source: 'database',
      data: news
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 키워드 검색
router.get('/search', async (req, res) => {
  try {
    const keyword = req.query.keyword as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    if (!keyword) {
      return res.status(400).json({
        success: false,
        error: '키워드를 입력해주세요.'
      });
    }

    const result = await newsService.searchNews(keyword, page, limit);

    res.json({
      success: true,
      keyword,
      ...result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
```

### 6. 서버 시작 시 스케줄러 실행

```typescript
// backend/src/server.ts
import express from 'express';
import cors from 'cors';
import { RSSCollectorJob } from './jobs/rssCollector.job';
import newsRoutes from './routes/news';

const app = express();
const PORT = process.env.PORT || 3001;

// 미들웨어
app.use(cors());
app.use(express.json());

// 라우트
app.use('/api/news', newsRoutes);

// RSS 수집 스케줄러 시작
const rssCollector = new RSSCollectorJob();
rssCollector.start();

app.listen(PORT, () => {
  console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다.`);
});
```

### 7. 프론트엔드 연동

```typescript
// frontend/src/services/api.ts
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const newsApi = {
  // 긴급 속보
  getBreakingNews: async () => {
    const response = await axios.get(`${API_URL}/api/news/breaking`);
    return response.data;
  },

  // 카테고리별 탑10
  getTopNewsByCategory: async (category: string) => {
    const response = await axios.get(`${API_URL}/api/news/topics/${category}/top10`);
    return response.data;
  },

  // 키워드 검색
  searchNews: async (keyword: string, page: number = 1) => {
    const response = await axios.get(`${API_URL}/api/news/search`, {
      params: { keyword, page, limit: 20 }
    });
    return response.data;
  }
};
```

```typescript
// frontend/src/hooks/useNews.ts
import { useQuery } from '@tanstack/react-query';
import { newsApi } from '../services/api';

export function useBreakingNews() {
  return useQuery({
    queryKey: ['news', 'breaking'],
    queryFn: newsApi.getBreakingNews,
    refetchInterval: 3 * 60 * 1000, // 3분마다 자동 갱신
    staleTime: 2 * 60 * 1000 // 2분간 캐시 유지
  });
}

export function useTopicNews(category: string) {
  return useQuery({
    queryKey: ['news', 'topic', category],
    queryFn: () => newsApi.getTopNewsByCategory(category),
    refetchInterval: 10 * 60 * 1000, // 10분마다
    staleTime: 5 * 60 * 1000
  });
}

export function useNewsSearch(keyword: string, page: number) {
  return useQuery({
    queryKey: ['news', 'search', keyword, page],
    queryFn: () => newsApi.searchNews(keyword, page),
    enabled: keyword.length > 0
  });
}
```

### 8. 성능 최적화 팁

#### 8.1 병렬 처리
```typescript
// 여러 RSS 피드를 동시에 수집
async collectMultipleFeeds(sources: RSSFeedSource[]) {
  const promises = sources.map(source =>
    this.rssParser.fetchFeed(source)
  );

  const results = await Promise.allSettled(promises);

  return results
    .filter(result => result.status === 'fulfilled')
    .flatMap(result => result.value);
}
```

#### 8.2 중복 제거
```typescript
// URL 해시를 사용한 빠른 중복 체크
const existingUrls = new Set(
  await prisma.news.findMany({
    select: { url: true },
    where: {
      publishedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    }
  }).then(news => news.map(n => n.url))
);

const newNews = newsItems.filter(item => !existingUrls.has(item.link));
```

#### 8.3 배치 저장
```typescript
// 여러 뉴스를 한 번에 저장
await prisma.news.createMany({
  data: newsItems,
  skipDuplicates: true // URL이 중복되면 스킵
});
```

### 9. 모니터링 및 로깅

```typescript
// backend/src/utils/logger.ts
export class RSSLogger {
  static logCollection(source: string, count: number, duration: number) {
    console.log(
      `📊 [${new Date().toISOString()}] ` +
      `${source}: ${count}개 수집 (${duration}ms)`
    );
  }

  static logError(source: string, error: Error) {
    console.error(
      `❌ [${new Date().toISOString()}] ` +
      `${source} 오류: ${error.message}`
    );
  }

  static logStats(stats: {
    totalSources: number;
    successCount: number;
    failCount: number;
    totalNews: number;
  }) {
    console.log('\n📈 RSS 수집 통계');
    console.log(`- 전체 소스: ${stats.totalSources}`);
    console.log(`- 성공: ${stats.successCount}`);
    console.log(`- 실패: ${stats.failCount}`);
    console.log(`- 수집 뉴스: ${stats.totalNews}개\n`);
  }
}
```

---

## 환경 변수 설정

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

### Backend (.env)
```env
PORT=3001
DATABASE_URL=postgresql://user:password@localhost:5432/keywords_news
REDIS_URL=redis://localhost:6379

# 네이버 API
NAVER_CLIENT_ID=your_client_id
NAVER_CLIENT_SECRET=your_client_secret

# CORS
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

---

## 테스트 체크리스트

### PWA 기능
- [ ] 홈화면에 추가 가능한지 확인 (iOS Safari)
- [ ] 오프라인에서 기본 UI 표시 확인
- [ ] 아이콘이 올바르게 표시되는지 확인
- [ ] Standalone 모드에서 앱처럼 작동하는지 확인

### 실시간 기능
- [ ] WebSocket 연결 및 재연결 확인
- [ ] 긴급 속보 실시간 수신 확인
- [ ] 푸시 알림 정상 작동 확인

### 뉴스 기능
- [ ] 긴급 속보 목록 표시 확인
- [ ] 토픽별 뉴스 필터링 확인
- [ ] 키워드 검색 결과 정확도 확인
- [ ] 무한 스크롤 정상 작동 확인

### 사용자 경험
- [ ] 로딩 속도 (3초 이내)
- [ ] 모바일 반응형 디자인
- [ ] 터치 제스처 지원
- [ ] 뒤로가기 버튼 동작

---

## 향후 개선 사항

### 단기 (1-2개월)
- [ ] 뉴스 북마크 기능
- [ ] 댓글 및 공유 기능
- [ ] 다크 모드 지원
- [ ] 뉴스 읽음 표시
- [ ] 카테고리별 알림 설정

### 중기 (3-6개월)
- [ ] AI 기반 뉴스 요약
- [ ] 개인화 추천 알고리즘
- [ ] 사용자 간 뉴스 공유 커뮤니티
- [ ] 뉴스 팩트체크 기능
- [ ] 음성으로 뉴스 듣기 (TTS)

### 장기 (6개월 이상)
- [ ] 멀티 언어 지원
- [ ] AR로 뉴스 시각화
- [ ] 뉴스 동영상 자동 생성
- [ ] 블록체인 기반 신뢰성 검증
- [ ] 구독 모델 및 프리미엄 기능

---

## 참고 자료

### PWA 개발
- [PWA Builder](https://www.pwabuilder.com/)
- [Google PWA Checklist](https://web.dev/pwa-checklist/)
- [iOS PWA 가이드](https://developer.apple.com/documentation/webkit/progressive_web_apps)

### 뉴스 API
- [네이버 검색 API](https://developers.naver.com/docs/serviceapi/search/news/news.md)
- [NewsAPI.org](https://newsapi.org/)
- [Google News API](https://newsapi.org/s/google-news-api)

### 기술 문서
- [Next.js 공식 문서](https://nextjs.org/docs)
- [React Query 문서](https://tanstack.com/query/latest)
- [Prisma 문서](https://www.prisma.io/docs)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)

---

## 라이선스 및 주의사항

### 법적 고려사항
- 뉴스 저작권: 원문 링크를 제공하고 전체 복제 금지
- 로봇 배제 표준: robots.txt 준수
- API 사용 약관: 각 뉴스 제공자의 API 정책 확인
- 개인정보 보호: 사용자 데이터 처리 시 GDPR, 개인정보보호법 준수

### 크롤링 윤리
- 과도한 요청 방지 (Rate Limiting)
- User-Agent 명시
- 로봇 배제 프로토콜 준수
- 캐싱을 통한 서버 부하 최소화

---

## 문의 및 기여

문제가 발생하거나 개선 아이디어가 있다면 이슈를 등록해주세요.

**Happy Coding! 📰✨**
