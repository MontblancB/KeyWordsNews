import Groq from 'groq-sdk'
import { AIProvider, AIProviderConfig, SummaryResult } from '../types'

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
    this.model = config.model || 'llama-3.3-70b-versatile'
    this.temperature = config.temperature ?? 0.3
    this.maxTokens = config.maxTokens ?? 800  // 한글 150자 = 약 450-600 토큰, 여유있게 800
  }

  async summarize(title: string, content: string): Promise<SummaryResult> {
    const prompt = `다음 뉴스 기사를 읽고 핵심 내용을 **최대 3문장**으로 간결하게 요약하고, 주요 키워드 3-5개를 추출해주세요.

**중요한 요약 규칙:**
1. **최대 3문장** - 짧고 간결하게 작성 (1-2문장도 가능)
2. 본문의 가장 중요한 핵심만 추출 (제목 반복 금지)
3. 핵심 사실만 간단명료하게 (누가, 무엇을, 왜)
4. 불필요한 배경 설명, 반응, 의견은 생략
5. **절대 "..."로 끝내지 말 것** - 반드시 완전한 문장으로 마무리

제목: ${title}

본문:
${content}

**좋은 요약 예시:**
"정부가 2026년 최저임금을 시간당 1만 2천원(전년 대비 7.3% 인상)으로 확정했다. 노동계는 불충분하다며 반발했고, 경영계는 중소기업 부담을 우려했다."

반드시 JSON 형식으로만 응답해주세요:
{
  "summary": "완결된 1-3문장 요약 (절대 ...로 끝내지 마세요)",
  "keywords": ["키워드1", "키워드2", "키워드3", "키워드4"]
}`

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content:
              '당신은 한국어 뉴스 기사를 분석하고 요약하는 전문 AI입니다. 본문의 가장 중요한 핵심만 파악하여 **최대 3문장**으로 간결하게 요약합니다. 불필요한 배경 설명이나 부가 정보는 생략하고, 핵심 사실만 간단명료하게 전달합니다. 절대 "..."로 끝내지 말고 반드시 완전한 문장으로 마무리하세요. 항상 JSON 형식으로 응답합니다.',
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
      if (!content) {
        throw new Error('Empty response from Groq API')
      }

      const result = JSON.parse(content) as SummaryResult

      // 검증
      if (!result.summary || !Array.isArray(result.keywords)) {
        throw new Error('Invalid response format from Groq API')
      }

      // '...'로 끝나는 경우 제거 (AI가 실수로 붙였을 수 있음)
      result.summary = result.summary.trim()
      if (result.summary.endsWith('...')) {
        result.summary = result.summary.slice(0, -3).trim()
        // 마지막 문장이 완결되지 않았으면 문장 단위로 자르기
        const lastPeriod = Math.max(
          result.summary.lastIndexOf('.'),
          result.summary.lastIndexOf('다'),
          result.summary.lastIndexOf('요')
        )
        if (lastPeriod > 0) {
          result.summary = result.summary.slice(0, lastPeriod + 1)
        }
      }

      // 너무 긴 경우만 경고 (250자 이상)
      if (result.summary.length > 250) {
        console.warn(`[Groq] Warning: Summary is too long (${result.summary.length} chars)`)
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
