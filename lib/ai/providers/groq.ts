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
    const prompt = `다음 뉴스 기사를 읽고 핵심 내용을 **100-150자 분량**으로 요약하고, 주요 키워드 3-5개를 추출해주세요.

**요약 작성 가이드:**
1. 본문 내용을 중심으로 작성 (제목만 반복하지 마세요)
2. 육하원칙(누가, 언제, 어디서, 무엇을, 왜, 어떻게)을 포함
3. 구체적인 수치나 사실을 포함하여 상세하게 작성
4. **반드시 100자 이상 작성** (너무 짧게 요약하지 마세요)
5. 문장을 완결하고 자연스럽게 연결

제목: ${title}

본문:
${content}

**좋은 요약 예시:**
"정부가 2026년 최저임금을 시간당 1만 2천원으로 확정했다. 이는 전년 대비 7.3% 인상된 금액으로, 월 환산액은 약 250만원이다. 노동계는 불충분하다며 반발했지만, 경영계는 중소기업 부담이 크다고 우려했다."

반드시 JSON 형식으로만 응답해주세요:
{
  "summary": "본문의 핵심 내용을 100-150자로 상세히 요약",
  "keywords": ["키워드1", "키워드2", "키워드3", "키워드4"]
}`

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content:
              '당신은 한국어 뉴스 기사를 분석하고 요약하는 전문 AI입니다. 본문의 핵심 내용(누가, 언제, 어디서, 무엇을, 왜, 어떻게)을 파악하여 **100-150자 분량으로 상세하고 구체적으로** 요약합니다. 수치, 날짜, 장소 등 구체적인 정보를 반드시 포함하세요. 너무 짧게 요약하지 마세요. 항상 JSON 형식으로 응답합니다.',
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
