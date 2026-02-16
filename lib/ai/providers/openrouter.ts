import { AIProvider, AIProviderConfig, SummaryResult, SummarizeOptions } from '../types'
import { buildSummarizeSystemPrompt, buildSummarizePrompt } from '../prompts/summarize'

/**
 * OpenRouter AI Provider
 * 여러 모델을 통합하여 사용 가능한 폴백 프로바이더
 */
export class OpenRouterProvider implements AIProvider {
  name = 'openrouter'
  private apiKey: string
  private model: string
  private temperature: number
  private maxTokens: number

  constructor(config: AIProviderConfig) {
    this.apiKey = config.apiKey
    this.model = config.model || 'meta-llama/llama-3.1-70b-instruct:free'
    this.temperature = config.temperature ?? 0.3
    this.maxTokens = config.maxTokens ?? 2400  // 응답 잘림 방지를 위해 2배 증가 (1200 → 2400)
  }

  async summarize(title: string, content: string, options?: SummarizeOptions): Promise<SummaryResult> {
    const prompt = buildSummarizePrompt(title, content, options?.category)

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.VERCEL_APP_URL || 'http://localhost:3000',
          'X-Title': 'KeyWordsNews',
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: buildSummarizeSystemPrompt(),
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: this.temperature,
          max_tokens: this.maxTokens,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`OpenRouter API error: ${response.status} - ${JSON.stringify(errorData)}`)
      }

      const data = await response.json()
      const responseContent = data.choices[0]?.message?.content
      const finishReason = data.choices[0]?.finish_reason

      // 디버깅
      console.log('[OpenRouter] finishReason:', finishReason)
      console.log('[OpenRouter] Content length:', responseContent?.length || 0)

      if (!responseContent) {
        throw new Error('Empty response from OpenRouter API')
      }

      // finishReason이 length면 응답이 잘렸을 가능성
      const isTruncated = finishReason === 'length'

      // JSON 파싱 헬퍼 함수
      function tryParseJson(jsonStr: string): SummaryResult | null {
        try {
          return JSON.parse(jsonStr) as SummaryResult
        } catch {
          return null
        }
      }

      // 잘린 JSON 복구 시도 함수
      function tryRepairJson(jsonStr: string): SummaryResult | null {
        const summaryMatch = jsonStr.match(/"summary"\s*:\s*"((?:[^"\\]|\\.)*)/)
        if (summaryMatch) {
          const summaryContent = summaryMatch[1]
          const repairedJson = `{"summary": "${summaryContent}", "keywords": []}`
          const parsed = tryParseJson(repairedJson)
          if (parsed) {
            console.log('[OpenRouter] JSON repaired successfully')
            return parsed
          }
        }
        return null
      }

      let result: SummaryResult | null = null

      // 1. JSON 추출 (마크다운 코드 블록 처리)
      const jsonMatch = responseContent.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        result = tryParseJson(jsonMatch[0])
      }

      // 2. 실패 시 - 잘린 JSON 복구 시도
      if (!result && isTruncated) {
        console.log('[OpenRouter] Response truncated, attempting repair...')
        result = tryRepairJson(responseContent)
      }

      // 3. 여전히 실패 - 정규식으로 summary 추출
      if (!result) {
        console.log('[OpenRouter] Direct parse failed, trying regex extraction...')

        const summaryRegex = /"summary"\s*:\s*"((?:[^"\\]|\\["\\nrt])*)"/
        const match = responseContent.match(summaryRegex)

        if (match) {
          const extractedSummary = match[1]
            .replace(/\\n/g, '\n')
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, '\\')

          const keywordsMatch = responseContent.match(/"keywords"\s*:\s*\[([\s\S]*?)\]/)
          let keywords: string[] = []
          if (keywordsMatch) {
            const keywordsStr = keywordsMatch[1]
            keywords = keywordsStr.match(/"([^"]+)"/g)?.map((k: string) => k.replace(/"/g, '')) || []
          }

          result = { summary: extractedSummary, keywords }
          console.log('[OpenRouter] Extracted via regex, summary length:', extractedSummary.length)
        }
      }

      // 4. 최종 실패
      if (!result) {
        throw new Error(`JSON parse failed. finishReason: ${finishReason}, Content preview: "${responseContent.slice(0, 200)}..."`)
      }

      // 검증
      if (!result.summary || !Array.isArray(result.keywords)) {
        throw new Error('Invalid response format from OpenRouter API')
      }

      // 요약 정제
      result.summary = result.summary.trim()

      // 불릿 포인트가 없으면 추가 (AI가 형식을 안 지킨 경우)
      if (!result.summary.includes('•')) {
        // 줄바꿈으로 분리된 경우 불릿 추가
        result.summary = result.summary
          .split('\n')
          .filter((line) => line.trim())
          .map((line) => `• ${line.trim()}`)
          .join('\n')
      }

      // 불릿 포인트 개수 확인 (3-5개)
      const bulletPoints = result.summary.split('\n').filter((line) => line.includes('•'))
      if (bulletPoints.length < 3) {
        console.warn(`[OpenRouter] Warning: Too few bullet points (${bulletPoints.length})`)
      } else if (bulletPoints.length > 5) {
        result.summary = bulletPoints.slice(0, 5).join('\n')
      }

      // 키워드 개수 제한 (3-5개)
      result.keywords = result.keywords.slice(0, 5)

      return result
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`OpenRouter API error: ${error.message}`)
      }
      throw error
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      })
      return response.ok
    } catch {
      return false
    }
  }
}
