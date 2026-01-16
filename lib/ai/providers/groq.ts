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
    this.model = config.model || 'llama-3.3-70b-specdec'  // Speculative Decoding: 6배 빠름 (276 → 1,660 tokens/sec)
    this.temperature = config.temperature ?? 0.3
    this.maxTokens = config.maxTokens ?? 1200  // 구체적 요약을 위해 증가 (200-250자 * 4-6개 불릿)
  }

  async summarize(title: string, content: string): Promise<SummaryResult> {
    const prompt = `다음 뉴스 기사를 읽고 핵심 내용을 **3-4개의 간결한 불릿**으로 정리하고, 주요 키워드 3-5개를 추출해주세요.

**중요한 요약 규칙:**
1. **각 불릿은 15-25단어 내외** - 핵심만 간결하게
2. **5W1H 중심 작성** - 누가, 언제, 어디서, 무엇을, 왜, 어떻게
3. **구체적 정보 필수 포함** - 숫자, 날짜, 금액, 비율, 인명, 기관명
4. **인과관계 명시** - 원인과 결과를 간략히
5. **객관적 사실 중심** - 주장이나 의견은 출처 명시
6. 제목 내용 반복 금지, 새로운 정보 위주
7. **3-4개로 간결하게** - 본문이 짧으면 3개, 길면 4개

제목: ${title}

본문:
${content}

**좋은 간결한 요약 예시:**
"• 고용부, 2026년 최저임금 시간당 1만2천원 확정 (7.3%↑)
• 노동계 '물가 대비 부족' 반발, 경영계 '중소기업 부담' 우려
• 적용 대상 300만명, 2026.1.1 시행
• 전문가 '소득주도성장 정책, 고용 양극화 가능성' 지적"

반드시 JSON 형식으로만 응답해주세요:
{
  "summary": "• 간결한포인트1\\n• 간결한포인트2\\n• 간결한포인트3\\n• 간결한포인트4",
  "keywords": ["키워드1", "키워드2", "키워드3"]
}`

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content:
              '당신은 뉴스를 간결하고 명확하게 요약하는 전문 AI입니다. 각 불릿은 15-25단어 내외로 핵심만 작성하며, 5W1H(누가, 언제, 어디서, 무엇을, 왜, 어떻게)를 포함합니다. 숫자/날짜/금액/비율/인명/기관명 등 구체적 정보를 필수로 포함하고, 원인과 결과를 간략히 명시합니다. 주장이나 의견은 출처를 명시하며, 객관적 사실 중심으로 작성합니다. JSON 형식으로 응답하며, summary는 3-4개의 불릿 포인트로 간결하게 구성합니다. 본문이 짧으면 3개, 길면 4개로 조절합니다.',
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

      // 불릿 포인트 개수 확인 (3-4개)
      const bulletPoints = result.summary.split('\n').filter((line) => line.includes('•'))
      if (bulletPoints.length < 3) {
        console.warn(`[Groq] Warning: Too few bullet points (${bulletPoints.length})`)
      } else if (bulletPoints.length > 4) {
        // 4개로 제한
        result.summary = bulletPoints.slice(0, 4).join('\n')
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
