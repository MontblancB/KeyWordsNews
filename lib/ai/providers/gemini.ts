import { AIProvider, AIProviderConfig, SummaryResult, SummarizeOptions } from '../types'
import { buildSummarizeSystemPrompt, buildSummarizePrompt } from '../prompts/summarize'

/**
 * Google Gemini AI Provider
 * Gemini 2.5 Flash Lite를 사용한 고속 뉴스 요약
 *
 * 개선사항:
 * - maxOutputTokens: 4000 (응답 잘림 방지)
 * - 재시도 로직: MAX_TOKENS 발생 시 자동 재시도
 * - 타임아웃: 30초 (무한 대기 방지)
 */
export class GeminiProvider implements AIProvider {
  name = 'gemini'
  private apiKey: string
  private model: string
  private temperature: number
  private maxTokens: number
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta'
  private maxRetries = 2  // 최대 재시도 횟수
  private timeout = 30000 // 30초 타임아웃

  constructor(config: AIProviderConfig) {
    this.apiKey = config.apiKey
    this.model = config.model || 'gemini-2.5-flash-lite'
    this.temperature = config.temperature ?? 0.3
    this.maxTokens = config.maxTokens ?? 4000  // 2400 → 4000 (응답 잘림 방지)
  }

  async summarize(title: string, content: string, options?: SummarizeOptions): Promise<SummaryResult> {
    const prompt = buildSummarizePrompt(title, content, options?.category)

    let lastError: Error | null = null
    let currentMaxTokens = this.maxTokens

    // 재시도 루프 (MAX_TOKENS 발생 시 토큰 수 증가하여 재시도)
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const result = await this.callGeminiAPI(prompt, currentMaxTokens)

        // 응답이 유효하면 반환
        if (result && result.summary && result.summary.trim().length > 0) {
          return result
        }

        throw new Error('Empty or invalid response')
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))

        // MAX_TOKENS 에러인 경우 토큰 수 증가 후 재시도
        if (lastError.message.includes('MAX_TOKENS') || lastError.message.includes('truncated')) {
          currentMaxTokens = Math.min(currentMaxTokens + 2000, 8000) // 최대 8000까지
          console.log(`[Gemini] Retry ${attempt + 1}/${this.maxRetries}: Increasing maxTokens to ${currentMaxTokens}`)
          continue
        }

        // 다른 에러는 바로 throw
        throw lastError
      }
    }

    throw lastError || new Error('All retry attempts failed')
  }

  private async callGeminiAPI(prompt: string, maxTokens: number): Promise<SummaryResult> {
    // AbortController로 타임아웃 구현
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(
        `${this.baseUrl}/models/${this.model}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': this.apiKey,
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `${buildSummarizeSystemPrompt()}\n\n${prompt}`,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: this.temperature,
              maxOutputTokens: maxTokens,
              responseMimeType: 'application/json',
              responseSchema: {
                type: 'object',
                properties: {
                  summary: {
                    type: 'string',
                    description: '뉴스 요약 (불릿 포인트 형식)',
                  },
                  keywords: {
                    type: 'array',
                    items: { type: 'string' },
                    description: '핵심 키워드 3-5개',
                  },
                },
                required: ['summary', 'keywords'],
              },
            },
          }),
          signal: controller.signal,
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          `Gemini API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`
        )
      }

      const data = await response.json()
      const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text
      const finishReason = data.candidates?.[0]?.finishReason

      // 디버깅
      console.log('[Gemini] finishReason:', finishReason)
      console.log('[Gemini] Content length:', textContent?.length || 0)
      console.log('[Gemini] maxTokens used:', maxTokens)

      if (!textContent) {
        throw new Error('Empty response from Gemini API')
      }

      // finishReason이 MAX_TOKENS면 응답이 잘렸을 가능성
      const isTruncated = finishReason === 'MAX_TOKENS' || finishReason === 'LENGTH'

      if (isTruncated) {
        console.warn('[Gemini] Response was truncated (MAX_TOKENS)')
      }

      // JSON 파싱 시도
      const result = this.parseResponse(textContent, isTruncated)

      // 잘린 응답이고 결과가 불완전하면 에러 throw (재시도 유도)
      if (isTruncated && this.isIncomplete(result)) {
        throw new Error('Response truncated and incomplete - retry needed')
      }

      return result
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Gemini API timeout after ${this.timeout / 1000}s`)
      }
      throw error
    } finally {
      clearTimeout(timeoutId)
    }
  }

  private parseResponse(textContent: string, isTruncated: boolean): SummaryResult {
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
      // summary 필드 추출 시도
      const summaryMatch = jsonStr.match(/"summary"\s*:\s*"((?:[^"\\]|\\.)*)/)
      if (summaryMatch) {
        let summaryContent = summaryMatch[1]

        // 이스케이프 문자 처리
        summaryContent = summaryContent
          .replace(/\\n/g, '\n')
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\')

        // keywords 추출 시도
        const keywordsMatch = jsonStr.match(/"keywords"\s*:\s*\[([\s\S]*?)\]/)
        let keywords: string[] = []
        if (keywordsMatch) {
          const keywordsStr = keywordsMatch[1]
          keywords = keywordsStr.match(/"([^"]+)"/g)?.map((k: string) => k.replace(/"/g, '')) || []
        }

        console.log('[Gemini] JSON repaired successfully')
        return { summary: summaryContent, keywords }
      }
      return null
    }

    let result: SummaryResult | null = null

    // 1. 직접 파싱 시도
    result = tryParseJson(textContent)

    // 2. 실패 시 - 개행 문자 이스케이프 후 파싱
    if (!result) {
      const cleanContent = textContent
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t')
      result = tryParseJson(cleanContent)
    }

    // 3. 실패 시 - 잘린 JSON 복구 시도
    if (!result) {
      console.log('[Gemini] Direct parse failed, trying repair...')
      result = tryRepairJson(textContent)
    }

    // 4. 여전히 실패 - 정규식으로 summary 추출
    if (!result) {
      console.log('[Gemini] Trying regex extraction...')

      const summaryRegex = /"summary"\s*:\s*"((?:[^"\\]|\\["\\nrt])*)"/
      const match = textContent.match(summaryRegex)

      if (match) {
        const extractedSummary = match[1]
          .replace(/\\n/g, '\n')
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\')

        const keywordsMatch = textContent.match(/"keywords"\s*:\s*\[([\s\S]*?)\]/)
        let keywords: string[] = []
        if (keywordsMatch) {
          const keywordsStr = keywordsMatch[1]
          keywords = keywordsStr.match(/"([^"]+)"/g)?.map((k: string) => k.replace(/"/g, '')) || []
        }

        result = { summary: extractedSummary, keywords }
        console.log('[Gemini] Extracted via regex, summary length:', extractedSummary.length)
      }
    }

    // 5. 최종 실패
    if (!result) {
      throw new Error(`JSON parse failed. Content preview: "${textContent.slice(0, 200)}..."`)
    }

    // 검증
    if (!result.summary || !Array.isArray(result.keywords)) {
      throw new Error('Invalid response format from Gemini API')
    }

    // 요약 정제
    result.summary = result.summary.trim()

    // 불릿 포인트가 없으면 추가 (AI가 형식을 안 지킨 경우)
    if (!result.summary.includes('•')) {
      result.summary = result.summary
        .split('\n')
        .filter((line) => line.trim())
        .map((line) => `• ${line.trim()}`)
        .join('\n')
    }

    // 불릿 포인트 개수 확인 (3-5개)
    const bulletPoints = result.summary.split('\n').filter((line) => line.includes('•'))
    if (bulletPoints.length < 3) {
      console.warn(`[Gemini] Warning: Too few bullet points (${bulletPoints.length})`)
    } else if (bulletPoints.length > 5) {
      result.summary = bulletPoints.slice(0, 5).join('\n')
    }

    // 키워드 개수 제한 (3-5개)
    result.keywords = result.keywords.slice(0, 5)

    return result
  }

  // 응답이 불완전한지 체크
  private isIncomplete(result: SummaryResult): boolean {
    // 요약이 너무 짧으면 불완전
    if (result.summary.length < 50) return true

    // 불릿 포인트가 2개 미만이면 불완전
    const bulletCount = (result.summary.match(/•/g) || []).length
    if (bulletCount < 2) return true

    // 마지막 불릿이 완전한 문장이 아니면 불완전 (마침표, 괄호, 따옴표로 끝나지 않으면)
    const lines = result.summary.split('\n').filter(line => line.trim())
    const lastLine = lines[lines.length - 1] || ''
    if (lastLine.length > 0 && !/[.。!?)"'」』]$/.test(lastLine.trim())) {
      return true
    }

    return false
  }

  async isAvailable(): Promise<boolean> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const response = await fetch(
        `${this.baseUrl}/models`,
        {
          method: 'GET',
          headers: {
            'x-goog-api-key': this.apiKey,
          },
          signal: controller.signal,
        }
      )

      clearTimeout(timeoutId)
      return response.ok
    } catch {
      return false
    }
  }
}
