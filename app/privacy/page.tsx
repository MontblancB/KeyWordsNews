import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '개인정보처리방침 - 키워드뉴스',
  description: '키워드뉴스 개인정보처리방침',
}

export default function PrivacyPage() {
  return (
    <main className="pb-20 p-4 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          개인정보처리방침
        </h1>

        <div className="space-y-6 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
              1. 개인정보 수집 항목
            </h2>
            <p>
              키워드뉴스(이하 &quot;서비스&quot;)는 별도의 회원가입 절차가 없으며,
              최소한의 정보만 처리합니다.
            </p>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li>
                <strong>자동 수집 정보:</strong> 서비스 이용 기록, 접속 로그
                (Vercel Analytics를 통한 익명화된 페이지뷰 데이터)
              </li>
              <li>
                <strong>로컬 저장 정보:</strong> 사용자 설정(다크모드, 폰트 크기,
                키워드 목록 등)은 브라우저의 localStorage에 저장되며 서버로
                전송되지 않습니다.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
              2. 개인정보 이용 목적
            </h2>
            <ul className="list-disc ml-5 space-y-1">
              <li>서비스 제공 및 운영</li>
              <li>서비스 이용 통계 분석 및 품질 개선</li>
              <li>서비스 성능 모니터링 (Core Web Vitals)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
              3. 개인정보 보관 및 파기
            </h2>
            <ul className="list-disc ml-5 space-y-1">
              <li>
                서비스는 회원 정보를 수집하지 않으므로 별도의 보관 기간이 없습니다.
              </li>
              <li>
                Vercel Analytics를 통해 수집되는 익명화된 방문 데이터는 Vercel의
                데이터 보관 정책에 따릅니다.
              </li>
              <li>
                브라우저 localStorage에 저장된 설정 데이터는 사용자가 직접
                삭제하거나, 브라우저 데이터 삭제 시 함께 삭제됩니다.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
              4. 제3자 제공
            </h2>
            <ul className="list-disc ml-5 space-y-1">
              <li>
                서비스는 사용자의 개인정보를 제3자에게 제공하지 않습니다.
              </li>
              <li>
                단, 서비스 운영을 위해 다음 외부 서비스를 이용합니다:
                <ul className="list-disc ml-5 mt-1 space-y-1">
                  <li>Vercel: 호스팅 및 서비스 분석</li>
                  <li>Groq / Google Gemini: AI 뉴스 요약 (뉴스 본문만 전송, 사용자 정보 미포함)</li>
                </ul>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
              5. 쿠키 사용
            </h2>
            <p>
              서비스는 사용자 추적을 위한 쿠키를 직접 사용하지 않습니다. 다만,
              Vercel Analytics는 자체적으로 쿠키 없이 동작하는 방식으로 방문
              통계를 수집합니다.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
              6. 이용자의 권리
            </h2>
            <ul className="list-disc ml-5 space-y-1">
              <li>
                브라우저 설정에서 localStorage 데이터를 삭제하여 로컬 설정을
                초기화할 수 있습니다.
              </li>
              <li>
                브라우저의 Do Not Track 설정을 통해 분석 데이터 수집을 거부할 수
                있습니다.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
              7. 방침 변경
            </h2>
            <p>
              본 개인정보처리방침은 서비스 내 공지를 통해 변경될 수 있으며, 변경
              사항은 공지 시점부터 효력이 발생합니다.
            </p>
          </section>

          <p className="text-xs text-gray-500 dark:text-gray-500 mt-8">
            시행일: 2026년 2월 14일
          </p>
        </div>

        <div className="mt-8">
          <Link
            href="/settings"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            &larr; 설정으로 돌아가기
          </Link>
        </div>
      </div>
    </main>
  )
}
