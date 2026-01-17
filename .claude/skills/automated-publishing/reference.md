# Automated Publishing Reference

이 문서는 `automated-publishing` 스킬을 위한 추가 참조 정보를 제공합니다.

---

## Git 명령어 참조

### 상태 확인

```bash
# 간단한 상태 보기
git status --short

# 스테이징된 변경사항 보기
git diff --staged

# 현재 브랜치 확인
git branch --show-current

# 최근 커밋 히스토리
git log --oneline -5
```

### 스테이징 및 커밋

```bash
# 모든 변경사항 스테이징
git add -A

# 커밋 생성
git commit -m "commit message"

# 여러 줄 커밋 메시지
git commit -m "$(cat <<'EOF'
feat(ui): 새 기능 추가

상세 설명...

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"
```

### 푸시

```bash
# main 브랜치로 푸시
git push origin main

# 브랜치 확인 후 푸시
BRANCH=$(git branch --show-current)
git push origin $BRANCH
```

---

## Semantic Versioning 예시

### 2.5.0에서 시작

#### 새 기능/개선 → 2.6.0 (MINOR 증가)
- 다크모드 지원
- 성능 개선
- 새 API 엔드포인트
- 사용자 경험 개선
- UI 컴포넌트 추가

#### 버그 수정만 → 2.5.1 (PATCH 증가)
- 스타일링 이슈 수정
- Race condition 수정
- 타이포 수정
- 에러 핸들링 개선

#### 호환성 없는 변경 → 3.0.0 (MAJOR 증가)
- API 엔드포인트 제거
- 데이터베이스 스키마 호환성 없는 변경
- Deprecated 기능 제거
- 주요 아키텍처 변경

---

## KeyWordsNews 파일 위치

### 업데이트할 파일

| 파일 | 위치 | 업데이트 내용 |
|------|------|--------------|
| CLAUDE.md | 루트 디렉토리 | 버전 (20번째 줄), 날짜 (21번째 줄), 체인지로그 (끝) |
| app/settings/page.tsx | app/settings/ | 버전 (38번째 줄), 날짜 (39번째 줄) |

### CLAUDE.md 구조

```markdown
## 프로젝트 개요
...

### 배포 정보
- **배포 URL**: https://key-words-news.vercel.app
- **GitHub**: https://github.com/MontblancB/KeyWordsNews
- **현재 버전**: 2.6.0                    ← 여기 업데이트 (20번째 줄)
- **마지막 업데이트**: 2026-01-17          ← 여기 업데이트 (21번째 줄)

...

## 최근 업데이트

### v2.6.0 (2026-01-17)                    ← 새 항목 추가 (끝 부분)
**기능 제목**

- 변경사항 1
- 변경사항 2
```

### app/settings/page.tsx 구조

```typescript
export default function SettingsPage() {
  return (
    <div>
      ...
      <div className="mb-4">
        <h2>버전 정보</h2>
        <p>버전: 2.6.0</p>              ← 여기 업데이트 (38번째 줄)
        <p>마지막 업데이트: 2026-01-17</p> ← 여기 업데이트 (39번째 줄)
      </div>
      ...
    </div>
  )
}
```

---

## Conventional Commits 타입

| Type | 사용 시기 | 예시 |
|------|----------|------|
| **feat** | 새 기능 | feat(ui): 다크모드 토글 추가 |
| **fix** | 버그 수정 | fix(api): null 포인터 예외 수정 |
| **docs** | 문서 업데이트 | docs: README에 설치 가이드 추가 |
| **style** | 코드 포맷팅 (로직 변경 없음) | style: 코드 포맷팅 및 린트 수정 |
| **refactor** | 코드 재구성 (동작 변경 없음) | refactor: 컴포넌트 구조 개선 |
| **perf** | 성능 개선 | perf: 이미지 로딩 최적화 |
| **test** | 테스트 추가 | test: API 엔드포인트 테스트 추가 |
| **chore** | 빌드, 의존성, 설정 | chore: 의존성 업데이트 |

---

## 커밋 메시지 작성 가이드

### 좋은 커밋 메시지 예시

✅ **명확하고 구체적**:
```
feat(performance): 모든 카테고리에 프리페칭 추가

- 백그라운드 글로벌 프리페칭 구현
- 100ms 간격으로 순차 실행하여 서버 부하 분산
- 5분간 캐시 유지로 중복 요청 방지

성능: 페이지 전환 시간 500ms → 50ms (90% 개선)
```

✅ **문제와 해결책 설명**:
```
fix(ui): 다크모드에서 입력 필드가 보이지 않던 문제 수정

문제: 다크모드에서 흰색 배경에 흰색 텍스트로 인해 입력 필드가 안 보임
해결: dark:bg-gray-800과 dark:text-white 클래스 추가

Fixes #123
```

✅ **간결하면서도 정보 제공**:
```
perf(cache): React Query 캐시 시간을 1분에서 5분으로 증가

불필요한 API 호출 80% 감소
```

