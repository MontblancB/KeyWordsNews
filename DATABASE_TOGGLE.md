# Database 활성화/비활성화 가이드

이 프로젝트는 환경 변수 `USE_DATABASE`로 DB 사용 여부를 제어할 수 있습니다.

## 현재 상태: DB 비활성화 (실시간 RSS만 사용)

### 특징
- ✅ DB 불필요 (PostgreSQL, Prisma 불필요)
- ✅ Vercel Cron Job 불필요
- ✅ 항상 최신 RSS 뉴스
- ✅ 빠른 배포 및 설정
- ❌ RSS 제공량 제한 (100-200개)
- ❌ 과거 뉴스 볼 수 없음

---

## 🔄 DB 모드로 전환하기

### 1. 환경 변수 설정

#### 로컬 개발 (.env)
```env
USE_DATABASE=true
DATABASE_URL="file:./dev.db"  # 또는 PostgreSQL URL
```

#### Vercel 배포
1. Vercel 대시보드 → 프로젝트 선택
2. **Settings → Environment Variables**
3. 새 변수 추가:
   - Key: `USE_DATABASE`
   - Value: `true`
4. **Redeploy**

### 2. Vercel Cron Job 활성화

`vercel.json` 파일 수정:

```json
{
  "crons": [
    {
      "path": "/api/cron/collect-rss",
      "schedule": "0 * * * *"
    }
  ]
}
```

현재 비활성화된 부분(`_crons_disabled`)을 `crons`로 변경하세요.

### 3. Database 설정

#### PostgreSQL (Vercel Postgres 사용 시)
1. Vercel 대시보드 → Storage → Create Database
2. Postgres 선택
3. 자동으로 환경 변수 설정됨:
   - `DATABASE_URL` (pooled)
   - `DIRECT_URL` (direct)

#### Prisma 마이그레이션 실행
```bash
npx prisma generate
npx prisma db push
```

### 4. 배포 및 확인
```bash
git add .
git commit -m "Enable database mode"
git push origin main
```

배포 후 Vercel 대시보드에서 Cron Job이 활성화되었는지 확인하세요.

---

## 🔴 DB 모드로 다시 비활성화하기

### 1. 환경 변수 변경

#### 로컬
```env
USE_DATABASE=false
```

#### Vercel
1. Settings → Environment Variables
2. `USE_DATABASE` 값을 `false`로 변경
3. Redeploy

### 2. Cron Job 비활성화

`vercel.json`:
```json
{
  "_crons_disabled": [...]
}
```

### 3. 재배포
```bash
git push origin main
```

---

## 비교표

| 항목 | DB 비활성화 (현재) | DB 활성화 |
|------|------------------|----------|
| 설정 난이도 | ⭐ 쉬움 | ⭐⭐⭐ 복잡 |
| 비용 | 무료 | PostgreSQL 비용 |
| 최신성 | ✅ 항상 최신 | 1시간 지연 가능 |
| 뉴스 개수 | ~200개 | 수만개 |
| 과거 뉴스 | ❌ 불가능 | ✅ 가능 |
| 무한 스크롤 | 제한적 | ✅ 무제한 |
| 검색 | 최신만 | 전체 |

---

## 권장 사용 시나리오

### DB 비활성화 (실시간 RSS) 추천:
- 개인 프로젝트
- 소규모 사용자 (<100명)
- 항상 최신 뉴스만
- 빠른 프로토타이핑

### DB 활성화 추천:
- 상용 서비스
- 대규모 사용자 (>100명)
- 과거 뉴스 검색 필요
- 고급 분석/통계 기능
