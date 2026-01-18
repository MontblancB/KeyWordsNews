import { AIProvider, AIProviderConfig, SummaryResult } from '../types'

/**
 * Google Gemini AI Provider
 * Gemini 2.5 Flash를 사용한 고속 뉴스 요약
 */
export class GeminiProvider implements AIProvider {
  name = 'gemini'
  private apiKey: string
  private model: string
  private temperature: number
  private maxTokens: number
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta'

  constructor(config: AIProviderConfig) {
    this.apiKey = config.apiKey
    this.model = config.model || 'gemini-2.5-flash'
    this.temperature = config.temperature ?? 0.3
    this.maxTokens = config.maxTokens ?? 1200
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
8. **쉬운 한글 사용** - 한자어 대신 쉬운 순우리말이나 일상 표현 사용

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
                    text: `당신은 뉴스를 간결하고 명확하게 요약하는 전문 AI입니다. 각 불릿은 15-25단어 내외로 핵심만 작성하며, 5W1H(누가, 언제, 어디서, 무엇을, 왜, 어떻게)를 포함합니다. JSON 형식으로 응답합니다.\n\n${prompt}`,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: this.temperature,
              maxOutputTokens: this.maxTokens,
              responseMimeType: 'application/json',
              responseJsonSchema: {
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

      if (!textContent) {
        throw new Error('Empty response from Gemini API')
      }

      // JSON 파싱
      const jsonMatch = textContent.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }

      const result = JSON.parse(jsonMatch[0]) as SummaryResult

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

      // 불릿 포인트 개수 확인 (3-4개)
      const bulletPoints = result.summary.split('\n').filter((line) => line.includes('•'))
      if (bulletPoints.length < 3) {
        console.warn(`[Gemini] Warning: Too few bullet points (${bulletPoints.length})`)
      } else if (bulletPoints.length > 4) {
        // 4개로 제한
        result.summary = bulletPoints.slice(0, 4).join('\n')
      }

      // 키워드 개수 제한 (3-5개)
      result.keywords = result.keywords.slice(0, 5)

      return result
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Gemini API error: ${error.message}`)
      }
      throw error
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/models`,
        {
          method: 'GET',
          headers: {
            'x-goog-api-key': this.apiKey,
          },
        }
      )
      return response.ok
    } catch {
      return false
    }
  }
}
