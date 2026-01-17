# AI 뉴스 요약 기능 설정 가이드

## 📋 개요

KeyWordsNews에 AI 뉴스 요약 기능이 추가되었습니다. 이 가이드는 로컬 개발 환경과 Vercel 프로덕션 환경에서 AI 요약 기능을 설정하는 방법을 안내합니다.

---

## 🚀 1. Groq API 키 발급 (무료)

### 1-1. Groq 계정 생성
1. https://console.groq.com/ 접속
2. 우측 상단 "Sign Up" 클릭
3. Google 계정으로 간편 가입

### 1-2. API 키 생성
1. 로그인 후 https://console.groq.com/keys 접속
2. "Create API Key" 버튼 클릭
3. API Key 이름 입력 (예: `KeywordsNews`)
4. 생성된 API 키를 **안전한 곳에 복사** (한 번만 표시됨)

### 1-3. 무료 티어 제한
- **30 RPM** (분당 요청 30개)
- **1,000 RPD** (하루 요청 1,000개)
- **6,000 TPM** (분당 토큰 6,000개)
- **신용카드 불필요** ✅

---

## 🔧 2. 로컬 개발 환경 설정

### 2-1. `.env.local` 파일 생성/수정

프로젝트 루트 디렉토리에 `.env.local` 파일을 생성하거나 수정합니다:

```bash
# 기존 환경 변수
PRISMA_DATABASE_URL="postgres://..."
POSTGRES_URL="postgres://..."
CRON_SECRET="your-cron-secret"
VERCEL_APP_URL="http://localhost:3000"

# 🆕 AI Provider 설정
AI_PROVIDER="groq"                    # 사용할 프로바이더 (groq, openrouter, openai, gemini)
GROQ_API_KEY="gsk_xxxxxxxxxxxxx"      # Groq API 키 (필수)
GROQ_MODEL="llama-3.3-70b-versatile"  # 모델 (선택, 기본값: llama-3.3-70b-versatile)
GROQ_TEMPERATURE="0.3"                # Temperature (선택, 기본값: 0.3)

# 🆕 Fallback Provider (선택)
OPENROUTER_API_KEY="sk_or_xxxx"      # OpenRouter API 키 (선택)
OPENROUTER_MODEL="meta-llama/llama-3.1-70b-instruct:free"  # 모델 (선택)
```

### 2-2. 데이터베이스 마이그레이션

```bash
# Prisma 마이그레이션 실행
npx prisma migrate dev --name add_ai_summary_fields

# Prisma Client 재생성
npx prisma generate
```

### 2-3. 개발 서버 실행

```bash
npm run dev
```

---

## ☁️ 3. Vercel 프로덕션 환경 설정

### 3-1. Vercel 환경 변수 추가

1. https://vercel.com/ 로그인
2. KeyWordsNews 프로젝트 선택
3. **Settings** → **Environment Variables** 메뉴 이동
4. 다음 환경 변수들을 추가:

#### **필수 환경 변수**

| 이름 | 값 | 설명 |
|------|-----|------|
| `AI_PROVIDER` | `groq` | 사용할 AI 프로바이더 |
| `GROQ_API_KEY` | `gsk_xxxxx` | Groq API 키 |

#### **선택 환경 변수**

| 이름 | 값 | 설명 |
|------|-----|------|
| `GROQ_MODEL` | `llama-3.3-70b-versatile` | Groq 모델 (기본값 사용 권장) |
| `GROQ_TEMPERATURE` | `0.3` | Temperature (기본값 사용 권장) |
| `OPENROUTER_API_KEY` | `sk_or_xxx` | Fallback용 OpenRouter 키 (선택) |

### 3-2. 환경 변수 적용 범위 선택

- ✅ **Production** (필수)
- ✅ **Preview** (권장)
- ✅ **Development** (선택)

### 3-3. 배포

```bash
git add .
git commit -m "feat: AI 뉴스 요약 기능 추가"
git push origin main
```

Vercel이 자동으로 배포를 시작합니다.

---

## 🧪 4. 기능 테스트

### 4-1. 로컬 테스트

#### 온디맨드 요약 테스트
```bash
# 뉴스 ID를 가져오기
curl http://localhost:3000/api/news/breaking | jq '.data[0].id'

# 해당 뉴스 요약
curl -X POST http://localhost:3000/api/news/summarize \
  -H "Content-Type: application/json" \
  -d '{"newsId":"YOUR_NEWS_ID"}'
```

#### 배치 요약 테스트 (속보 자동 요약)
```bash
curl -X POST http://localhost:3000/api/news/batch-summarize \
  -H "x-cron-secret: your-cron-secret"
```

### 4-2. 프론트엔드 테스트

1. http://localhost:3000 접속
2. 속보 또는 뉴스 카드에서 **"AI 요약 보기"** 버튼 클릭
3. 요약과 키워드가 표시되는지 확인

---

## 🔄 5. AI Provider 변경 방법

### 5-1. Groq → OpenRouter 변경

```bash
# .env.local 수정
AI_PROVIDER="openrouter"
OPENROUTER_API_KEY="sk_or_xxxxx"
OPENROUTER_MODEL="meta-llama/llama-3.1-70b-instruct:free"
```

