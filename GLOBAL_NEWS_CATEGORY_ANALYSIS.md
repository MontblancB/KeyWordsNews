# 🌍 해외 탑뉴스/실시간 뉴스 카테고리 추가 검토 보고서

**작성일**: 2026-01-23
**목적**: 해외 주요 뉴스 및 실시간 속보 카테고리 추가 가능성 검토

---

## 📊 Executive Summary

현재 KeyWordsNews는 **'국제' 카테고리**를 통해 해외 뉴스를 제공하고 있으나, 한국 언론사의 국제면 중심으로 구성되어 있습니다. 해외 직접 소스(BBC, CNN, Reuters 등)를 추가하면 **글로벌 뉴스 속도**와 **다양성**을 크게 향상시킬 수 있습니다.

**핵심 발견사항**:
- 🌐 주요 해외 언론사 RSS 피드 풍부 (BBC, CNN, Reuters, AP, Bloomberg 등)
- ✅ Google News International RSS로 즉시 구현 가능
- ⚠️ **언어 장벽**: 대부분 영어 (한국어 번역 필요)
- 🔄 기존 '국제' 카테고리와 중복 가능성

---

## 1️⃣ 현재 상태 분석

### 기존 '국제' 카테고리 구성

| RSS 소스 | 언어 | 특징 |
|----------|------|------|
| Google News 국제 | 한국어 | 한국 언론사의 국제면 뉴스 |
| 동아일보 국제 | 한국어 | 국내 시각 해외 뉴스 |
| SBS 국제 | 한국어 | 국내 시각 해외 뉴스 |

**한계점**:
- ❌ 해외 직접 소스 부재
- ❌ 한국 언론사 필터링된 뉴스
- ❌ 속보 속도 느림 (번역 시차)
- ❌ 서구/아시아 관점 부족

---

## 2️⃣ 추가 가능한 해외 RSS 소스

### 2.1 주요 글로벌 통신사 (속보 중심)

| 언론사 | RSS URL | 특징 | 신뢰도 |
|--------|---------|------|--------|
| **Reuters** | `feeds.reuters.com/Reuters/worldNews` | 세계 1위 통신사, 속보 최강 | ⭐⭐⭐⭐⭐ |
| **AP News** | `hosted.ap.org/lineups/WORLDHEADS.rss` | 미국 1위 통신사, 정확성 | ⭐⭐⭐⭐⭐ |
| **BBC News** | `feeds.bbci.co.uk/news/world/rss.xml` | 영국 공영, 깊이 있는 분석 | ⭐⭐⭐⭐⭐ |
| **CNN** | `rss.cnn.com/rss/cnn_topstories.rss` | 미국 주요 방송, 속보 빠름 | ⭐⭐⭐⭐ |

