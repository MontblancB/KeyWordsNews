import { AIProvider, AIProviderConfig, SummaryResult } from '../types'

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
    this.maxTokens = config.maxTokens ?? 1200  // 구체적 요약을 위해 증가 (200-250자 * 4-6개 불릿)
  }

  async summarize(title: string, content: string): Promise<SummaryResult> {
    const prompt = `다음 뉴스 기사를 읽고 핵심 내용을 **3-4개의 구체적인 불릿**으로 정리하고, 주요 키워드 3-5개를 추출해주세요.

**중요한 요약 규칙:**
1. **각 불릿은 20-35단어 내외** - 구체적이고 상세하게
2. **5W1H 중심 작성** - 누가, 언제, 어디서, 무엇을, 왜, 어떻게
3. **구체적 정보 필수 포함** - 숫자, 날짜, 금액, 비율, 인명, 기관명
4. **인과관계 명시** - 원인과 결과, 배경과 영향 포함
5. **객관적 사실 중심** - 주장이나 의견은 출처 명시
6. 제목 내용 반복 금지, 새로운 정보 위주
7. **3-4개로 간결하게** - 본문이 짧으면 3개, 길면 4개

제목: ${title}

본문:
${content}

**좋은 구체적 요약 예시:**
"• 고용노동부, 2026년 최저임금을 시간당 1만2천원으로 확정 (2025년 대비 7.3% 인상, 월 환산액 251만원)
• 노동계는 물가상승률(3.2%) 대비 실질임금 증가 미흡하다며 반발, 경영계는 중소기업 부담 가중 우려
• 적용 대상 약 300만명(전체 노동자의 13%), 2026년 1월 1일부터 시행
• 전문가들은 소득주도성장 정책 일환이나 고용시장 양극화 심화 가능성 지적"

반드시 JSON 형식으로만 응답해주세요:
{
  "summary": "• 구체적포인트1\\n• 구체적포인트2\\n• 구체적포인트3\\n• 구체적포인트4",
  "keywords": ["키워드1", "키워드2", "키워드3"]
}`

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
              content:
                '당신은 뉴스를 구체적이고 상세하게 요약하는 전문 AI입니다. 각 불릿은 20-35단어 내외로 작성하며, 5W1H(누가, 언제, 어디서, 무엇을, 왜, 어떻게)를 포함합니다. 숫자/날짜/금액/비율/인명/기관명 등 구체적 정보를 필수로 포함하고, 원인과 결과, 배경과 영향 등 인과관계를 명확히 합니다. 주장이나 의견은 출처를 명시하며, 객관적 사실 중심으로 작성합니다. JSON 형식으로 응답하며, summary는 3-4개의 불릿 포인트로 간결하게 구성합니다. 본문이 짧으면 3개, 길면 4개로 조절합니다.',
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
        throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      const content = data.choices[0]?.message?.content

      if (!content) {
        throw new Error('Empty response from OpenRouter API')
      }

      // JSON 파싱 (마크다운 코드 블록이 있을 수 있음)
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }

      const result = JSON.parse(jsonMatch[0]) as SummaryResult

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

      // 불릿 포인트 개수 확인 (3-4개)
      const bulletPoints = result.summary.split('\n').filter((line) => line.includes('•'))
      if (bulletPoints.length < 3) {
        console.warn(`[OpenRouter] Warning: Too few bullet points (${bulletPoints.length})`)
      } else if (bulletPoints.length > 4) {
        // 4개로 제한
        result.summary = bulletPoints.slice(0, 4).join('\n')
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
