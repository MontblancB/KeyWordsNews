/**
 * Feature Flags
 *
 * 실험적 기능을 안전하게 ON/OFF 할 수 있는 설정 파일입니다.
 * false로 설정하면 해당 기능이 완전히 비활성화되어 기존 상태로 돌아갑니다.
 *
 * 사용 방법:
 * import { FEATURE_FLAGS } from '@/lib/feature-flags'
 * if (FEATURE_FLAGS.ENABLE_DAILY_INSIGHT) { ... }
 */

export const FEATURE_FLAGS = {
  /**
   * InsightNow 기능
   * - 종합탭, 토픽탭, 키워드탭에서 현재 로드된 뉴스들을 AI로 종합 분석
   * - false로 설정 시 버튼과 모달이 표시되지 않음
   *
   * 관련 파일:
   * - components/InsightButton.tsx
   * - components/InsightModal.tsx
   * - app/api/insight/daily/route.ts
   * - app/page.tsx (종합탭)
   * - app/topics/[category]/page.tsx (토픽탭)
   * - app/keywords/page.tsx (키워드탭)
   *
   * @version 2.16.0
   * @default true
   */
  ENABLE_DAILY_INSIGHT: true,

  /**
   * BubbleNow 기능
   * - 종합탭, 토픽탭, 키워드탭에서 키워드 버블맵 시각화
   * - false로 설정 시 버튼과 모달이 표시되지 않음
   *
   * 관련 파일:
   * - components/KeywordBubbleMap/BubbleButton.tsx
   * - components/KeywordBubbleMap/BubbleModal.tsx
   * - components/KeywordBubbleMap/KeywordNewsModal.tsx
   * - app/api/news/bubble/route.ts
   * - app/page.tsx (종합탭)
   * - app/topics/[category]/page.tsx (토픽탭)
   * - app/keywords/page.tsx (키워드탭)
   *
   * @version 2.31.0
   * @default false (현재 비활성화)
   */
  ENABLE_BUBBLE_NOW: false,
} as const

export type FeatureFlags = typeof FEATURE_FLAGS
