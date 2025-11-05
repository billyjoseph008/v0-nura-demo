export type Locale = "es" | "en" | "es-419" | "auto"

export type FuzzyStrategy = "damerau" | "soundex" | "double-metaphone" | "hybrid"

export type WakeMatchType = "none" | "exact" | "phonetic" | "global"

export type MatchedBy = "plugin" | "fallback" | "none"

export interface NuraResult {
  intent: string
  confidence: number
  via: WakeMatchType
  matchedBy: MatchedBy
  locale: Locale
  payload?: Record<string, unknown>
  utterance: string
  timestamp: number
}

export interface TelemetryEvent {
  type: string
  data: unknown
  timestamp: number
}

export interface McpResource {
  uri: string
  name: string
  description?: string
  mimeType?: string
}

export interface McpTool {
  name: string
  description?: string
  inputSchema: Record<string, unknown>
}

export interface RankingEntry {
  intent: string
  score: number
  reason: string
}
