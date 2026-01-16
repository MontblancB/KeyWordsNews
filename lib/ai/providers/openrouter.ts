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
    const prompt = `다음 뉴스 기사를 읽고 핵심 내용을 **3-5개의 초압축 불릿**으로 정리하고, **한 줄 정리**와 주요 키워드 3-5개를 추출해주세요.

**중요한 요약 규칙:**
1. **각 불릿은 15-20단어 이내** - 극도로 압축된 형태
2. 핵심 키워드 중심 작성 (불필요한 조사, 연결어 제거)
3. 구체적 정보 우선 (숫자, 날짜, 금액, 비율)
4. 제목 내용 반복 금지, 새로운 정보만
5. 명사형/체언 중심 서술
6. **한 줄 정리는 20-30자 이내** - 전체 내용을 한 문장으로 압축

제목: ${title}

본문:
${content}

**좋은 압축 예시:**
불릿: "• 2026년 최저임금 시간당 1만2천원 확정 (7.3%↑)
• 노동계 '물가 대비 불충분' 반발, 경영계 '중소기업 부담' 우려
• 적용 대상 약 300만명, 2026.1.1 시행"

한 줄 정리: "최저임금 1만2천원 확정, 노사 반응 엇갈려"

반드시 JSON 형식으로만 응답해주세요:
{
  "summary": "• 압축포인트1\\n• 압축포인트2\\n• 압축포인트3",
  "keywords": ["키워드1", "키워드2", "키워드3"],
  "oneLiner": "20-30자 이내 한 줄 정리"
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
                '당신은 뉴스 핵심만 초압축하는 전문 AI입니다. 각 불릿은 15-20단어 이내로 극도로 압축하며, 핵심 키워드 중심으로 작성합니다. 숫자/날짜/금액 등 구체적 정보를 우선하고, 불필요한 조사/연결어/감정 표현은 제거합니다. 명사형/체언 중심 서술로 간결하게 작성합니다. 마지막에 전체 내용을 20-30자 이내로 한 줄 정리합니다. JSON 형식으로 응답하며, summary는 "• 압축포인트1\\n• 압축포인트2" 형식, oneLiner는 짧은 한 문장입니다.',
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

      // 불릿 포인트 개수 확인 (3-5개)
      const bulletPoints = result.summary.split('\n').filter((line) => line.includes('•'))
      if (bulletPoints.length < 3) {
        console.warn(`[OpenRouter] Warning: Too few bullet points (${bulletPoints.length})`)
      } else if (bulletPoints.length > 5) {
        // 5개로 제한
        result.summary = bulletPoints.slice(0, 5).join('\n')
      }

      // 한 줄 정리 정제
      if (result.oneLiner) {
        result.oneLiner = result.oneLiner.trim()
        if (result.oneLiner.length > 50) {
          console.warn(`[OpenRouter] Warning: One-liner too long (${result.oneLiner.length} chars)`)
        }
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
