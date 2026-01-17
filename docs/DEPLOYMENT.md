# Vercel 배포 가이드

이 문서는 KeyWordsNews 프로젝트를 Vercel에 배포하는 방법을 설명합니다.

## 사전 준비

### 1. Vercel 계정 생성
- [Vercel 홈페이지](https://vercel.com)에서 계정 생성
- GitHub 계정 연동 권장

### 2. Vercel Postgres 데이터베이스 생성
1. Vercel 대시보드 → Storage → Create Database
2. **Postgres** 선택
3. 데이터베이스 이름 입력 (예: `keywords-news-db`)
4. Region 선택 (추천: **Washington, D.C., USA (iad1)** - 가장 가까운 지역)
5. Create 클릭

## 배포 단계

### 1단계: Vercel CLI 설치 (선택사항)

```bash
npm i -g vercel
```

### 2단계: GitHub에 코드 푸시

```bash
# Git 저장소 초기화 (아직 안 했다면)
git init
git add .
git commit -m "Initial commit for Vercel deployment"

# GitHub 저장소에 푸시
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

### 3단계: Vercel에 프로젝트 배포

#### 방법 1: Vercel 웹 대시보드 (추천)

1. [Vercel 대시보드](https://vercel.com/dashboard) 접속
2. **Add New... → Project** 클릭
3. GitHub 저장소 선택
4. **Import** 클릭
5. 프로젝트 설정:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (기본값)
   - **Build Command**: `next build` (자동 감지)
   - **Output Directory**: `.next` (자동 감지)

#### 방법 2: Vercel CLI

```bash
vercel --prod
```

### 4단계: 환경 변수 설정

Vercel 대시보드에서 프로젝트 → Settings → Environment Variables로 이동:

#### 필수 환경 변수

1. **DATABASE_URL**
   - Vercel Postgres → .env.local 탭 → `POSTGRES_PRISMA_URL` 복사
   - Vercel 환경 변수에 `DATABASE_URL`로 추가
   - 환경: Production, Preview, Development 모두 체크

2. **DIRECT_URL**
   - Vercel Postgres → .env.local 탭 → `POSTGRES_URL_NON_POOLING` 복사
   - Vercel 환경 변수에 `DIRECT_URL`로 추가
   - 환경: Production, Preview, Development 모두 체크

3. **NODE_ENV** (자동 설정됨)
   - Value: `production`

#### 선택적 환경 변수

4. **CRON_SECRET** (보안 강화용)
   - Value: 랜덤 문자열 생성 (예: `openssl rand -base64 32`)
   - 환경: Production만 체크

### 5단계: 데이터베이스 초기화

환경 변수 설정 후, Vercel 대시보드에서:

1. Deployments 탭으로 이동
2. 최신 배포 클릭 → **Redeploy** 버튼 클릭
3. 또는 로컬에서:

```bash
# .env 파일에 Vercel Postgres URL 추가 후
npx prisma migrate deploy
npx prisma generate
```

### 6단계: Cron Job 설정 확인

Vercel 대시보드 → Settings → Cron Jobs에서 다음 설정 확인:

- **Path**: `/api/cron/collect-rss`
- **Schedule**: `*/10 * * * *` (10분마다)
- **Status**: Enabled

## 배포 후 확인 사항

### 1. 사이트 접속 확인
- 배포된 URL로 접속 (예: `https://keywords-news.vercel.app`)
- 뉴스가 정상적으로 표시되는지 확인

### 2. API 엔드포인트 테스트
```bash
# 속보 뉴스
curl https://your-app.vercel.app/api/news/breaking

# 카테고리별 뉴스
curl https://your-app.vercel.app/api/news/topics/general
```

### 3. Cron Job 동작 확인
- Vercel 대시보드 → Functions → Cron Logs
- 10분 후 로그 확인

### 4. 데이터베이스 연결 확인
- Vercel Postgres 대시보드 → Data → Browse
- News 테이블에 데이터가 쌓이는지 확인

## 문제 해결

### 빌드 실패
```bash
# 로컬에서 빌드 테스트
npm run build
```

### 데이터베이스 연결 오류
- Vercel Postgres URL이 올바른지 확인
- `DATABASE_URL`과 `DIRECT_URL`이 모두 설정되었는지 확인

### Cron Job 실행 안 됨
- `vercel.json`에 cron 설정이 있는지 확인
- Vercel 대시보드에서 Cron Jobs가 활성화되었는지 확인
- CRON_SECRET 설정 시 API route에서 검증 로직 확인

## 추가 최적화

### 1. 커스텀 도메인 연결
Vercel 대시보드 → Settings → Domains

### 2. 성능 모니터링
Vercel 대시보드 → Analytics

### 3. 로그 확인
Vercel 대시보드 → Deployments → 특정 배포 → Functions

## 지원

문제가 발생하면 다음을 확인하세요:
- [Vercel 공식 문서](https://vercel.com/docs)
- [Next.js 배포 가이드](https://nextjs.org/docs/deployment)
- [Prisma with Vercel](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