### 나쁜 커밋 메시지 예시

❌ **너무 애매함**:
```
fix: 버그 수정
```

❌ **What만 설명하고 Why 없음**:
```
feat: 코드 추가
```

❌ **여러 변경사항을 하나의 커밋에**:
```
feat: 다크모드 추가, 버그 10개 수정, 성능 개선, 문서 업데이트
```

---

## 보안 체크리스트

코드 검토 시 확인할 보안 사항:

### API 키 및 시크릿

```bash
# .env 파일이 .gitignore에 있는지 확인
cat .gitignore | grep .env

# 코드에 하드코딩된 시크릿 검색
git diff --staged | grep -i "api_key\|secret\|password\|token"
```

- [ ] API 키가 .env 파일에만 있음
- [ ] .env 파일이 .gitignore에 포함됨
- [ ] 하드코딩된 비밀번호 없음
- [ ] 환경 변수로 민감한 정보 관리

### 입력 검증

- [ ] 사용자 입력에 대한 검증
- [ ] SQL Injection 방지 (Prisma ORM 사용)
- [ ] XSS 방지 (React가 기본 제공)
- [ ] CSRF 토큰 (필요시)

### 에러 핸들링

- [ ] try-catch 블록 사용
- [ ] 에러 메시지에 민감한 정보 노출 안 함
- [ ] 적절한 HTTP 상태 코드 반환
- [ ] 클라이언트에게 유용한 에러 메시지

---

## 성능 최적화 체크리스트

### React 컴포넌트

- [ ] 불필요한 리렌더링 방지 (useMemo, useCallback)
- [ ] 컴포넌트 분리 및 레이지 로딩
- [ ] 이미지 최적화 (Next.js Image)
- [ ] CSS-in-JS 최소화

### API 및 데이터베이스

- [ ] 데이터베이스 쿼리 최적화
- [ ] 인덱스 적절히 설정
- [ ] N+1 쿼리 문제 방지
- [ ] 페이지네이션 구현

### 캐싱

- [ ] React Query 캐싱 전략
- [ ] API 응답 캐싱
- [ ] Static Generation (SSG) 활용
- [ ] CDN 캐싱

---

## npm 빌드 명령어

```bash
# 프로덕션 빌드
npm run build

# 개발 서버 실행
npm run dev

# 타입 체크
npx tsc --noEmit

# 린트 체크
npm run lint

# Prisma 클라이언트 재생성
npx prisma generate

# 데이터베이스 마이그레이션
npx prisma migrate deploy
```

---

## 문제 해결

### 빌드 실패

**증상**: `npm run build` 실패

**해결**:
1. TypeScript 에러 확인: `npx tsc --noEmit`
2. 린트 에러 확인: `npm run lint`
3. node_modules 재설치:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```
4. Prisma 클라이언트 재생성: `npx prisma generate`

### Git 푸시 실패

**증상**: `git push` 실패

**해결**:
1. 브랜치 확인: `git branch --show-current`
2. 원격 저장소 확인: `git remote -v`
3. Pull 후 다시 푸시:
   ```bash
   git pull origin main --rebase
   git push origin main
   ```

### 권한 문제

**증상**: Permission denied

**해결**:
1. GitHub 인증 확인
2. SSH 키 설정 확인
3. HTTPS 대신 SSH 사용 고려

---

## 추가 리소스

### 문서
- [Semantic Versioning](https://semver.org/lang/ko/)
- [Conventional Commits](https://www.conventionalcommits.org/ko/v1.0.0/)
- [Git 공식 문서](https://git-scm.com/doc)

### 프로젝트 관련
- [KeyWordsNews GitHub](https://github.com/MontblancB/KeyWordsNews)
- [Vercel 배포](https://key-words-news.vercel.app)

---

## 사용 예시

### 시나리오 1: 새 기능 추가 후 배포

```
사용자: "Pull-to-Refresh 기능 완성했어, 배포하려고"

스킬 활성화:
1. git status로 변경사항 확인
2. 코드 검토 (4개 파일 수정)
3. npm run build 실행
4. CLAUDE.md 업데이트 (2.6.0 → 2.7.0)
5. app/settings/page.tsx 업데이트
6. 커밋: "feat(ui): Pull-to-Refresh 기능 구현"
7. 푸시 완료
```

### 시나리오 2: 버그 수정 후 배포

```
사용자: "다크모드 버그 수정했어"

스킬 활성화:
1. 변경사항 검토 (1개 파일)
2. 빌드 검증
3. CLAUDE.md 업데이트 (2.6.0 → 2.6.1)
4. 커밋: "fix(ui): 다크모드 입력 필드 색상 수정"
5. 푸시
```

### 시나리오 3: 문서만 업데이트

```
사용자: "README 업데이트했어"

스킬 활성화:
1. 문서 변경 확인
2. 버전 변경 없음 (문서만)
3. 커밋: "docs: README에 설치 가이드 추가"
4. 푸시
```
