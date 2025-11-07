// Mock Nura client implementation
// In a real app, this would use @nura/core, @nura/plugin-voice, @nura/plugin-fuzzy
import type {
  Locale,
  FuzzyStrategy,
  WakeMatchType,
  MatchedBy,
  NuraResult,
  RankingEntry,
  NuraGlobalContext,
  NuraPendingActionContext,
} from "./types"
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
  { pattern: "agrega la orden", action: "create::order" },
  { pattern: "añade la orden", action: "create::order" },
  { pattern: "add the order", action: "create::order" },
  { pattern: "add order", action: "create::order" },
  { pattern: "modifica la orden", action: "update::order", params: ["id"] },
  { pattern: "actualiza la orden", action: "update::order", params: ["id"] },
  { pattern: "update the order", action: "update::order", params: ["id"] },
  { pattern: "update order", action: "update::order", params: ["id"] },
  { pattern: "muestra capacidades", action: "show::capabilities" },
  { pattern: "ayuda nura", action: "show::capabilities" },
  { pattern: "show capabilities", action: "show::capabilities" },
  { pattern: "help panel", action: "show::capabilities" },
  { pattern: "abre telemetría", action: "open::telemetry" },
  { pattern: "ver ranking", action: "open::telemetry" },
  { pattern: "open telemetry", action: "open::telemetry" },
  { pattern: "activa modo explain", action: "toggle::explain:on" },
  { pattern: "activar explain", action: "toggle::explain:on" },
  { pattern: "turn explain mode on", action: "toggle::explain:on" },
  { pattern: "desactiva modo explain", action: "toggle::explain:off" },
  { pattern: "desactiva explain", action: "toggle::explain:off" },
  { pattern: "turn explain mode off", action: "toggle::explain:off" },
  { pattern: "conectar mcp", action: "mcp::connect" },
  { pattern: "connect mcp", action: "mcp::connect" },
  { pattern: "listar recursos", action: "mcp::list:resources" },
  { pattern: "list resources", action: "mcp::list:resources" },
  { pattern: "listar tools", action: "mcp::list:tools" },
  { pattern: "listar herramientas", action: "mcp::list:tools" },
  { pattern: "list tools", action: "mcp::list:tools" },
  { pattern: "sí, confírmalo", action: "confirm::last-action" },
  { pattern: "sí, elimínalo", action: "confirm::last-action" },
  { pattern: "sí, elimínala", action: "confirm::last-action" },
  { pattern: "yes, confirm", action: "confirm::last-action" },
  { pattern: "si, eliminalo", action: "confirm::last-action" },
  { pattern: "confirm it", action: "confirm::last-action" },
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

type PendingAction = {
  action: string
  payload?: Record<string, unknown>
  description: string
}

let pendingAction: PendingAction | null = null

export class NuraClient {
  private threshold = 0.7
  private strategy: FuzzyStrategy = "hybrid"
  private locale: Locale = "auto"
  private explainMode = false
  private lastRanking: RankingEntry[] = []
  private context: NuraGlobalContext = {
    orders: [],
    modals: {
      capabilities: false,
      telemetry: false,
      orders: false,
    },
    pendingAction: null,
    confirmDialog: null,
  }

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

  updateContext(context: NuraGlobalContext): void {
    this.context = {
      orders: context.orders.map((order) => ({ ...order })),
      modals: { ...context.modals },
      pendingAction: context.pendingAction ? { ...context.pendingAction } : null,
      confirmDialog: context.confirmDialog ? { ...context.confirmDialog } : null,
    }

    if (this.context.pendingAction) {
      const nextPending: PendingAction = {
        action: this.context.pendingAction.intent,
        payload: this.context.pendingAction.payload,
        description: this.context.pendingAction.description,
      }
      pendingAction = nextPending
    } else if (!context.pendingAction) {
      pendingAction = null
    }

    eventBus.emit("context.updated", this.context)
  }

