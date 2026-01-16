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
    this.maxTokens = config.maxTokens ?? 800  // 한글 150자 = 약 450-600 토큰, 여유있게 800
  }

  async summarize(title: string, content: string): Promise<SummaryResult> {
    const prompt = `다음 뉴스 기사를 읽고 핵심 내용을 **2-3문장으로 요약**하고, 주요 키워드 3-5개를 추출해주세요.

**중요한 요약 규칙:**
1. **2-3문장으로 작성** (내용이 복잡하면 최대 5문장까지 허용)
2. 본문의 핵심 내용만 추출 (제목 반복 금지)
3. 육하원칙(누가, 언제, 어디서, 무엇을, 왜, 어떻게) 포함
4. 구체적인 수치, 날짜, 장소 등 사실 포함
5. **절대 "..."로 끝내지 말 것** - 반드시 완전한 문장으로 마무리
6. 문장이 잘리거나 중간에 끊기지 않도록 주의

제목: ${title}

본문:
${content}

**좋은 요약 예시:**
"정부가 2026년 최저임금을 시간당 1만 2천원으로 확정했다. 이는 전년 대비 7.3% 인상된 금액으로, 월 환산액은 약 250만원이다. 노동계는 불충분하다며 반발했지만, 경영계는 중소기업 부담이 크다고 우려했다."

반드시 JSON 형식으로만 응답해주세요:
{
  "summary": "완결된 2-3문장 요약 (절대 ...로 끝내지 마세요)",
  "keywords": ["키워드1", "키워드2", "키워드3", "키워드4"]
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
                '당신은 한국어 뉴스 기사를 분석하고 요약하는 전문 AI입니다. 본문의 핵심 내용(누가, 언제, 어디서, 무엇을, 왜, 어떻게)을 파악하여 **2-3문장으로 완결된 요약**을 작성합니다. 절대 "..."로 끝내지 말고 반드시 완전한 문장으로 마무리하세요. 수치, 날짜, 장소 등 구체적인 정보를 포함하세요. 항상 JSON 형식으로 응답합니다.',
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
        console.warn(`[OpenRouter] Warning: Summary is too long (${result.summary.length} chars)`)
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
