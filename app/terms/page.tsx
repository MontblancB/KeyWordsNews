import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '이용약관 - 키워드뉴스',
  description: '키워드뉴스 서비스 이용약관',
}

export default function TermsPage() {
  return (
    <main className="pb-20 p-4 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          이용약관
        </h1>

        <div className="space-y-6 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
              제1조 (목적)
            </h2>
            <p>
              본 약관은 키워드뉴스(이하 &quot;서비스&quot;)의 이용에 관한 기본적인
              사항을 규정함을 목적으로 합니다.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
              제2조 (서비스의 내용)
            </h2>
            <p>서비스는 다음과 같은 기능을 제공합니다.</p>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li>RSS 기반 실시간 뉴스 수집 및 제공</li>
              <li>카테고리별, 키워드별 뉴스 분류</li>
              <li>AI 기반 뉴스 요약 및 인사이트</li>
              <li>경제 지표 및 주식 정보 제공</li>
              <li>실시간 트렌드 키워드 분석</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
              제3조 (뉴스 콘텐츠 및 저작권)
            </h2>
            <ul className="list-disc ml-5 space-y-1">
              <li>
                서비스에서 제공하는 뉴스 콘텐츠의 저작권은 각 언론사에 있습니다.
              </li>
              <li>
                서비스는 공개된 RSS 피드를 통해 뉴스 제목과 요약을 수집하며,
                원문은 해당 언론사 웹사이트에서 확인할 수 있습니다.
              </li>
              <li>
                뉴스 콘텐츠의 무단 복제, 배포, 상업적 이용은 관련 법률에 의해
                금지됩니다.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
              제4조 (AI 요약 면책)
            </h2>
            <ul className="list-disc ml-5 space-y-1">
              <li>
                AI 요약은 인공지능 모델에 의해 자동 생성되며, 원문의 내용과 차이가
                있을 수 있습니다.
              </li>
              <li>
                AI 요약의 정확성을 보장하지 않으며, 중요한 판단은 반드시 원문을
                확인하시기 바랍니다.
              </li>
              <li>
                AI 요약으로 인한 오해, 손실에 대해 서비스는 책임을 지지 않습니다.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
              제5조 (경제 지표 및 투자 정보 면책)
            </h2>
            <ul className="list-disc ml-5 space-y-1">
              <li>
                서비스에서 제공하는 주식, 환율, 암호화폐 등 경제 지표는 참고
                목적으로만 제공됩니다.
              </li>
              <li>
                실시간 데이터의 특성상 지연이나 오차가 있을 수 있으며, 투자
                판단의 근거로 사용하지 마십시오.
              </li>
              <li>
                투자로 인한 손실에 대해 서비스는 어떠한 책임도 지지 않습니다.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
              제6조 (서비스 변경 및 중단)
            </h2>
            <p>
              서비스는 사전 통지 없이 기능을 변경하거나 중단할 수 있으며, 이로
              인한 손해에 대해 책임을 지지 않습니다.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
              제7조 (약관의 변경)
            </h2>
            <p>
              본 약관은 서비스 내 공지를 통해 변경될 수 있으며, 변경된 약관은
              공지한 시점부터 효력이 발생합니다.
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
