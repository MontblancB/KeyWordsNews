import { AIProvider, AIProviderType } from './types'
import { GroqProvider } from './providers/groq'
import { OpenRouterProvider } from './providers/openrouter'

/**
 * AI Provider Factory
 * 환경 변수를 기반으로 적절한 AI Provider 생성
 */
export class AIProviderFactory {
  /**
   * 환경 변수에서 설정된 Primary Provider 생성
   */
  static createPrimaryProvider(): AIProvider | null {
    const providerType = (process.env.AI_PROVIDER || 'groq') as AIProviderType
    console.log('[Factory] AI_PROVIDER:', providerType)
    console.log('[Factory] GROQ_API_KEY exists:', !!process.env.GROQ_API_KEY)

    switch (providerType) {
      case 'groq':
        if (process.env.GROQ_API_KEY) {
          console.log('[Factory] Creating Groq provider')
          return new GroqProvider({
            apiKey: process.env.GROQ_API_KEY,
            model: process.env.GROQ_MODEL,
            temperature: process.env.GROQ_TEMPERATURE
              ? parseFloat(process.env.GROQ_TEMPERATURE)
              : undefined,
          })
        } else {
          console.error('[Factory] GROQ_API_KEY is missing!')
        }
        break

      case 'openrouter':
        if (process.env.OPENROUTER_API_KEY) {
          return new OpenRouterProvider({
            apiKey: process.env.OPENROUTER_API_KEY,
            model: process.env.OPENROUTER_MODEL,
          })
        }
        break

      // 향후 추가 프로바이더는 여기에 구현
      case 'openai':
        // TODO: OpenAI Provider 구현
        break

      case 'gemini':
        // TODO: Gemini Provider 구현
        break
    }

    return null
  }

  /**
   * Fallback Provider 생성 (Primary 실패 시 사용)
   */
  static createFallbackProvider(): AIProvider | null {
    // OpenRouter를 fallback으로 사용
    if (process.env.OPENROUTER_API_KEY) {
      return new OpenRouterProvider({
        apiKey: process.env.OPENROUTER_API_KEY,
        model: process.env.OPENROUTER_MODEL,
      })
    }

    // Groq을 fallback으로 사용
    if (process.env.GROQ_API_KEY) {
      return new GroqProvider({
        apiKey: process.env.GROQ_API_KEY,
        model: process.env.GROQ_MODEL,
      })
    }

    return null
  }

  /**
   * 모든 사용 가능한 Provider 목록 반환
   */
  static getAvailableProviders(): AIProvider[] {
    const providers: AIProvider[] = []

    if (process.env.GROQ_API_KEY) {
      providers.push(
        new GroqProvider({
          apiKey: process.env.GROQ_API_KEY,
          model: process.env.GROQ_MODEL,
        })
      )
    }

    if (process.env.OPENROUTER_API_KEY) {
      providers.push(
        new OpenRouterProvider({
          apiKey: process.env.OPENROUTER_API_KEY,
          model: process.env.OPENROUTER_MODEL,
        })
      )
    }

    return providers
  }
}
