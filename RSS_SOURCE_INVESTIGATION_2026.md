# 한국 언론사 RSS 소스 조사 보고서 (2026-01-18)

## 📊 조사 개요

현재 KeyWordsNews 서비스에서 사용 중인 RSS 소스(43개)의 작동 상태를 점검하고, 새로운 RSS 소스를 조사하였습니다.

---

## 1️⃣ 현재 비활성화된 소스 (10개) - 대체 URL 조사

### ✅ 해결 가능한 소스 (5개)

#### 1. 중앙일보
- **현재 URL**: `https://koreajoongangdaily.joins.com/RSS/allArticle.xml` ❌ (404)
- **대체 URL**: `http://rss.joinsmsn.com/joins_news_list.xml` ✅
- **상태**: 정상 작동 (리다이렉트 발생하나 사용 가능)
- **카테고리**: 종합

#### 2. 경향신문 (신규 추가 권장)
- **URL**: `http://www.khan.co.kr/rss/rssdata/total_news.xml` ✅
- **상태**: 정상 작동 확인 (2026-01-17 최신 뉴스 26개 포함)
- **카테고리**: 종합
- **비고**: 현재 미등록 - 추가 권장

#### 3. 한겨레 (신규 추가 권장)
- **URL**: `https://akngs.github.io/knews-rss/publishers/hani.xml` ✅
- **대체 URL**: 공식 RSS 확인 필요
- **카테고리**: 종합
- **비고**: 현재 미등록 - 추가 권장

#### 4. MBC 뉴스 (신규 추가 권장)
- **전체 뉴스**: `http://imnews.imbc.com/rss/news/news_00.xml` ✅
- **정치**: `http://imnews.imbc.com/rss/news/news_01.xml`
- **통일외교**: `http://imnews.imbc.com/rss/news/news_02.xml`
- **국제**: `http://imnews.imbc.com/rss/news/news_03.xml`
- **경제**: `http://imnews.imbc.com/rss/news/news_04.xml`
- **사회**: `http://imnews.imbc.com/rss/news/news_05.xml`
- **상태**: 정상 작동
- **비고**: 현재 미등록 - 주요 방송사로 추가 권장

#### 5. 보안뉴스 (신규 추가 권장)
- **URL**: `https://www.boannews.com/custom/news_rss.asp` ✅
- **카테고리**: Tech (IT/보안)
- **비고**: IT 보안 전문 매체

### ⚠️ 대체 URL 필요 (3개)

#### 1. YTN
- **현재 URL**: `https://www.ytn.co.kr/_ln/0101_201504301705010353_rss.xml` ❌ (404)
- **상태**: 공식 RSS 서비스 폐지 가능성
- **대안**: Google News 속보로 대체 가능

#### 2. 한국경제
- **현재 URL**: `https://www.hankyung.com/feed` ❌ (XML 파싱 오류)
- **대체 URL**: `http://rss.hankyung.com/economy.xml` (확인 필요)
- **비고**: GitHub Gist에서 찾은 URL

#### 3. KBS
- **현재 URL**: `http://world.kbs.co.kr/rss/rss_news.htm?lang=k` ❌ (XML 파싱 오류)
- **상태**: RSS 서비스 변경 가능성
- **대안**: Google News 종합으로 대체 가능

### ❌ 서비스 종료 추정 (2개)

#### 1. ZDNet Korea
- **현재 URL**: `https://zdnet.co.kr/rss/news/` ❌ (404)
- **상태**: RSS 서비스 종료 가능성 높음
- **사이트**: 정상 운영 중 (zdnet.co.kr)
- **대안**: 전자신문, 디지털타임스로 대체

#### 2. 블로터
- **현재 URL**: `https://www.bloter.net/feed/` ❌ (404)
- **상태**: RSS 서비스 종료 가능성 높음
- **사이트**: 정상 운영 중 (bloter.net)
- **대안**: IT 전문 매체로 대체

### 🔄 상태 불명 (2개)

#### 1. Google News 속보
- **상태**: 비활성화 (실시간성 부족)
- **비고**: 특정 키워드 기반 RSS는 타이밍 이슈 존재

