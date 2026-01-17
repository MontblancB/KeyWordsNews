/**
 * AI 요약 결과 타입
 */
export interface SummaryResult {
  summary: string      // 요약 텍스트 (불릿 포인트 형식)
  keywords: string[]   // 핵심 키워드 (3-5개)
  oneLiner?: string    // 한 줄 정리 (20-30자 이내)
}

/**
 * AI Provider 설정
 */
export interface AIProviderConfig {
  apiKey: string
  model?: string
  temperature?: number
  maxTokens?: number
}

/**
 * 스트리밍 청크 타입
 */
export interface StreamChunk {
  type: 'token' | 'done' | 'error'
  content?: string
  result?: SummaryResult
  error?: string
}

/**
 * AI Provider 추상 인터페이스
 * 모든 AI 프로바이더는 이 인터페이스를 구현해야 함
 */
export interface AIProvider {
  name: string

  /**
   * 뉴스 요약 생성
   * @param title 뉴스 제목
   * @param content 뉴스 본문
   * @returns 요약 결과
   */
  summarize(title: string, content: string): Promise<SummaryResult>

  /**
   * 뉴스 요약 생성 (스트리밍)
   * @param title 뉴스 제목
   * @param content 뉴스 본문
   * @returns 스트리밍 청크 제너레이터
   */
  summarizeStream?(
    title: string,
    content: string
  ): AsyncGenerator<StreamChunk>

  /**
   * Provider 상태 확인
   * @returns Provider가 사용 가능한지 여부
   */
  isAvailable(): Promise<boolean>
}

/**
 * 지원되는 AI Provider 타입
 */
export type AIProviderType = 'groq' | 'openai' | 'gemini' | 'openrouter'
