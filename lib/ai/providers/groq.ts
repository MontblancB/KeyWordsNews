import Groq from 'groq-sdk'
import { AIProvider, AIProviderConfig, SummaryResult, StreamChunk, SummarizeOptions } from '../types'
import { buildSummarizeSystemPrompt, buildSummarizePrompt, buildStreamSystemPrompt, buildStreamPrompt } from '../prompts/summarize'

/**
 * Groq AI Provider
 * Llama 3.3 70B를 사용한 초고속 뉴스 요약
 */
export class GroqProvider implements AIProvider {
  name = 'groq'
  private client: Groq
  private model: string
  private temperature: number
  private maxTokens: number

  constructor(config: AIProviderConfig) {
    this.client = new Groq({
      apiKey: config.apiKey,
    })
    this.model = config.model || 'llama-3.3-70b-versatile'  // 280 tokens/sec, 128K context
    this.temperature = config.temperature ?? 0.3
    this.maxTokens = config.maxTokens ?? 2400  // 응답 잘림 방지를 위해 2배 증가 (1200 → 2400)
  }

  async summarize(title: string, content: string, options?: SummarizeOptions): Promise<SummaryResult> {
    const prompt = buildSummarizePrompt(title, content, options?.category)

    try {
      const response = await this.client.chat.completions.create({
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
        response_format: { type: 'json_object' },
      })

      const content = response.choices[0]?.message?.content
      const finishReason = response.choices[0]?.finish_reason

      // 디버깅
      console.log('[Groq] finishReason:', finishReason)
      console.log('[Groq] Content length:', content?.length || 0)

      if (!content) {
        throw new Error('Empty response from Groq API')
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
            console.log('[Groq] JSON repaired successfully')
            return parsed
          }
        }
        return null
      }

      let result: SummaryResult | null = null

      // 1. 직접 파싱 시도
      result = tryParseJson(content)

      // 2. 실패 시 - 잘린 JSON 복구 시도
      if (!result && isTruncated) {
        console.log('[Groq] Response truncated, attempting repair...')
        result = tryRepairJson(content)
      }

      // 3. 여전히 실패 - 정규식으로 summary 추출
      if (!result) {
        console.log('[Groq] Direct parse failed, trying regex extraction...')

        const summaryRegex = /"summary"\s*:\s*"((?:[^"\\]|\\["\\nrt])*)"/
        const match = content.match(summaryRegex)

        if (match) {
          const extractedSummary = match[1]
            .replace(/\\n/g, '\n')
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, '\\')

          const keywordsMatch = content.match(/"keywords"\s*:\s*\[([\s\S]*?)\]/)
          let keywords: string[] = []
          if (keywordsMatch) {
            const keywordsStr = keywordsMatch[1]
            keywords = keywordsStr.match(/"([^"]+)"/g)?.map((k: string) => k.replace(/"/g, '')) || []
          }

          result = { summary: extractedSummary, keywords }
          console.log('[Groq] Extracted via regex, summary length:', extractedSummary.length)
        }
      }

      // 4. 최종 실패
      if (!result) {
        throw new Error(`JSON parse failed. finishReason: ${finishReason}, Content preview: "${content.slice(0, 200)}..."`)
      }

      // 검증
      if (!result.summary || !Array.isArray(result.keywords)) {
        throw new Error('Invalid response format from Groq API')
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
        console.warn(`[Groq] Warning: Too few bullet points (${bulletPoints.length})`)
      } else if (bulletPoints.length > 5) {
        result.summary = bulletPoints.slice(0, 5).join('\n')
      }

      // 키워드 개수 제한 (3-5개)
      result.keywords = result.keywords.slice(0, 5)

      return result
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Groq API error: ${error.message}`)
      }
      throw error
    }
  }

  /**
   * 스트리밍 요약 생성
   * 실시간으로 토큰을 반환하는 AsyncGenerator
   */
  async *summarizeStream(
    title: string,
    content: string,
    options?: SummarizeOptions
  ): AsyncGenerator<StreamChunk> {
    const prompt = buildStreamPrompt(title, content, options?.category)

    try {
      const stream = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: buildStreamSystemPrompt(),
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: this.temperature,
        max_tokens: this.maxTokens,
        response_format: { type: 'json_object' },
        stream: true, // 스트리밍 활성화
      })

      let fullContent = ''

      // 스트림에서 토큰을 실시간으로 yield
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content

        if (delta) {
          fullContent += delta

          // 각 토큰을 클라이언트로 전송
          yield {
            type: 'token',
            content: delta,
          }
        }
      }

      // 최종 결과 파싱
      const result = JSON.parse(fullContent) as SummaryResult

      // 검증
      if (!result.summary || !Array.isArray(result.keywords)) {
        throw new Error('Invalid response format from Groq API')
      }

      // 요약 정제
      result.summary = result.summary.trim()

      // 불릿 포인트가 없으면 추가
      if (!result.summary.includes('•')) {
        result.summary = result.summary
          .split('\n')
          .filter((line) => line.trim())
          .map((line) => `• ${line.trim()}`)
          .join('\n')
      }

      // 불릿 포인트 개수 확인 (3-5개)
      const bulletPoints = result.summary
        .split('\n')
        .filter((line) => line.includes('•'))
      if (bulletPoints.length > 5) {
        result.summary = bulletPoints.slice(0, 5).join('\n')
      }

      // 키워드 개수 제한 (3-5개)
      result.keywords = result.keywords.slice(0, 5)

      // 완료 신호
      yield {
        type: 'done',
        result,
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'

      yield {
        type: 'error',
        error: `Groq streaming error: ${errorMessage}`,
      }

      throw new Error(`Groq streaming error: ${errorMessage}`)
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      // API 키가 설정되어 있는지 확인
      await this.client.models.list()
      return true
    } catch (error) {
      return false
    }
  }
}
