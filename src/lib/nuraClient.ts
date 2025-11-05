// Mock Nura client implementation
// In a real app, this would use @nura/core, @nura/plugin-voice, @nura/plugin-fuzzy
import type { Locale, FuzzyStrategy, WakeMatchType, MatchedBy, NuraResult, RankingEntry } from "./types"
import { eventBus } from "./telemetry"

interface Intent {
  pattern: string
  action: string
  params?: string[]
}

const intents: Intent[] = [
  { pattern: "abre el menú de órdenes", action: "open::menu:orders" },
  { pattern: "abre el menú de pedidos", action: "open::menu:orders" },
  { pattern: "open orders menu", action: "open::menu:orders" },
  { pattern: "elimina la orden", action: "delete::order", params: ["id"] },
  { pattern: "borra la orden", action: "delete::order", params: ["id"] },
  { pattern: "delete order", action: "delete::order", params: ["id"] },
]

const wakeWords = ["nura", "nora", "lura", "nula"]
const wakeAliases = ["ok", "okay", "okey"]

const numeralsES: Record<string, number> = {
  cero: 0,
  uno: 1,
  dos: 2,
  tres: 3,
  cuatro: 4,
  cinco: 5,
  seis: 6,
  siete: 7,
  ocho: 8,
  nueve: 9,
  diez: 10,
  once: 11,
  doce: 12,
  trece: 13,
  catorce: 14,
  quince: 15,
  dieciséis: 16,
  diecisiete: 17,
  dieciocho: 18,
  diecinueve: 19,
  veinte: 20,
}

const numeralsEN: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
}

let lastContext: { action: string; payload?: Record<string, unknown> } | null = null

export class NuraClient {
  private threshold = 0.7
  private strategy: FuzzyStrategy = "hybrid"
  private locale: Locale = "auto"
  private explainMode = false
  private lastRanking: RankingEntry[] = []

  setThreshold(value: number) {
    this.threshold = value
  }

  setStrategy(strategy: FuzzyStrategy) {
    this.strategy = strategy
  }

  setLocale(locale: Locale) {
    this.locale = locale
  }

  setExplainMode(enabled: boolean) {
    this.explainMode = enabled
  }

  getLastRanking(): RankingEntry[] {
    return this.lastRanking
  }

  private detectLocale(text: string): "es" | "en" {
    if (this.locale !== "auto") {
      return this.locale === "es-419" ? "es" : (this.locale as "es" | "en")
    }

    const esWords = ["abre", "elimina", "borra", "menú", "órdenes", "pedidos", "orden", "sí"]
    const enWords = ["open", "delete", "menu", "orders", "order", "yes"]

    const lowerText = text.toLowerCase()
    const esCount = esWords.filter((w) => lowerText.includes(w)).length
    const enCount = enWords.filter((w) => lowerText.includes(w)).length

    return esCount > enCount ? "es" : "en"
  }

  private stripWake(text: string): { cleaned: string; via: WakeMatchType; confidence: number } {
    const tokens = text.toLowerCase().split(/\s+/)

    // Check for wake word patterns
    for (let i = 0; i < tokens.length - 1; i++) {
      if (wakeAliases.includes(tokens[i])) {
        const nextToken = tokens[i + 1]

        // Exact match
        if (nextToken === "nura") {
          const cleaned = tokens.slice(i + 2).join(" ")
          eventBus.emit("voice.wake.exact", { wake: "nura", position: i })
          return { cleaned, via: "exact", confidence: 1.0 }
        }

        // Phonetic match
        if (wakeWords.includes(nextToken)) {
          const cleaned = tokens.slice(i + 2).join(" ")
          const confidence = this.phoneticSimilarity("nura", nextToken)
          eventBus.emit("voice.wake.fuzzy", { wake: nextToken, canonical: "nura", confidence })
          return { cleaned, via: "phonetic", confidence }
        }
      }
    }

    return { cleaned: text, via: "none", confidence: 0 }
  }

  private phoneticSimilarity(a: string, b: string): number {
    // Simple phonetic similarity (Levenshtein-based)
    const maxLen = Math.max(a.length, b.length)
    const distance = this.levenshtein(a, b)
    return Math.max(0, 1 - distance / maxLen)
  }

