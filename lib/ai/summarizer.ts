import { AIProviderFactory } from './factory'
import { SummaryResult } from './types'

/**
 * 뉴스 요약 에러 타입
 */
export class SummarizationError extends Error {
  constructor(
    message: string,
    public provider?: string,
    public originalError?: Error
  ) {
    super(message)
    this.name = 'SummarizationError'
  }
}

/**
 * 뉴스 요약 결과 (프로바이더 정보 포함)
 */
export interface SummaryResultWithProvider extends SummaryResult {
  provider: string
}

/**
 * 뉴스 요약 서비스
 * Fallback 시스템을 포함한 통합 요약 인터페이스
 */
export class NewsSummarizer {
  /**
   * 뉴스 요약 (자동 Fallback 포함)
   * @param title 뉴스 제목
   * @param content 뉴스 본문
   * @returns 요약 결과 (프로바이더 정보 포함)
   */
  static async summarize(
    title: string,
    content: string
  ): Promise<SummaryResultWithProvider> {
    console.log('[Summarizer] Starting summarization...')

    // 1차 시도: Primary Provider
    const primaryProvider = AIProviderFactory.createPrimaryProvider()
    console.log('[Summarizer] Primary provider:', primaryProvider?.name || 'none')

    if (primaryProvider) {
      try {
        const isAvailable = await primaryProvider.isAvailable()
        console.log('[Summarizer] Primary provider available:', isAvailable)

        if (isAvailable) {
          console.log('[Summarizer] Using primary provider')
          const result = await primaryProvider.summarize(title, content)
          return {
            ...result,
            provider: primaryProvider.name,
          }
        }
      } catch (error) {
        console.error(
          `[Summarizer] Primary provider (${primaryProvider.name}) failed:`,
          error
        )
        // Fallback으로 계속 진행
      }
    } else {
      console.error('[Summarizer] No primary provider created!')
    }

    // 2차 시도: Fallback Provider
    const fallbackProvider = AIProviderFactory.createFallbackProvider()
    if (fallbackProvider && fallbackProvider.name !== primaryProvider?.name) {
      try {
        const isAvailable = await fallbackProvider.isAvailable()
        if (isAvailable) {
          console.log(`Using fallback provider: ${fallbackProvider.name}`)
          const result = await fallbackProvider.summarize(title, content)
          return {
            ...result,
            provider: fallbackProvider.name,
          }
        }
      } catch (error) {
        console.error(
          `Fallback provider (${fallbackProvider.name}) failed:`,
          error
        )
      }
    }

    // 3차 시도: 모든 사용 가능한 Provider 순회
    const availableProviders = AIProviderFactory.getAvailableProviders()
    for (const provider of availableProviders) {
      // 이미 시도한 프로바이더는 건너뛰기
      if (
        provider.name === primaryProvider?.name ||
        provider.name === fallbackProvider?.name
      ) {
        continue
      }

      try {
        const isAvailable = await provider.isAvailable()
        if (isAvailable) {
          console.log(`Trying alternative provider: ${provider.name}`)
          const result = await provider.summarize(title, content)
          return {
            ...result,
            provider: provider.name,
          }
        }
      } catch (error) {
        console.error(`Provider (${provider.name}) failed:`, error)
        // 다음 프로바이더 시도
      }
    }

    // 모든 프로바이더 실패
    throw new SummarizationError(
      'All AI providers failed. Please check your API keys and try again later.',
      'none'
    )
  }

  /**
   * 특정 프로바이더로 요약 (Fallback 없음)
   * @param title 뉴스 제목
   * @param content 뉴스 본문
   * @param providerName 프로바이더 이름
   * @returns 요약 결과
   */
  static async summarizeWithProvider(
    title: string,
    content: string,
    providerName: string
  ): Promise<SummaryResultWithProvider> {
    const providers = AIProviderFactory.getAvailableProviders()
    const provider = providers.find((p) => p.name === providerName)

    if (!provider) {
      throw new SummarizationError(
        `Provider '${providerName}' not found or not configured`,
        providerName
      )
    }

    try {
      const result = await provider.summarize(title, content)
      return {
        ...result,
        provider: provider.name,
      }
    } catch (error) {
      throw new SummarizationError(
        `Provider '${providerName}' failed to summarize`,
        providerName,
        error as Error
      )
    }
  }

  /**
   * 사용 가능한 프로바이더 목록 반환
   */
  static async getAvailableProviders(): Promise<string[]> {
    const providers = AIProviderFactory.getAvailableProviders()
    const availableNames: string[] = []

    for (const provider of providers) {
      try {
        const isAvailable = await provider.isAvailable()
        if (isAvailable) {
          availableNames.push(provider.name)
        }
      } catch {
        // 사용 불가능한 프로바이더는 무시
      }
    }

    return availableNames
  }
}
