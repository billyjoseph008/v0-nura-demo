export interface StripWakeOptions {
  wakeWords?: string[]
  aliases?: Record<string, string[]>
  minConfidence?: number
}

export interface StripWakeResult {
  matched: boolean
  confidence: number
  wakeWord?: string
  alias?: string
  command: string
}

export declare function stripWake(utterance: string, options?: StripWakeOptions): StripWakeResult

export declare function parseNumeral(input: string | number, locale?: string): number | null

export interface SynonymResult {
  input: string | undefined
  normalized: string
  matched: boolean
  variants: string[]
}

export declare function normalizeSynonyms(term: string, locale?: string): SynonymResult

export interface ContextAction<T = unknown> {
  intent: string
  payload?: T
  description?: string
  savedAt?: number
}

export interface ConfirmationResult<T = unknown> {
  confirmed: boolean
  action?: ContextAction<T>
  reason?: string
}

export declare class ContextManager<T = unknown> {
  saveAction(key: string, action: ContextAction<T>): ContextAction<T>
  getAction(key: string): ContextAction<T> | null
  clearAction(key: string): void
  maybeConfirm(key: string, utterance: string): ConfirmationResult<T>
}

export interface WakeConfigOptions {
  wakeWords?: string[]
  aliases?: Record<string, string[]>
  minConfidence?: number
}

export declare function createWakeConfig(options?: WakeConfigOptions): Required<WakeConfigOptions>
export declare function createContextManager<T = unknown>(): ContextManager<T>