  private detectLocale(text: string): "es" | "en" {
    if (this.locale !== "auto") {
      return this.locale === "es-419" ? "es" : (this.locale as "es" | "en")
    }

    const esWords = [
      "abre",
      "elimina",
      "borra",
      "menú",
      "órdenes",
      "pedidos",
      "orden",
      "sí",
      "telemetría",
      "capacidades",
      "ayuda",
      "recursos",
      "herramientas",
      "explica",
    ]
    const enWords = [
      "open",
      "delete",
      "menu",
      "orders",
      "order",
      "yes",
      "telemetry",
      "capabilities",
      "help",
      "resources",
      "tools",
      "explain",
    ]

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

  private formatOrderText(text: string): string {
    return text
      .trim()
      .replace(/\s+/g, " ")
      .split(" ")
      .map((segment) => (segment ? segment[0].toUpperCase() + segment.slice(1) : segment))
      .join(" ")
  }

  private parseCreateOrder(text: string): { name?: string; notes?: string } {
    const match = text.match(/(?:agrega|añade|add)\s+la\s+orden\s+(.*)$/i)
    if (!match) return {}
    const rest = match[1].trim()
    if (!rest) return {}

    const separators = [" con nota ", " con notas ", " con comentario ", " con comentarios ", " with note ", " with notes ", " nota:", " note:"]
    for (const separator of separators) {
      const index = rest.indexOf(separator)
      if (index !== -1) {
        const namePart = rest.slice(0, index)
        const notesPart = rest.slice(index + separator.length)
        return {
          name: this.formatOrderText(namePart || rest),
          notes: this.formatOrderText(notesPart),
        }
      }
    }

    return { name: this.formatOrderText(rest) }
  }

  private parseUpdateOrder(text: string): { name?: string; notes?: string } {
    // Try to extract notes first
    const notesMatch = text.match(/(?:con nota|con notas|with note|with notes|nota:|note:)\s+(.*)$/i)
    if (notesMatch && notesMatch[1]) {
      const notes = notesMatch[1].trim()
      return { notes: this.formatOrderText(notes) }
    }

    // Fallback for updating the name directly, e.g., "modifica la orden a 'nuevo nombre'"
    const nameMatch = text.match(/(?:modifica|actualiza|update)\s+la\s+orden(?:\s+\d+)?\s+a\s+(.*)$/i)
    if (nameMatch && nameMatch[1]) {
      const newName = nameMatch[1].trim()
      return { name: this.formatOrderText(newName) }
    }

    return {}
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

    if (/(agrega|añade|add)/i.test(text) && /orden|order/i.test(text)) {
      return { intent: "create::order", confidence: 0.58, matchedBy: "fallback" }
    }

    if (/(modifica|actualiza|update)/i.test(text) && /orden|order/i.test(text)) {
      return { intent: "update::order", confidence: 0.58, matchedBy: "fallback" }
    }

    if (/(show|help|ayuda|capacit)/i.test(text)) {
      return { intent: "show::capabilities", confidence: 0.55, matchedBy: "fallback" }
    }

    if (/telemetr|ranking/i.test(text)) {
      return { intent: "open::telemetry", confidence: 0.55, matchedBy: "fallback" }
    }

    if (/explain/i.test(text)) {
      const enable = /(on|activa|activar)/i.test(text)
      return {
        intent: enable ? "toggle::explain:on" : "toggle::explain:off",
        confidence: 0.55,
        matchedBy: "fallback",
      }
    }

    if (/mcp/i.test(text) && /connect|conect/i.test(text)) {
      return { intent: "mcp::connect", confidence: 0.55, matchedBy: "fallback" }
    }

    if (/mcp/i.test(text) && /(resource|recurso)/i.test(text)) {
      return { intent: "mcp::list:resources", confidence: 0.55, matchedBy: "fallback" }
    }

    if (/mcp/i.test(text) && /(tool|herramienta)/i.test(text)) {
      return { intent: "mcp::list:tools", confidence: 0.55, matchedBy: "fallback" }
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

  private checkContext(text: string): { intent: string; confidence: number; payload?: Record<string, unknown> } | null {
    const affirmatives = [
      "sí",
      "si",
      "elimínalo",
      "eliminalo",
      "yes",
      "ok",
      "elimínala",
      "bórrala",
      "delete it",
      "confirm",
      "confirma",
      "confírmala",
    ]
    const negatives = [
      "no",
      "cancel",
      "cancelar",
      "cancela",
      "stop",
      "rechaza",
      "rechazar",
      "no gracias",
      "cancelala",
      "cancélala",
    ]
    const lowerText = text.toLowerCase()

    // This is the key part for voice confirmation.
    // It checks if a dialog is open and if the user is confirming/cancelling.
    if (this.context.confirmDialog) {
      if (affirmatives.some((a) => lowerText.includes(a))) {
        // It only emits the UI event, simulating a click. App.tsx will handle the rest.
        eventBus.emit("ui.dialog.confirm", {})
        return { intent: "confirm::last-action", confidence: 0.95, payload: pendingAction?.payload }
      }

      if (negatives.some((a) => lowerText.includes(a))) {
        // It only emits the UI event, simulating a click. App.tsx will handle the rest.
        eventBus.emit("ui.dialog.cancel", {})
        return { intent: "cancel::last-action", confidence: 0.9, payload: pendingAction?.payload }
      }
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
        payload: contextMatch.payload,
        utterance,
        timestamp,
      }

      // Action already executed in confirmPendingAction

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

    let finalIntent = intent
    let finalPayload: Record<string, unknown> | undefined =
      Object.keys(numbers).length > 0 ? numbers : undefined
    let skipAct = false

    if (intent === "confirm::last-action" && pendingAction) {
      const previous = pendingAction
      const executed = this.confirmPendingAction()
      if (executed) {
        finalIntent = previous.action
        finalPayload = previous.payload
        skipAct = true
      } else {
        finalIntent = ""
      }
    }

    if (finalIntent === "create::order") {
      const details = this.parseCreateOrder(withoutNumerals)
      if (details.name || details.notes) {
        finalPayload = { ...(finalPayload ?? {}), ...details }
      }
    }

    if (finalIntent === "update::order") {
      const details = this.parseUpdateOrder(withoutNumerals)
      if (details.name || details.notes) {
        finalPayload = { ...(finalPayload ?? {}), ...details }
      }
    }

    const result: NuraResult = {
      intent: finalIntent,
      confidence: via === "phonetic" ? Math.min(confidence, wakeConfidence) : confidence,
      via,
      matchedBy,
      locale: this.locale === "auto" ? detectedLocale : this.locale,
      payload: finalPayload,
      utterance,
      timestamp,
    }

    // Store context for confirmations
    if (finalIntent && !this.explainMode && !skipAct) {
      await this.act(result)
    }

    return result
  }

  private async act(result: NuraResult): Promise<void> {
    const { intent, payload } = result

    if (intent === "open::menu:orders") {
      eventBus.emit("ui.menu.open", { menu: "orders" })
    } else if (intent === "delete::order") {
      const id = payload?.id
      pendingAction = {
        action: intent,
        payload: { id },
        description: id ? `Delete order ${id}` : "Delete last referenced order",
      }
      this.context.pendingAction = {
        intent,
        description: pendingAction.description,
        payload: pendingAction.payload ?? undefined,
      }
      this.context.confirmDialog = {
        intent,
        description: pendingAction.description,
      }
      eventBus.emit("action.pending", { intent, payload: pendingAction.payload, description: pendingAction.description })
    } else if (intent === "create::order") {
      const rawName = payload?.name
      const rawNotes = payload?.notes
      eventBus.emit("order.voice.add", {
        name: typeof rawName === "string" && rawName.trim() ? this.formatOrderText(rawName) : undefined,
        notes: typeof rawNotes === "string" && rawNotes.trim() ? this.formatOrderText(rawNotes) : undefined,
      })
    } else if (intent === "update::order") {
      const idValue = payload?.id
      const numericId = typeof idValue === "number" ? idValue : Number.parseInt(String(idValue ?? ""), 10)
      const rawName = payload?.name
      const rawNotes = payload?.notes
      eventBus.emit("order.voice.update", {
        id: Number.isNaN(numericId) ? undefined : numericId,
        name: typeof rawName === "string" && rawName.trim() ? this.formatOrderText(rawName) : undefined,
        notes: typeof rawNotes === "string" && rawNotes.trim() ? this.formatOrderText(rawNotes) : undefined,
      })
    } else if (intent === "show::capabilities") {
      eventBus.emit("ui.capabilities.open", {})
    } else if (intent === "open::telemetry") {
      eventBus.emit("ui.telemetry.open", {})
    } else if (intent === "toggle::explain:on") {
      this.explainMode = true
      eventBus.emit("ui.explain.toggle", { enabled: true })
    } else if (intent === "toggle::explain:off") {
      this.explainMode = false
      eventBus.emit("ui.explain.toggle", { enabled: false })
    } else if (intent === "mcp::connect") {
      eventBus.emit("mcp.request.connect", {})
    } else if (intent === "mcp::list:resources") {
      eventBus.emit("mcp.request.listResources", {})
    } else if (intent === "mcp::list:tools") {
      eventBus.emit("mcp.request.listTools", {})
    }
  }

  getPendingAction(): PendingAction | null {
    return pendingAction
  }

  confirmPendingAction(): boolean {
    if (!pendingAction) return false
    const current = pendingAction
    pendingAction = null
    this.context.pendingAction = null
    this.context.confirmDialog = null
    if (current.action === "delete::order") {
      // This was missing. We need to emit the confirmation event
      // so that App.tsx knows to actually delete the order.
      eventBus.emit("action.confirmed", { intent: current.action, payload: current.payload })
    }
    return true
  }

  cancelPendingAction(): void {
    if (!pendingAction) return
    const current = pendingAction
    pendingAction = null
    this.context.pendingAction = null
    this.context.confirmDialog = null
    eventBus.emit("action.cancelled", { intent: current.action, payload: current.payload, description: current.description })
  }
}

export const nuraClient = new NuraClient()
