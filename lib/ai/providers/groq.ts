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
    const prompt = `다음 뉴스 기사를 읽고 핵심 내용을 **3-5개의 초압축 불릿**으로 정리하고, **한 줄 정리**와 주요 키워드 3-5개를 추출해주세요.

**중요한 요약 규칙:**
1. **각 불릿은 15-20단어 이내** - 극도로 압축된 형태
2. 핵심 키워드 중심 작성 (불필요한 조사, 연결어 제거)
3. 구체적 정보 우선 (숫자, 날짜, 금액, 비율)
4. 제목 내용 반복 금지, 새로운 정보만
5. 명사형/체언 중심 서술
6. **한 줄 정리는 50-80자 이내** - 전체 내용의 핵심을 한 문장으로 정리

제목: ${title}

본문:
${content}

**좋은 압축 예시:**
불릿: "• 2026년 최저임금 시간당 1만2천원 확정 (7.3%↑)
• 노동계 '물가 대비 불충분' 반발, 경영계 '중소기업 부담' 우려
• 적용 대상 약 300만명, 2026.1.1 시행"

한 줄 정리: "2026년 최저임금이 시간당 1만2천원으로 7.3% 인상 확정되었으나 노동계와 경영계 모두 불만을 표시했다"

반드시 JSON 형식으로만 응답해주세요:
{
  "summary": "• 압축포인트1\\n• 압축포인트2\\n• 압축포인트3",
  "keywords": ["키워드1", "키워드2", "키워드3"],
  "oneLiner": "50-80자 이내로 기사의 핵심 내용을 한 문장으로 정리"
}`

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content:
              '당신은 뉴스 핵심만 초압축하는 전문 AI입니다. 각 불릿은 15-20단어 이내로 극도로 압축하며, 핵심 키워드 중심으로 작성합니다. 숫자/날짜/금액 등 구체적 정보를 우선하고, 불필요한 조사/연결어/감정 표현은 제거합니다. 명사형/체언 중심 서술로 간결하게 작성합니다. 마지막에 전체 내용의 핵심을 50-80자 이내로 한 문장으로 정리합니다. JSON 형식으로 응답하며, summary는 "• 압축포인트1\\n• 압축포인트2" 형식, oneLiner는 기사의 핵심을 담은 완전한 한 문장입니다.',
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

      // 한 줄 정리 정제
      if (result.oneLiner) {
        result.oneLiner = result.oneLiner.trim()
        if (result.oneLiner.length > 100) {
          console.warn(`[Groq] Warning: One-liner too long (${result.oneLiner.length} chars)`)
        }
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
