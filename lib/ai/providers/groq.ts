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
    const prompt = `다음 뉴스 기사를 읽고 핵심 내용을 **3-5개의 압축된 불릿 포인트**로 정리하고, 주요 키워드 3-5개를 추출해주세요.

**중요한 요약 규칙:**
1. **3-5개의 불릿 포인트** - 각 포인트는 한 문장으로 간결하게
2. 가장 중요한 핵심만 추출 (제목 반복 금지, 배경 설명 생략)
3. 각 포인트는 구체적 사실 위주 (누가, 무엇을, 어떻게, 결과)
4. 숫자, 날짜, 금액 등 구체적 정보 포함
5. 불필요한 수식어, 감정 표현 제거

제목: ${title}

본문:
${content}

**좋은 요약 예시:**
"• 정부가 2026년 최저임금을 시간당 1만 2천원으로 확정 (전년 대비 7.3% 인상)
• 노동계는 물가 상승률을 고려하면 불충분하다며 반발
• 경영계는 중소기업의 인건비 부담 증가를 우려
• 최저임금 적용 대상 근로자는 약 300만명으로 추산"

반드시 JSON 형식으로만 응답해주세요:
{
  "summary": "• 포인트1\\n• 포인트2\\n• 포인트3\\n• 포인트4",
  "keywords": ["키워드1", "키워드2", "키워드3", "키워드4"]
}`

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content:
              '당신은 한국어 뉴스 기사를 분석하고 핵심만 추출하는 전문 AI입니다. 기사를 읽고 가장 중요한 정보만 **3-5개의 압축된 불릿 포인트**로 정리합니다. 각 포인트는 구체적 사실(숫자, 날짜, 금액 등) 중심으로 한 문장으로 작성하며, 불필요한 배경 설명이나 감정 표현은 제거합니다. 항상 JSON 형식으로 응답하며, summary는 "• 포인트1\\n• 포인트2" 형식입니다.',
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
        // 5개로 제한
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