#### 2. 뉴시스
- **현재 URL**: `https://www.newsis.com/RSS/allnews.xml` ❌ (XML 파싱 오류)
- **상태**: 접근 가능하나 XML 형식 문제
- **비고**: 뉴시스 공식 RSS 페이지 확인 필요

---

## 2️⃣ 신규 추가 권장 RSS 소스 (15개)

### 종합 일간지 (3개)

| 언론사 | URL | 우선순위 | 비고 |
|--------|-----|---------|------|
| **경향신문** | `http://www.khan.co.kr/rss/rssdata/total_news.xml` | 8 | ✅ 작동 확인 |
| **한겨레** | 공식 RSS 확인 필요 | 8 | 진보 성향 대표 언론 |
| **한국일보** | `http://rss.hankooki.com/news/hk_main.xml` | 7 | GitHub Gist 출처 |

### 방송사 (2개)

| 언론사 | URL | 우선순위 | 비고 |
|--------|-----|---------|------|
| **MBC** | `http://imnews.imbc.com/rss/news/news_00.xml` | 8 | ✅ 작동 확인, 카테고리별 RSS 제공 |
| **JTBC** | 확인 필요 | 7 | 종편 대표 채널 |

### 경제 전문지 (3개)

| 언론사 | URL | 우선순위 | 비고 |
|--------|-----|---------|------|
| **헤럴드경제** | `http://biz.heraldm.com/rss/010000000000.xml` | 7 | GitHub Gist 출처 |
| **서울경제** | 확인 필요 | 7 | 주요 경제지 |
| **이투데이** | `https://www.etoday.co.kr/rss/` | 7 | ✅ RSS 페이지 확인 |

### IT/기술 전문 (2개)

| 언론사 | URL | 우선순위 | 비고 |
|--------|-----|---------|------|
| **보안뉴스** | `https://www.boannews.com/custom/news_rss.asp` | 6 | ✅ 작동 확인, IT 보안 전문 |
| **IT조선** | 확인 필요 | 6 | IT 전문 매체 |

### 시민/대안 언론 (3개)

| 언론사 | URL | 우선순위 | 비고 |
|--------|-----|---------|------|
| **오마이뉴스** | `https://rss.ohmynews.com/rss/ohmynews.xml` | 6 | ✅ 작동 확인 |
| **프레시안** | 확인 필요 | 6 | 진보 성향 대안 언론 |
| **미디어오늘** | 확인 필요 | 5 | 언론 비평 전문 |

### 지역 언론 (2개)

| 언론사 | URL | 우선순위 | 비고 |
|--------|-----|---------|------|
| **노컷뉴스** | `http://rss.nocutnews.co.kr/nocutnews.xml` | 6 | GitHub Gist 출처 |
| **데일리안** | 확인 필요 | 5 | |

---

## 3️⃣ 현재 활성 소스 재확인 (33개)

### 정상 작동 확인 필요

현재 활성화된 33개 소스 중 다음 소스들의 작동 상태를 재확인해야 합니다:

#### 우선 확인 대상 (10개)

1. **조선일보** - `https://www.chosun.com/arc/outboundfeeds/rss/?outputType=xml`
2. **서울신문** - `http://www.seoul.co.kr/rss/rssLink.php?cate=all`
3. **국민일보** - `http://rss.kmib.co.kr/data/kmibRssAll.xml`
4. **세계일보** - `http://www.segye.com/Articles/RSSList/segye_recent.xml`
5. **파이낸셜뉴스** - `https://www.fnnews.com/rss/all/`
6. **뉴스1** - `http://rss.news1.kr/rss/total_news.xml`
7. **일간스포츠** - `http://isplus.live.joins.com/rss/sports.xml`
8. **텐아시아** - `http://tenasia.hankyung.com/webservice/rss/wp-content.xml`
9. **부산일보** - `http://www.busan.com/rss/busan_total.xml`
10. **강원일보** - `http://www.kwnews.co.kr/rss/clickTop.xml`

---

## 4️⃣ 권장 조치 사항

### 즉시 조치 (우선순위 높음)

1. **중앙일보 URL 교체**
   - 기존: `https://koreajoongangdaily.joins.com/RSS/allArticle.xml` (404)
   - 신규: `http://rss.joinsmsn.com/joins_news_list.xml`