  private levenshtein(a: string, b: string): number {
    const matrix: number[][] = []

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i]
    }

    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        }
      }
    }

    return matrix[b.length][a.length]
  }

  private extractNumerals(text: string, locale: "es" | "en"): { cleaned: string; numbers: Record<string, number> } {
    const numerals = locale === "es" ? numeralsES : numeralsEN
    const numbers: Record<string, number> = {}
    let cleaned = text

    Object.entries(numerals).forEach(([word, num]) => {
      const regex = new RegExp(`\\b${word}\\b`, "gi")
      if (regex.test(cleaned)) {
        numbers.id = num
        cleaned = cleaned.replace(regex, num.toString())
      }
    })

    // Also extract plain numbers
    const numberMatch = cleaned.match(/\b(\d+)\b/)
    if (numberMatch) {
      numbers.id = Number.parseInt(numberMatch[1], 10)
    }

    return { cleaned, numbers }
  }

  private fuzzyMatch(text: string, locale: "es" | "en"): { intent: string; confidence: number; matchedBy: MatchedBy } {
    const ranking: RankingEntry[] = []

    for (const intent of intents) {
      const similarity = this.calculateSimilarity(text, intent.pattern)
      ranking.push({
        intent: intent.action,
        score: similarity,
        reason: `${this.strategy} similarity with pattern "${intent.pattern}"`,
      })
    }

    // Sort by score
    ranking.sort((a, b) => b.score - a.score)
    this.lastRanking = ranking

    const best = ranking[0]

    if (best.score >= this.threshold) {
      return { intent: best.intent, confidence: best.score, matchedBy: "plugin" }
    }

    // Fallback regex patterns
    if (/abre|open/i.test(text) && /men[uú]|menu/i.test(text)) {
      return { intent: "open::menu:orders", confidence: 0.6, matchedBy: "fallback" }
    }

    if (/elimina|borra|delete/i.test(text) && /orden|order/i.test(text)) {
      return { intent: "delete::order", confidence: 0.6, matchedBy: "fallback" }
    }

    return { intent: "", confidence: 0, matchedBy: "none" }
  }

  private calculateSimilarity(text: string, pattern: string): number {
    const textLower = text.toLowerCase().trim()
    const patternLower = pattern.toLowerCase().trim()

    // Exact match
    if (textLower === patternLower) return 1.0

    // Contains pattern
    if (textLower.includes(patternLower)) return 0.9

    // Word overlap
    const textWords = new Set(textLower.split(/\s+/))
    const patternWords = patternLower.split(/\s+/)
    const overlap = patternWords.filter((w) => textWords.has(w)).length
    const wordScore = overlap / patternWords.length

    // Levenshtein distance
    const distance = this.levenshtein(textLower, patternLower)
    const maxLen = Math.max(textLower.length, patternLower.length)
    const levScore = 1 - distance / maxLen

    // Combine scores based on strategy
    switch (this.strategy) {
      case "damerau":
        return levScore
      case "soundex":
        return wordScore * 0.8 + levScore * 0.2
      case "double-metaphone":
        return wordScore * 0.7 + levScore * 0.3
      case "hybrid":
      default:
        return wordScore * 0.6 + levScore * 0.4
    }
  }

  private checkContext(text: string): { intent: string; confidence: number } | null {
    const affirmatives = ["sí", "si", "yes", "ok", "elimínala", "bórrala", "delete it"]
    const lowerText = text.toLowerCase()

    if (lastContext && affirmatives.some((a) => lowerText.includes(a))) {
      eventBus.emit("context.confirmation", { previous: lastContext, confirmed: true })
      return { intent: lastContext.action, confidence: 0.95 }
    }

    return null
  }

  async process(utterance: string): Promise<NuraResult> {
    const timestamp = Date.now()

    // Check context first
    const contextMatch = this.checkContext(utterance)
    if (contextMatch) {
      const result: NuraResult = {
        intent: contextMatch.intent,
        confidence: contextMatch.confidence,
        via: "none",
        matchedBy: "plugin",
        locale: this.locale === "auto" ? "es" : this.locale,
        payload: lastContext?.payload,
        utterance,
        timestamp,
      }

      if (!this.explainMode) {
        await this.act(result)
      }

      return result
    }

    // Strip wake word
    const { cleaned, via, confidence: wakeConfidence } = this.stripWake(utterance)

    // Detect locale
    const detectedLocale = this.detectLocale(cleaned)

    // Extract numerals
    const { cleaned: withoutNumerals, numbers } = this.extractNumerals(cleaned, detectedLocale)

    // Fuzzy match
    const { intent, confidence, matchedBy } = this.fuzzyMatch(withoutNumerals, detectedLocale)

    const result: NuraResult = {
      intent,
      confidence: via === "phonetic" ? Math.min(confidence, wakeConfidence) : confidence,
      via,
      matchedBy,
      locale: this.locale === "auto" ? detectedLocale : this.locale,
      payload: Object.keys(numbers).length > 0 ? numbers : undefined,
      utterance,
      timestamp,
    }

    // Store context for confirmations
    if (intent && !this.explainMode) {
      lastContext = { action: intent, payload: result.payload }
      await this.act(result)
    }

    return result
  }

  private async act(result: NuraResult): Promise<void> {
    const { intent, payload } = result

    if (intent === "open::menu:orders") {
      eventBus.emit("ui.menu.open", { menu: "orders" })
    } else if (intent === "delete::order") {
      eventBus.emit("order.delete", { id: payload?.id })
    }
  }
}

export const nuraClient = new NuraClient()
