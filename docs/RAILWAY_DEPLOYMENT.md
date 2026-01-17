# Railway 배포 가이드 (GitHub 연동)

Railway는 GitHub 저장소와 자동 연동되어 배포할 수 있습니다.

## 1단계: Railway 계정 생성

1. [Railway 홈페이지](https://railway.app) 접속
2. **GitHub로 로그인** (자동 연동)

## 2단계: 프로젝트 생성

1. Dashboard → **New Project**
2. **Deploy from GitHub repo** 선택
3. KeyWordsNews 저장소 선택
4. **Deploy Now** 클릭

## 3단계: PostgreSQL 추가

1. 프로젝트 대시보드 → **New** → **Database** → **PostgreSQL**
2. 자동으로 `DATABASE_URL` 환경 변수 생성됨

## 4단계: 환경 변수 설정

프로젝트 → Variables 탭:

```
DATABASE_URL=자동생성됨
DIRECT_URL=${{Postgres.DATABASE_URL}}
NODE_ENV=production
```

## 5단계: 빌드 설정

Railway가 자동으로 감지하지만, 필요시 설정:

```
Build Command: npm run build
Start Command: npm run start
```

## 6단계: Cron Jobs 설정

Railway에는 내장 Cron이 없으므로 외부 서비스 사용:

### 방법 1: GitHub Actions (무료)

`.github/workflows/cron-rss.yml` 생성:

```yaml
name: RSS Collection Cron

on:
  schedule:
    - cron: '*/10 * * * *'  # 10분마다
  workflow_dispatch:  # 수동 실행 가능

jobs:
  collect-rss:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger RSS Collection
        run: |
          curl -X GET https://your-app.up.railway.app/api/cron/collect-rss \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

GitHub Secrets에 `CRON_SECRET` 추가

### 방법 2: EasyCron (무료)

1. [EasyCron](https://www.easycron.com) 가입
2. New Cron Job:
   - URL: `https://your-app.up.railway.app/api/cron/collect-rss`
   - Interval: Every 10 minutes
   - HTTP Header: `Authorization: Bearer YOUR_CRON_SECRET`

## 자동 배포

이제 `git push`만 하면 자동으로 배포됩니다!

```bash
git add .
git commit -m "Update"
git push
→ Railway가 자동으로 배포!
```

## 장단점

### 장점
- GitHub 완벽 연동
- PostgreSQL 무료
- 자동 배포
- $5 무료 크레딧/월

### 단점
- Cron Jobs 별도 설정 필요
- 무료 티어 제한 (500시간/월)
