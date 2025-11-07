const DEFAULT_APPROVAL_WORDS = ["yes", "sí", "si", "claro", "confirm"]
const DEFAULT_REJECTION_WORDS = ["no", "nope", "cancel", "cancelar", "rechazar"]

const localeNumeralMaps = {
  es: new Map([
    ["cero", 0],
    ["uno", 1],
    ["dos", 2],
    ["tres", 3],
    ["cuatro", 4],
    ["cinco", 5],
    ["seis", 6],
    ["siete", 7],
    ["ocho", 8],
    ["nueve", 9],
    ["diez", 10],
    ["once", 11],
    ["doce", 12],
    ["trece", 13],
    ["catorce", 14],
    ["quince", 15],
    ["dieciséis", 16],
    ["dieciseis", 16],
    ["diecisiete", 17],
    ["dieciocho", 18],
    ["diecinueve", 19],
    ["veinte", 20],
    ["veintiuno", 21],
    ["veintiuna", 21],
    ["veintidós", 22],
    ["veintidos", 22],
    ["treinta", 30],
    ["cuarenta", 40],
    ["cincuenta", 50],
  ]),
  en: new Map([
    ["zero", 0],
    ["one", 1],
    ["two", 2],
    ["three", 3],
    ["four", 4],
    ["five", 5],
    ["six", 6],
    ["seven", 7],
    ["eight", 8],
    ["nine", 9],
    ["ten", 10],
    ["eleven", 11],
    ["twelve", 12],
    ["thirteen", 13],
    ["fourteen", 14],
    ["fifteen", 15],
    ["sixteen", 16],
    ["seventeen", 17],
    ["eighteen", 18],
    ["nineteen", 19],
    ["twenty", 20],
    ["twenty-one", 21],
    ["twenty one", 21],
    ["thirty", 30],
    ["forty", 40],
    ["fifty", 50],
  ]),
}

const localeSynonyms = {
  es: new Map([
    ["pedido", "órdenes"],
    ["pedidos", "órdenes"],
    ["orden", "órdenes"],
    ["ordenes", "órdenes"],
  ]),
  en: new Map([
    ["orders", "orders"],
    ["order", "orders"],
  ]),
}

function normaliseForLookup(value) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim()
}

export function stripWake(utterance, options) {
  const { wakeWords = [], aliases = {}, minConfidence = 0.6 } = options || {}
  const cleanedUtterance = utterance == null ? "" : String(utterance).trim()
  const lowered = cleanedUtterance.toLowerCase()

  const knownWakeWords = new Map()
  wakeWords.forEach((word) => {
    if (!word) return
    knownWakeWords.set(word.toLowerCase(), { canonical: word, confidence: 1 })
  })
  Object.entries(aliases).forEach(([canonical, aliasList]) => {
    aliasList.forEach((alias) => {
      if (!alias) return
      const normalized = alias.toLowerCase()
      const confidence = alias === canonical ? 1 : Math.max(0.65, Math.min(0.95, 1 - alias.length * 0.01))
      knownWakeWords.set(normalized, { canonical, alias, confidence })
    })
  })

  for (const [candidate, metadata] of knownWakeWords.entries()) {
    if (lowered.startsWith(candidate)) {
      const command = cleanedUtterance.slice(candidate.length).trim()
      if (metadata.confidence < minConfidence) {
        return {
          matched: false,
          confidence: metadata.confidence,
          wakeWord: metadata.canonical,
          command: cleanedUtterance,
        }
      }

      return {
        matched: true,
        confidence: metadata.confidence,
        wakeWord: metadata.canonical,
        alias: metadata.alias,
        command,
      }
    }
  }

  return {
    matched: false,
    confidence: 0,
    command: cleanedUtterance,
  }
}

export function parseNumeral(input, locale = "en") {
  if (input == null) return null
  const normalized = normaliseForLookup(String(input))
  if (!normalized) return null

  if (/^-?\d+$/.test(normalized)) {
    return Number.parseInt(normalized, 10)
  }

  const map = localeNumeralMaps[locale] ?? localeNumeralMaps.en
  if (map.has(normalized)) {
    return map.get(normalized)
  }

  if (normalized.includes(" ")) {
    const segments = normalized.split(/\s+/)
    const values = segments.map((segment) => map.get(segment) ?? null)
    if (values.every((value) => typeof value === "number")) {
      return values.reduce((total, current) => total + current, 0)
    }
  }

  return null
}

export function normalizeSynonyms(term, locale = "en") {
  const normalizedInput = normaliseForLookup(term ?? "")
  const synonymsMap = localeSynonyms[locale] ?? localeSynonyms.en
  const canonical = synonymsMap.get(normalizedInput) ?? normalizedInput
  const isSynonym = canonical !== normalizedInput

  return {
    input: term,
    normalized: canonical,
    matched: isSynonym,
    variants: Array.from(new Set([canonical, normalizedInput, term])).filter(Boolean),
  }
}

export class ContextManager {
  constructor() {
    this.store = new Map()
  }

  saveAction(key, action) {
    const entry = {
      ...action,
      savedAt: Date.now(),
    }
    this.store.set(key, entry)
    return entry
  }

  getAction(key) {
    return this.store.get(key) ?? null
  }

  clearAction(key) {
    this.store.delete(key)
  }

  maybeConfirm(key, utterance) {
    const entry = this.store.get(key)
    if (!entry) {
      return { confirmed: false, reason: "missing-context" }
    }

    const cleaned = normaliseForLookup(utterance ?? "")
    if (!cleaned) {
      return { confirmed: false, reason: "empty-response", action: entry }
    }

    if (DEFAULT_APPROVAL_WORDS.includes(cleaned)) {
      this.store.delete(key)
      return { confirmed: true, action: entry }
    }

    if (DEFAULT_REJECTION_WORDS.includes(cleaned)) {
      this.store.delete(key)
      return { confirmed: false, reason: "rejected", action: entry }
    }

    return { confirmed: false, reason: "unrecognized", action: entry }
  }
}

export function createWakeConfig({ wakeWords, aliases, minConfidence } = {}) {
  return {
    wakeWords: wakeWords ?? ["ok nura", "oye nura"],
    aliases: aliases ?? { "ok nura": ["ok nora", "hola nura"] },
    minConfidence: minConfidence ?? 0.6,
  }
}

export function createContextManager() {
  return new ContextManager()
}

