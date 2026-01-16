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
    this.maxTokens = config.maxTokens ?? 300
  }

  async summarize(title: string, content: string): Promise<SummaryResult> {
    const prompt = `다음 뉴스 기사를 읽고 핵심 내용을 150자 이내로 요약하고, 주요 키워드 3-5개를 추출해주세요.

**중요: 제목이 아닌 본문 내용을 중심으로 요약해주세요.**

제목: ${title}

본문:
${content}

반드시 JSON 형식으로만 응답해주세요:
{
  "summary": "본문의 핵심 내용을 150자 이내로 요약 (육하원칙 중심)",
  "keywords": ["키워드1", "키워드2", "키워드3"]
}`

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content:
              '당신은 한국어 뉴스 기사를 분석하고 요약하는 전문 AI입니다. 제목만 보지 말고 본문의 핵심 내용(누가, 언제, 어디서, 무엇을, 왜, 어떻게)을 파악하여 객관적으로 요약합니다. 항상 JSON 형식으로 응답합니다.',
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

      // 요약 길이 제한 (150자)
      if (result.summary.length > 150) {
        result.summary = result.summary.slice(0, 147) + '...'
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