2. **경향신문 추가** ✅
   - URL: `http://www.khan.co.kr/rss/rssdata/total_news.xml`
   - 카테고리: general
   - 우선순위: 8

3. **MBC 뉴스 추가** ✅
   - 전체: `http://imnews.imbc.com/rss/news/news_00.xml`
   - 정치/경제/사회 등 카테고리별 추가 고려

### 단기 조치 (1주일 내)

4. **오마이뉴스 추가**
   - URL: `https://rss.ohmynews.com/rss/ohmynews.xml`
   - 카테고리: general

5. **보안뉴스 추가**
   - URL: `https://www.boannews.com/custom/news_rss.asp`
   - 카테고리: tech

6. **비활성화 소스 제거 또는 URL 업데이트**
   - YTN, ZDNet, 블로터: 서비스 종료 추정 → 제거
   - 한국경제, KBS: 대체 URL 테스트 후 결정

### 중기 조치 (1개월 내)

7. **추가 언론사 조사 및 등록**
   - 한겨레, JTBC, 채널A
   - 헤럴드경제, 서울경제, 이투데이
   - 프레시안, 미디어오늘

8. **현재 활성 소스 전체 테스트**
   - 33개 RSS 피드 정상 작동 확인
   - 404/파싱 오류 소스 정리

---

## 5️⃣ RSS 소스 우선순위 기준

### 우선순위 10 (최우선)
- 긴급 속보 전용 소스
- 실시간성이 매우 중요

### 우선순위 9
- 주요 통신사 (연합뉴스 등)
- 속보성 높은 소스

### 우선순위 8
- 주요 일간지 (조선, 동아, 중앙, 경향, 한겨레 등)
- 주요 방송사 (MBC, SBS, KBS, JTBC 등)

### 우선순위 7
- 경제 전문지
- IT 전문지
- 종편/케이블 뉴스

### 우선순위 6
- 스포츠/연예 전문지
- 시민/대안 언론
- IT 전문 매체

### 우선순위 5
- 지역 언론
- 문화 전문지

---

## 6️⃣ 참고 자료

### GitHub 리소스
- [akngs/knews-rss](https://github.com/akngs/knews-rss) - 한국 언론사 RSS 모음
- [Korean News RSS URLs Gist](https://gist.github.com/koorukuroo/330a644fcc3c9ffdc7b6d537efd939c3) - 188개 언론사 RSS 주소

### 블로그 리소스
- [RSS 피드를 활용하여 각종 언론사에서 뉴스 데이터 받기](https://junpyopark.github.io/rss_parse/)
- [국내 48곳 언론사/포탈 뉴스 RSS 모음](http://w3devlabs.net/wp/?p=52)

### 언론사 공식 RSS 페이지
- [SBS 뉴스 RSS 피드](https://news.sbs.co.kr/news/rss.do)
- [전자신문 RSS](https://www.etnews.com/rss/)
- [보안뉴스 RSS](https://www.boannews.com/custom/news_rss.asp)
- [오마이뉴스 RSS](https://www.ohmynews.com/NWS_Web/Help/srv/h_help_rss.aspx)
- [경향신문 RSS](https://www.khan.co.kr/help/help_rss.html)
- [이투데이 RSS](https://www.etoday.co.kr/rss/)

---

## 7️⃣ 결론

### 현재 상태
- **총 RSS 소스**: 43개
- **활성화**: 33개 (76.7%)
- **비활성화**: 10개 (23.3%)

### 개선 가능성
- **즉시 추가 가능**: 5개 (경향신문, MBC, 오마이뉴스, 보안뉴스, 중앙일보 URL 교체)
- **단기 추가 가능**: 10개 (한겨레, JTBC, 헤럴드경제 등)
- **제거 권장**: 3개 (YTN, ZDNet, 블로터 - RSS 서비스 종료 추정)

### 목표
- **최종 RSS 소스 수**: 50-55개
- **카테고리 다양성**: 종합 15개, 경제 12개, IT 8개, 스포츠 7개, 연예 5개 등
- **정치 성향 균형**: 진보/보수/중도 골고루 포함

---

**작성일**: 2026-01-18
**작성자**: Claude Code
**버전**: 1.0
