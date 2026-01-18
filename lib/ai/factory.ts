import { AIProvider, AIProviderType } from './types'
import { GroqProvider } from './providers/groq'
import { GeminiProvider } from './providers/gemini'
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

    switch (providerType) {
      case 'groq':
        if (process.env.GROQ_API_KEY) {
          return new GroqProvider({
            apiKey: process.env.GROQ_API_KEY,
            model: process.env.GROQ_MODEL,
            temperature: process.env.GROQ_TEMPERATURE
              ? parseFloat(process.env.GROQ_TEMPERATURE)
              : undefined,
          })
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

      case 'gemini':
        if (process.env.GEMINI_API_KEY) {
          return new GeminiProvider({
            apiKey: process.env.GEMINI_API_KEY,
            model: process.env.GEMINI_MODEL,
          })
        }
        break

      // 향후 추가 프로바이더는 여기에 구현
      case 'openai':
        // TODO: OpenAI Provider 구현
        break
    }

    return null
  }

  /**
   * Fallback Provider 생성 (Primary 실패 시 사용)
   * 순서: Gemini (2nd) -> OpenRouter (3rd)
   */
  static createFallbackProvider(): AIProvider | null {
    // Gemini를 2번째 fallback으로 사용
    if (process.env.GEMINI_API_KEY) {
      return new GeminiProvider({
        apiKey: process.env.GEMINI_API_KEY,
        model: process.env.GEMINI_MODEL,
      })
    }

    // OpenRouter를 3번째 fallback으로 사용
    if (process.env.OPENROUTER_API_KEY) {
      return new OpenRouterProvider({
        apiKey: process.env.OPENROUTER_API_KEY,
        model: process.env.OPENROUTER_MODEL,
      })
    }

    // Groq을 fallback으로 사용 (Primary가 다른 경우)
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
   * 순서: Groq (1st) -> Gemini (2nd) -> OpenRouter (3rd)
   */
  static getAvailableProviders(): AIProvider[] {
    const providers: AIProvider[] = []

    // 1. Groq (Primary)
    if (process.env.GROQ_API_KEY) {
      providers.push(
        new GroqProvider({
          apiKey: process.env.GROQ_API_KEY,
          model: process.env.GROQ_MODEL,
        })
      )
    }

    // 2. Gemini (2nd Fallback)
    if (process.env.GEMINI_API_KEY) {
      providers.push(
        new GeminiProvider({
          apiKey: process.env.GEMINI_API_KEY,
          model: process.env.GEMINI_MODEL,
        })
      )
    }

    // 3. OpenRouter (3rd Fallback)
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
