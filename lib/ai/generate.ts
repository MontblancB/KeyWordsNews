/**
 * 공통 AI Provider 호출 유틸리티
 * Groq, Gemini, OpenRouter API 호출 및 JSON 파싱/복구 로직 통합
 */
import Groq from 'groq-sdk'

// ── 타입 정의 ──

export interface AICallOptions {
  systemPrompt: string
  userPrompt: string
  temperature?: number   // default 0.4
  maxTokens?: number     // default 4000
  primaryField?: string  // JSON 복구 시 주 텍스트 필드명 (e.g., 'insight', 'insights', 'summary')
  logPrefix?: string     // 로그 접두사 (e.g., '[NewsInsight]')
}

export interface GeminiCallOptions extends AICallOptions {
  geminiSchema?: Record<string, unknown>  // Gemini responseSchema
}

export interface FallbackAttempt<T> {
  provider: string
  fn: () => Promise<T>
}

export class AllProvidersFailedError extends Error {
  constructor(
    public details: string,
    public attempts: { provider: string; error: string }[]
  ) {
    super(`모든 AI 프로바이더 실패: ${details}`)
    this.name = 'AllProvidersFailedError'
  }
}

// ── JSON 파싱/복구 유틸리티 ──

function tryParseJson<T>(jsonStr: string): T | null {
  try {
    return JSON.parse(jsonStr) as T
  } catch {
    return null
  }
}

/**
 * 잘린 JSON에서 주요 텍스트 필드를 추출하여 최소한의 유효 JSON으로 복구
 */
function tryRepairJson<T>(jsonStr: string, primaryField: string): T | null {
  const regex = new RegExp(`"${primaryField}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"?`)
  const match = jsonStr.match(regex)
  if (match) {
    const fieldContent = match[1]
    const repairedJson = `{"${primaryField}": "${fieldContent}", "keywords": []}`
    const parsed = tryParseJson<T>(repairedJson)
    if (parsed) return parsed
  }
  return null
}

/**
 * 정규식으로 주요 필드 + keywords 추출
 */
function tryRegexExtract<T>(content: string, primaryField: string): T | null {
  const fieldRegex = new RegExp(`"${primaryField}"\\s*:\\s*"((?:[^"\\\\]|\\\\["\\\\nrt])*)"`)
  const match = content.match(fieldRegex)

  if (match) {
    const extracted = match[1]
      .replace(/\\n/g, '\n')
      .replace(/\\"/g, '"')
      .replace(/\\t/g, '\t')
      .replace(/\\r/g, '\r')
      .replace(/\\\\/g, '\\')

    const keywordsMatch = content.match(/"keywords"\s*:\s*\[([\s\S]*?)\]/)
    let keywords: string[] = []
    if (keywordsMatch) {
      const matches = keywordsMatch[1].match(/"([^"]+)"/g)
      if (matches) {
        keywords = matches.map((k: string) => k.replace(/"/g, ''))
      }
    }

    return { [primaryField]: extracted, keywords } as T
  }
  return null
}

/**
 * 공격적 JSON 추출 (마크다운 코드 블록 등 처리)
 */
function tryAggressiveExtract<T>(content: string): T | null {
  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    // 중첩된 이스케이프 제거 시도
    let jsonStr = jsonMatch[0]
      .replace(/\\\\n/g, '\\n')
      .replace(/\\\\"/g, '\\"')
    return tryParseJson<T>(jsonStr)
  }
  return null
}

/**
 * 다단계 JSON 파싱/복구 (가장 강력한 버전)
 */
function parseAIResponse<T>(
  content: string,
  primaryField: string,
  isTruncated: boolean,
  logPrefix: string
): T {
  // 1. 직접 파싱 시도
  let result = tryParseJson<T>(content)
  if (result) return result

  // 2. 개행 문자 이스케이프 후 파싱
  const cleanContent = content
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
  result = tryParseJson<T>(cleanContent)
  if (result) return result

  // 3. 잘린 JSON 복구 시도
  if (isTruncated) {
    console.log(`${logPrefix} Response truncated, attempting repair...`)
    result = tryRepairJson<T>(content, primaryField)
    if (result) {
      console.log(`${logPrefix} JSON repaired successfully`)
      return result
    }
  }

  // 4. 정규식으로 주요 필드 추출
  console.log(`${logPrefix} Direct parse failed, trying regex extraction...`)
  result = tryRegexExtract<T>(content, primaryField)
  if (result) {
    console.log(`${logPrefix} Extracted via regex`)
    return result
  }

  // 5. 공격적 추출 시도 (JSON 블록 추출)
  console.log(`${logPrefix} Trying aggressive extraction...`)
  result = tryAggressiveExtract<T>(content)
  if (result) {
    console.log(`${logPrefix} Extracted via aggressive method`)
    return result
  }

  // 6. 최종 실패
  throw new Error(
    `JSON parse failed. Content preview: "${content.slice(0, 200)}..."`
  )
}

// ── Provider 호출 함수 ──

/**
 * Groq API 호출 (JSON 모드)
 */
export async function callGroqJSON<T>(options: AICallOptions): Promise<T> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error('GROQ_API_KEY not set')

  const {
    systemPrompt,
    userPrompt,
    temperature = 0.4,
    maxTokens = 4000,
    primaryField = 'insight',
    logPrefix = '[Groq]',
  } = options

  const groq = new Groq({ apiKey })

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature,
    max_tokens: maxTokens,
    response_format: { type: 'json_object' },
  })

  const content = response.choices[0]?.message?.content || ''
  const finishReason = response.choices[0]?.finish_reason
  const isTruncated = finishReason === 'length'

  console.log(`${logPrefix} [Groq] finishReason: ${finishReason}, length: ${content.length}`)

  if (!content) throw new Error('Empty response from Groq API')

  const result = parseAIResponse<T>(content, primaryField, isTruncated, `${logPrefix} [Groq]`)

  // keywords가 있으면 5개로 제한
  const anyResult = result as Record<string, unknown>
  if (Array.isArray(anyResult.keywords)) {
    anyResult.keywords = (anyResult.keywords as string[]).slice(0, 5)
  }

  return result
}

