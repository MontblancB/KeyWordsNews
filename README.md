# 키워드뉴스 - RSS 기반 실시간 뉴스 PWA

아이폰 홈화면에 추가하여 사용할 수 있는 실시간 뉴스 서비스입니다.

## ✨ 주요 기능

- ⚡ **실시간 속보**: RSS 피드에서 최신 뉴스 자동 수집
- 📌 **카테고리별 뉴스**: 정치, 경제, IT, 스포츠, 종합 뉴스
- 🔍 **키워드 검색**: 수집된 뉴스에서 키워드 검색
- 📱 **PWA**: 아이폰/안드로이드 홈화면 추가 가능
- 🔄 **자동 갱신**: 3-5분마다 자동 뉴스 업데이트

## 🚀 빠른 시작

### 1. 뉴스 수집
```bash
npm run collect
```
동아일보, SBS 등 주요 언론사에서 RSS를 통해 뉴스를 수집합니다.

### 2. 개발 서버 실행
```bash
npm run dev
```
http://localhost:3000 에서 확인

### 3. (선택) 자동 수집 시작
```bash
npm run collect:watch
```
5분마다 자동으로 새 뉴스를 수집합니다.

## 📊 현재 상태

- ✅ **RSS 수집**: 250개 뉴스 수집 완료
- ✅ **API**: 정상 작동 중
- ✅ **UI**: 모바일 최적화 완료
- ✅ **개발 서버**: http://localhost:3000

## 🗂️ 프로젝트 구조

```
KeyWordsNews/
├── app/                    # Next.js 앱 디렉토리
│   ├── api/news/          # REST API 엔드포인트
│   ├── topics/[category]/ # 카테고리별 페이지
│   ├── search/            # 검색 페이지
│   └── page.tsx           # 메인 페이지
├── components/             # React 컴포넌트
├── lib/
│   ├── rss/               # RSS 수집 시스템
│   └── db/                # 데이터베이스 함수
├── prisma/                 # Prisma 스키마
├── dev.db                  # SQLite 데이터베이스
└── public/                 # 정적 파일
```

## 📱 PWA 설치 (아이폰)

1. Safari에서 http://localhost:3000 접속
2. 하단 공유 버튼 (⬆️) 클릭
3. "홈 화면에 추가" 선택
4. 홈 화면에서 앱처럼 실행!

## 🔧 기술 스택

- **Frontend**: Next.js 14 + React + TypeScript
- **Styling**: Tailwind CSS
- **Database**: SQLite + Prisma
- **State**: React Query
- **RSS**: rss-parser
- **Scheduling**: node-cron

## 📡 API 엔드포인트

| 엔드포인트 | 설명 |
|-----------|------|
| `GET /api/news/latest` | 최신 뉴스 30개 |
| `GET /api/news/breaking` | 긴급 속보 10개 |
| `GET /api/news/topics/:category` | 카테고리별 뉴스 |
| `GET /api/news/search?q=키워드` | 키워드 검색 |

## 📰 RSS 소스

- 동아일보 (종합, 정치, 경제, IT, 스포츠)
- 뉴시스
- 한국경제

> 추가 언론사는 `lib/rss/sources.ts`에서 설정 가능

## 🎯 다음 단계

현재 MVP 버전이 완성되었습니다. 다음과 같은 기능을 추가할 수 있습니다:

- [ ] PWA 아이콘 추가 (public/icons/)
- [ ] WebSocket 실시간 푸시
- [ ] 사용자 계정 및 설정
- [ ] 키워드 즐겨찾기
- [ ] 푸시 알림
- [ ] 다크 모드
- [ ] PostgreSQL 마이그레이션 (확장성 향상)

## 🐛 문제 해결

### 뉴스가 표시되지 않는 경우
```bash
npm run collect  # 뉴스 수집 먼저 실행
```

### 개발 서버 오류
```bash
rm -rf .next node_modules
npm install
npm run dev
```

## 📄 라이선스

MIT License

## 🤝 기여

이슈 및 PR은 언제든 환영합니다!

---

**Made with ❤️ using Next.js & RSS**