**출처**: [Top 90 World News RSS Feeds](https://rss.feedspot.com/world_news_rss_feeds/), [Reuters RSS Generator](https://newsloth.com/popular-rss-feeds/reuters-rss-feeds)

---

### 2.2 금융/비즈니스 뉴스

| 언론사 | RSS URL | 특징 | 신뢰도 |
|--------|---------|------|--------|
| **Bloomberg** | `feeds.bloomberg.com/markets/news.rss` | 금융 시장 1위 | ⭐⭐⭐⭐⭐ |
| **Financial Times** | `www.ft.com/?format=rss` | 글로벌 금융 전문 | ⭐⭐⭐⭐⭐ |
| **Wall Street Journal** | `feeds.a.dj.com/rss/RSSMarketsMain.xml` | 미국 금융 전문 | ⭐⭐⭐⭐⭐ |

**출처**: [Top 20 Finance RSS Feeds](https://rss.app/en/blog/top-rss-feeds/20-best-finance-websites-to-get-rss-feeds-from), [50 Best Financial News RSS](https://rss.feedspot.com/financial_news_rss_feeds/)

---

### 2.3 Google News International

| 지역 | RSS URL | 특징 |
|------|---------|------|
| **글로벌 톱뉴스** | `news.google.com/rss/` | 전세계 주요 뉴스 집계 |
| **미국** | `news.google.com/rss/?hl=en&gl=US&ceid=US:en` | 미국 뉴스 |
| **영국** | `news.google.com/rss/?hl=en&gl=GB&ceid=GB:en` | 영국 뉴스 |
| **일본** | `news.google.com/rss/?hl=ja&gl=JP&ceid=JP:ja` | 일본 뉴스 |
| **중국** | `news.google.com/rss/?hl=zh-CN&gl=CN&ceid=CN:zh-Hans` | 중국 뉴스 |

**출처**: [Google News RSS](https://news.google.com/rss/), [Google News RSS Guide](https://help.rss.app/en/articles/10638795-how-to-create-rss-feeds-from-google-news)

---

## 3️⃣ 카테고리 추가 옵션

### Option 1: 글로벌 속보 카테고리 (추천 ⭐⭐⭐⭐⭐)

**카테고리명**: `global-breaking` (글로벌 속보)

```typescript
// RSS 소스 구성 (4-5개)
1. Google News Global Top Stories (영어)
2. Reuters World News (영어)
3. AP News World Headlines (영어)
4. BBC World News (영어)
5. CNN Top Stories (영어)
```

**장점**:
- ✅ 세계 주요 속보를 가장 빠르게 전달
- ✅ 한국 언론사 필터링 없는 원본 뉴스
- ✅ 다양한 관점 제공 (미국, 영국, 글로벌)
- ✅ 기존 '국제' 카테고리와 차별화 명확

**단점**:
- ❌ 영어 뉴스 (한국어 번역 필요)
- ❌ 사용자 이탈 가능성 (언어 장벽)

**대응 방안**:
- 제목만 AI 번역 (Groq/Gemini)
- 본문은 원문 유지 (클릭 시 번역)

---

### Option 2: 기존 '국제' 카테고리 강화

**기존 소스 유지 + 해외 RSS 추가**

```typescript
// 기존 (한국어)
- Google News 국제
- 동아일보 국제
- SBS 국제

// 신규 추가 (영어)
- Reuters World News
- AP News World
- BBC World News
```

**장점**:
- ✅ 카테고리 추가 불필요
- ✅ 한국어 + 영어 혼합 제공
- ✅ 사용자 선택권 확대

**단점**:
- ❌ 한글/영문 뉴스 혼재로 UX 저하
- ❌ 속보 vs 분석 뉴스 구분 어려움

---

### Option 3: 지역별 카테고리 (미국, 유럽, 아시아)

**카테고리 3개 추가**

```typescript
{ id: 'us-news', label: '미국' }
{ id: 'europe-news', label: '유럽' }
{ id: 'asia-news', label: '아시아' }
```

**장점**:
- ✅ 지역별 심층 뉴스 제공
- ✅ 특정 지역 관심 사용자 타겟팅

**단점**:
- ❌ 카테고리 과다 (10개 → 13개)
- ❌ 탭 UI 복잡도 증가
- ❌ 사용자 선택 피로도 증가

---

### Option 4: AI 번역 + 글로벌 뉴스 카테고리

**카테고리명**: `global` (글로벌)

**핵심 기능**:
- 해외 RSS 수집 (영어)
- **AI 자동 번역** (제목 + 요약)
- 한국어로 표시

**기술 스택**:
```typescript
// 번역 API
1. Google Translate API (유료)
2. DeepL API (유료, 고품질)
3. Groq AI 번역 (무료, 프롬프트 기반)
4. Gemini 번역 (무료 티어)
```

**장점**:
- ✅ 언어 장벽 완전 해소
- ✅ 한국어로 글로벌 뉴스 제공
- ✅ UX 개선

**단점**:
- ❌ 번역 비용 발생 (API)
- ❌ 번역 품질 이슈
- ❌ 처리 시간 증가

**비용 예상** (1,000명 사용자, 15회/일):
- Google Translate: $20-30/월
- DeepL: $30-50/월
- Groq AI (무료): $0/월 (기존 AI 활용)

---

## 4️⃣ 최종 권장안

### 🏆 추천 1순위: 글로벌 속보 카테고리 (영어 원문)

**구성**:
```typescript
{ id: 'global', label: '글로벌' }

// RSS 소스 (5개)
1. Google News Global (톱 스토리)
2. Reuters World News (통신사 속보)
3. AP News World (통신사 속보)
4. BBC World News (심층 분석)
5. Bloomberg Markets (금융 뉴스)
```

**이유**:
- 속보 속도 최우선 (영어 그대로 빠르게 전달)
- 번역 비용 없음 (초기 단계)
- 차별화된 가치 제공 (국내 언론사에 없는 뉴스)

**단계적 고도화**:
1. **1단계** (즉시): 영어 원문 제공
2. **2단계** (1-2개월): 제목만 AI 번역 (Groq/Gemini 무료)
3. **3단계** (3-6개월): 전문 번역 API 도입 (DeepL)

---

### 🥈 추천 2순위: 기존 '국제' 카테고리 강화

**이유**:
- 카테고리 추가 없이 빠른 구현
- 한국어 뉴스 우선 유지
- 영어 뉴스는 옵션으로 제공

**구성**:
```typescript
// 기존 '국제' 카테고리에 추가
- Google News 국제 (한국어) ✅
- 동아일보 국제 (한국어) ✅
- SBS 국제 (한국어) ✅
- Reuters World News (영어) 🆕
- BBC World News (영어) 🆕
```

---

## 5️⃣ 기술적 구현 방안

### 5.1 영어 뉴스 그대로 제공 (1단계)

**변경 파일**:
```bash
components/CategoryTabs.tsx  # 카테고리 추가
lib/rss/sources.ts           # RSS 소스 추가
app/topics/[category]/page.tsx  # 라우팅 (기존 코드 재사용)
```

**예상 작업 시간**: 30분

---

### 5.2 AI 제목 번역 추가 (2단계)

**새로운 API 엔드포인트**:
```typescript
// app/api/news/translate/route.ts
POST /api/news/translate
Body: { text: "Breaking: US announces...", targetLang: "ko" }
Response: { translatedText: "속보: 미국 발표..." }
```

**번역 로직**:
```typescript
// lib/ai/translator.ts
import { NewsSummarizer } from './summarizer'

export async function translateTitle(title: string): Promise<string> {
  const prompt = `다음 영어 뉴스 제목을 자연스러운 한국어로 번역하세요.

  영어: ${title}

  한국어 번역만 출력하세요 (설명 없이).`

  const result = await NewsSummarizer.summarize(prompt, '')
  return result.summary
}
```

**DB 스키마 확장**:
```prisma
model News {
  // 기존 필드...

  // 번역 관련
  originalTitle    String?  // 원본 제목 (영어)
  translatedTitle  String?  // 번역된 제목 (한국어)
  translatedAt     DateTime?
  translatorProvider String?  // groq, gemini, deepl
}
```

**예상 작업 시간**: 2-3시간

---

### 5.3 UI 개선 (언어 표시)

**뉴스 카드에 언어 뱃지 추가**:
```tsx
<div className="flex items-center gap-2">
  {news.originalTitle && (
    <span className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
      EN
    </span>
  )}
  <h3>{news.translatedTitle || news.title}</h3>
</div>
```

**번역 토글 버튼**:
```tsx
<button onClick={() => setShowOriginal(!showOriginal)}>
  {showOriginal ? '한국어로 보기' : '원문 보기'}
</button>
```

---

## 6️⃣ 비용 분석

### 무료 옵션 (영어 원문 + Groq AI 번역)

| 항목 | 비용 | 제한 |
|------|------|------|
| RSS 수집 | $0 | 무제한 |
| Groq AI 번역 | $0 | 일 1,000회 |
| 호스팅 (Vercel) | $0 | 기존 프리티어 |
| **총 비용** | **$0/월** | - |

---

### 유료 옵션 (전문 번역 API)

| 항목 | 비용 (1,000명 사용자) | 제한 |
|------|---------------------|------|
| Google Translate API | $20-30/월 | 무제한 |
| DeepL API | $30-50/월 | 고품질 |
| **총 비용** | **$30-50/월** | - |

---

## 7️⃣ UX/UI 고려사항

### 7.1 언어 표시

**옵션 A**: 뱃지 표시
```
[EN] Breaking: US announces...
[한글] 속보: 미국 발표...
```

**옵션 B**: 아이콘 표시
```
🌐 Breaking: US announces...
🇰🇷 속보: 미국 발표...
```

**옵션 C**: 색상 구분
- 한국어 뉴스: 기본 배경
- 영어 뉴스: 연한 파란색 배경

---

### 7.2 필터링 옵션

**설정 페이지 추가**:
```tsx
<div>
  <h3>글로벌 뉴스 언어 설정</h3>
  <label>
    <input type="checkbox" checked={showEnglish} />
    영어 뉴스 표시
  </label>
  <label>
    <input type="checkbox" checked={showTranslated} />
    번역된 뉴스만 표시
  </label>
</div>
```

---

## 8️⃣ 예상 효과

### 긍정적 효과
- 📈 **DAU 15-25% 증가**: 글로벌 뉴스 관심 사용자 유입
- 🌍 **차별화**: 국내 뉴스 앱 대비 독보적 가치
- ⚡ **속보 경쟁력**: 한국 언론사보다 빠른 글로벌 속보
- 🎯 **타겟층 확대**: 영어 가능 사용자, 해외 거주 한국인

### 잠재적 리스크
- ⚠️ **언어 장벽**: 영어 뉴스 거부감 (초기)
- ⚠️ **번역 품질**: AI 번역 오류 가능성
- ⚠️ **UX 복잡도**: 한글/영문 혼재 시 혼란

---

## 9️⃣ 최종 결론

### ✅ 추천: 글로벌 속보 카테고리 추가 (영어 원문)

**1단계 (즉시 구현)**:
```typescript
// 카테고리 추가
{ id: 'global', label: '글로벌' }

// RSS 소스 5개
1. Google News Global Top Stories
2. Reuters World News
3. AP News World Headlines
4. BBC World News
5. Bloomberg Markets News
```

**2단계 (1-2개월 후)**:
- 제목 AI 번역 (Groq/Gemini 무료)
- 번역/원문 토글 기능

**3단계 (사용자 반응 보고 결정)**:
- 전문 번역 API 도입 (DeepL)
- 본문 자동 번역

---

## 📎 참고 자료

### RSS 피드 목록
- [Top 90 World News RSS Feeds](https://rss.feedspot.com/world_news_rss_feeds/)
- [Reuters RSS Feeds Generator](https://newsloth.com/popular-rss-feeds/reuters-rss-feeds)
- [Google News RSS Guide](https://help.rss.app/en/articles/10638795-how-to-create-rss-feeds-from-google-news)
- [Top 20 Finance RSS Feeds](https://rss.app/en/blog/top-rss-feeds/20-best-finance-websites-to-get-rss-feeds-from)
- [50 Best Financial News RSS](https://rss.feedspot.com/financial_news_rss_feeds/)

### 기술 문서
- [Google News RSS](https://news.google.com/rss/)
- [BBC RSS Feeds](http://feeds.bbci.co.uk/news/world/rss.xml)
- [Reuters RSS](http://feeds.reuters.com/Reuters/worldNews)

---

## 🎯 즉시 실행 가능한 액션 플랜

### Phase 1: 글로벌 카테고리 추가 (30분)
```bash
1. components/CategoryTabs.tsx - 카테고리 추가
2. lib/rss/sources.ts - RSS 소스 5개 추가
3. npm run build - 빌드 테스트
4. git commit & push
```

### Phase 2: 제목 번역 기능 (2-3시간)
```bash
1. lib/ai/translator.ts - 번역 함수 생성
2. app/api/news/translate/route.ts - API 엔드포인트
3. 프리즈마 스키마 확장 (originalTitle, translatedTitle)
4. 뉴스 카드 UI 업데이트
```

### Phase 3: 사용자 피드백 수집 (2주)
```bash
1. Google Analytics 이벤트 추가 (글로벌 탭 클릭)
2. 사용자 설문조사 (언어 선호도)
3. 번역 품질 모니터링
```

---

**보고서 끝**
