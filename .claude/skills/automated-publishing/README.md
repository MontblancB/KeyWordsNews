# Automated Publishing Skill

KeyWordsNews 프로젝트를 위한 자동 배포 워크플로우 스킬입니다.

## 🎯 목적

작업 완료 후 다음 과정을 자동화합니다:
1. 코드 검토 (보안, 성능, 품질)
2. 빌드 검증
3. 문서 업데이트 (CLAUDE.md, app/settings/page.tsx)
4. Semantic Versioning 자동 계산
5. Git 커밋 (Conventional Commits 형식)
6. GitHub 푸시

## 📁 파일 구조

```
.claude/skills/automated-publishing/
├── SKILL.md         # 메인 스킬 정의 (Claude가 읽음)
├── reference.md     # 참조 문서 (추가 정보)
└── README.md        # 이 파일 (사용 가이드)
```

## 🚀 사용 방법

### 자동 활성화 (추천)

Claude가 자연스러운 대화에서 자동으로 감지합니다:

```
✅ "다크모드 기능 완성했어, 어떻게 배포하지?"
✅ "이 변경사항을 프로덕션에 푸시하고 싶어"
✅ "작업 끝났어. 배포 프로세스 시작할게"
✅ "Time to release these changes"
```

### 수동 호출

명시적으로 스킬을 호출할 수도 있습니다:

```bash
/automated-publishing
```

## 🔄 워크플로우

### 1단계: 코드 검토
- ✅ 보안 취약점 확인
- ✅ 성능 이슈 확인
- ✅ 코드 품질 평가
- ✅ TypeScript 타입 검증

### 2단계: 빌드 검증
```bash
npm run build
```

### 3단계: 문서 업데이트
- **CLAUDE.md** (루트):
  - 버전 번호 (20번째 줄): `2.6.0` → `2.7.0`
  - 날짜 (21번째 줄): `2026-01-17`
  - 체인지로그 항목 추가 (끝 부분)

- **app/settings/page.tsx**:
  - 버전 (38번째 줄)
  - 날짜 (39번째 줄)

### 4단계: Git 커밋
```
feat(ui): Pull-to-Refresh 기능 구현

- 네이티브 터치 제스처 지원
- 백그라운드 데이터 새로고침
- 시각적 피드백 추가
```

### 5단계: 푸시
```bash
git push origin main
```

## 📋 Semantic Versioning

스킬이 자동으로 적절한 버전을 계산합니다:

| 변경 유형 | 버전 증가 | 예시 |
|----------|----------|------|
| 새 기능, 개선 | MINOR | 2.6.0 → 2.7.0 |
| 버그 수정 | PATCH | 2.6.0 → 2.6.1 |
| 호환성 없는 변경 | MAJOR | 2.6.0 → 3.0.0 |

## 📝 커밋 메시지 형식

Conventional Commits 형식을 따릅니다:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type 종류
- **feat**: 새 기능
- **fix**: 버그 수정
- **docs**: 문서
- **style**: 포맷팅
- **refactor**: 리팩토링
- **perf**: 성능
- **test**: 테스트
- **chore**: 빌드/설정

## 🔐 보안 체크

스킬이 자동으로 확인하는 보안 사항:

- ✅ API 키 노출 여부
- ✅ 하드코딩된 시크릿
- ✅ 입력 검증
- ✅ 에러 핸들링
- ✅ SQL Injection 방지

## 💡 사용 예시

### 예시 1: 새 기능 배포

```
사용자: "Pull-to-Refresh 기능 추가했어. 배포할게"

스킬:
1. ✅ 코드 검토 완료 (보안 이슈 없음)
2. ✅ 빌드 성공
3. ✅ 버전: 2.6.0 → 2.7.0
4. ✅ 커밋: "feat(ui): Pull-to-Refresh 기능 구현"
5. ✅ 푸시 완료

배포 완료! 🎉
```

### 예시 2: 버그 수정 배포

```
사용자: "다크모드 버그 수정했어"

스킬:
1. ✅ 변경사항 검토
2. ✅ 빌드 성공
3. ✅ 버전: 2.6.0 → 2.6.1 (PATCH)
4. ✅ 커밋: "fix(ui): 다크모드 입력 필드 색상 수정"
5. ✅ 푸시 완료
```

## ⚙️ 권한 설정

스킬이 사용하는 도구들:

```yaml
allowed-tools:
  - Read                    # 파일 읽기
  - Edit                    # 파일 수정
  - Bash(git add:*)        # Git 스테이징
  - Bash(git status:*)     # Git 상태
  - Bash(git diff:*)       # Git 변경사항
  - Bash(git log:*)        # Git 히스토리
  - Bash(git commit:*)     # Git 커밋
  - Bash(git push:*)       # Git 푸시
  - Bash(git branch:*)     # Git 브랜치
  - Bash(npm run build)    # 빌드 실행
  - Bash(find:*)           # 파일 찾기
  - Glob                    # 파일 패턴 매칭
  - Grep                    # 파일 검색
```

## 🐛 문제 해결

### 스킬이 자동으로 활성화되지 않아요

**해결**:
1. 명확하게 배포 의도를 표현하세요
   - ✅ "배포하고 싶어"
   - ✅ "푸시할게"
   - ❌ "끝났어" (너무 애매함)

2. 또는 수동으로 호출:
   ```
   /automated-publishing
   ```

### 빌드가 실패해요

**해결**:
스킬이 자동으로 중단하고 오류를 알려줍니다. 문제를 수정한 후 다시 시도하세요.

### 버전 번호가 이상해요

**해결**:
스킬에게 원하는 버전을 명시적으로 알려주세요:
```
"버그 수정만 했어 (PATCH 버전만 올려줘)"
"주요 기능 추가했어 (MINOR 버전 올려줘)"
```

## 📚 추가 정보

- **SKILL.md**: 메인 스킬 로직 및 프로세스
- **reference.md**: Git 명령어, Semantic Versioning, 커밋 가이드 등

## 🎓 팁

1. **작업 전 브랜치 확인**: `main` 브랜치에서 작업하세요
2. **변경사항 스테이징**: 배포하려는 파일만 `git add` 하세요
3. **빌드 테스트**: 큰 변경 후에는 로컬에서 먼저 `npm run build` 실행
4. **커밋 메시지**: 스킬이 자동으로 생성하지만, 수정 요청도 가능합니다

## 🤝 기여

이 스킬은 프로젝트와 함께 Git으로 관리됩니다. 개선사항이 있다면:

1. `.claude/skills/automated-publishing/SKILL.md` 수정
2. 변경사항 테스트
3. 커밋 및 푸시

---

**만든이**: KeyWordsNews Team
**버전**: 1.0.0
**마지막 업데이트**: 2026-01-17