### 5-2. 새로운 Provider 추가

새로운 AI Provider를 추가하려면:

1. **Provider 구현**: `lib/ai/providers/your-provider.ts` 생성
   ```typescript
   import { AIProvider, AIProviderConfig, SummaryResult } from '../types'

   export class YourProvider implements AIProvider {
     name = 'your-provider'
     // ... 구현
   }
   ```

2. **Factory 등록**: `lib/ai/factory.ts`에 추가
   ```typescript
   case 'your-provider':
     if (process.env.YOUR_PROVIDER_API_KEY) {
       return new YourProvider({
         apiKey: process.env.YOUR_PROVIDER_API_KEY,
       })
     }
     break
   ```

3. **환경 변수 설정**
   ```bash
   AI_PROVIDER="your-provider"
   YOUR_PROVIDER_API_KEY="xxx"
   ```

---

## 📊 6. 사용량 모니터링

### 6-1. Groq 사용량 확인

https://console.groq.com/settings/limits 에서 실시간 사용량 확인 가능:
- RPM (분당 요청)
- RPD (일일 요청)
- TPM (분당 토큰)

### 6-2. 배치 요약 상태 확인

```bash
curl -X GET https://key-words-news.vercel.app/api/news/batch-summarize \
  -H "x-cron-secret: your-cron-secret"
```

응답:
```json
{
  "success": true,
  "stats": {
    "total": 50,
    "summarized": 45,
    "pending": 5,
    "summarizationRate": 90
  }
}
```

---

## ⚠️ 7. 트러블슈팅

### 문제 1: "All AI providers failed" 에러

**원인**: API 키가 잘못되었거나 설정되지 않음

**해결**:
```bash
# 환경 변수 확인
echo $GROQ_API_KEY

# Groq API 키 테스트
curl https://api.groq.com/openai/v1/models \
  -H "Authorization: Bearer $GROQ_API_KEY"
```

### 문제 2: Rate Limit 초과

**원인**: Groq 무료 티어 제한 초과 (30 RPM, 1,000 RPD)

**해결**:
1. 배치 처리 간격을 2초로 설정 (이미 적용됨)
2. OpenRouter를 Fallback으로 설정
3. 유료 티어로 업그레이드 고려

### 문제 3: 크롤링 실패

**원인**: 언론사 사이트가 크롤링을 차단함

**해결**:
- 자동으로 RSS summary를 사용하도록 fallback 구현됨
- 특정 언론사 선택자를 `lib/scraper/newsContent.ts`에 추가

### 문제 4: Vercel 배포 후 작동 안 함

**원인**: 환경 변수가 Vercel에 설정되지 않음

**해결**:
1. Vercel Dashboard → Settings → Environment Variables 확인
2. `GROQ_API_KEY`가 Production 환경에 설정되어 있는지 확인
3. Redeploy 실행

---

## 🎯 8. 운영 가이드

### 8-1. 자동 요약 흐름

```
1. GitHub Actions (10분마다)
   ↓
2. RSS 수집 (/api/cron/collect-rss)
   ↓
3. 배치 요약 (/api/news/batch-summarize)
   ↓
4. 속보 뉴스 자동 요약 (최근 1시간 내)
   ↓
5. DB 저장 (캐싱)
```

### 8-2. 온디맨드 요약 흐름

```
1. 사용자가 "AI 요약 보기" 클릭
   ↓
2. POST /api/news/summarize
   ↓
3. 캐시 확인 (이미 요약된 경우 즉시 반환)
   ↓
4. 본문 크롤링 → AI 요약 → DB 저장
   ↓
5. 결과 표시
```

### 8-3. 예상 비용

#### 무료 (Groq)
- 하루 예상 사용량: 600건
- Groq 무료 한도: 1,000 RPD
- **월 비용: $0** ✅

#### 유료 전환 시 (선택)
- Groq Developer Tier: ~$15-20/월
- OpenAI GPT-4o-mini: ~$10-15/월
- Google Gemini Flash: ~$7-10/월

---

## 📚 9. 추가 리소스

- [Groq Documentation](https://console.groq.com/docs)
- [Llama 3.3 Model Card](https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct)
- [OpenRouter Documentation](https://openrouter.ai/docs)
- [프로젝트 GitHub](https://github.com/MontblancB/KeyWordsNews)

---

## ❓ 10. FAQ

**Q: Groq 무료 티어로 충분한가요?**
A: 네, 하루 600건 요약 기준으로 1,000 RPD 한도 내에서 충분히 사용 가능합니다.

**Q: 다른 AI 모델을 사용하고 싶어요.**
A: `lib/ai/providers/`에 새로운 Provider를 구현하고 Factory에 등록하면 됩니다.

**Q: 요약 품질을 개선하려면?**
A: `lib/ai/providers/groq.ts`의 프롬프트를 수정하거나, `GROQ_MODEL`을 다른 모델로 변경하세요.

**Q: 배치 요약을 더 자주 실행하려면?**
A: `.github/workflows/cron-rss.yml`의 cron 스케줄을 수정하세요 (예: `*/5 * * * *` → 5분마다).

---

**마지막 업데이트**: 2026-01-16
**버전**: 2.2.0