/**
 * Gemini API 호출 (Structured Output)
 */
export async function callGeminiJSON<T>(options: GeminiCallOptions): Promise<T> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not set')

  const {
    systemPrompt,
    userPrompt,
    temperature = 0.4,
    maxTokens = 4000,
    primaryField = 'insight',
    logPrefix = '[Gemini]',
    geminiSchema,
  } = options

  const baseUrl = 'https://generativelanguage.googleapis.com/v1beta'
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash'

  const generationConfig: Record<string, unknown> = {
    temperature,
    maxOutputTokens: maxTokens,
    responseMimeType: 'application/json',
  }

  if (geminiSchema) {
    generationConfig.responseSchema = geminiSchema
  }

  const response = await fetch(
    `${baseUrl}/models/${model}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
          },
        ],
        generationConfig,
      }),
    }
  )

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`)
  }

  const data = await response.json()
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
  const finishReason = data.candidates?.[0]?.finishReason
  const blockReason = data.promptFeedback?.blockReason

  console.log(`${logPrefix} [Gemini] finishReason: ${finishReason}, length: ${content.length}`)

  if (!content) {
    let errorDetail = 'Empty response from Gemini'
    if (blockReason) errorDetail += ` (blockReason: ${blockReason})`
    if (finishReason) errorDetail += ` (finishReason: ${finishReason})`
    throw new Error(errorDetail)
  }

  const isTruncated = finishReason === 'MAX_TOKENS' || finishReason === 'LENGTH'
  if (isTruncated) {
    console.warn(`${logPrefix} [Gemini] Response was truncated`)
  }

  const result = parseAIResponse<T>(content, primaryField, isTruncated, `${logPrefix} [Gemini]`)

  const anyResult = result as Record<string, unknown>
  if (Array.isArray(anyResult.keywords)) {
    anyResult.keywords = (anyResult.keywords as string[]).slice(0, 5)
  }

  return result
}

/**
 * OpenRouter API 호출
 */
export async function callOpenRouterJSON<T>(options: AICallOptions): Promise<T> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not set')

  const {
    systemPrompt,
    userPrompt,
    temperature = 0.4,
    maxTokens = 4000,
    primaryField = 'insight',
    logPrefix = '[OpenRouter]',
  } = options

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.VERCEL_APP_URL || 'http://localhost:3000',
      'X-Title': 'KeyWordsNews',
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.1-70b-instruct:free',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature,
      max_tokens: maxTokens,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(`OpenRouter API error: ${response.status} - ${JSON.stringify(errorData)}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content || ''
  const finishReason = data.choices?.[0]?.finish_reason
  const isTruncated = finishReason === 'length'

  console.log(`${logPrefix} [OpenRouter] finishReason: ${finishReason}, length: ${content.length}`)

  if (!content) throw new Error('Empty response from OpenRouter API')

  const result = parseAIResponse<T>(content, primaryField, isTruncated, `${logPrefix} [OpenRouter]`)

  const anyResult = result as Record<string, unknown>
  if (Array.isArray(anyResult.keywords)) {
    anyResult.keywords = (anyResult.keywords as string[]).slice(0, 5)
  }

  return result
}

// ── 폴백 실행 ──

/**
 * 여러 Provider를 순서대로 시도하는 폴백 체인
 */
export async function runWithFallback<T>(
  attempts: FallbackAttempt<T>[],
  logPrefix: string
): Promise<{ result: T; provider: string }> {
  const errors: { provider: string; error: string }[] = []

  for (const attempt of attempts) {
    try {
      console.log(`${logPrefix} Trying ${attempt.provider}...`)
      const result = await attempt.fn()
      return { result, provider: attempt.provider }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error'
      console.error(`${logPrefix} ${attempt.provider} failed:`, msg)
      errors.push({ provider: attempt.provider, error: msg })
    }
  }

  const details = errors.map((e) => `[${e.provider}] ${e.error}`).join(' → ')
  console.error(`${logPrefix} All providers failed:`, details)
  throw new AllProvidersFailedError(details, errors)
}
