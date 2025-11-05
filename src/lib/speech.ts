export interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
}

export interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

export interface SpeechRecognitionResult {
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
  isFinal: boolean
}

export interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

export interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: Event) => void) | null
  onend: (() => void) | null
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition
    webkitSpeechRecognition: new () => SpeechRecognition
  }
}

export function isSpeechRecognitionSupported(): boolean {
  return "SpeechRecognition" in window || "webkitSpeechRecognition" in window
}

export function createSpeechRecognition(): SpeechRecognition | null {
  if (!isSpeechRecognitionSupported()) return null

  const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition
  return new SpeechRecognitionAPI()
}

export function getLocaleCode(locale: string): string {
  const localeMap: Record<string, string> = {
    es: "es-ES",
    "es-419": "es-419",
    en: "en-US",
    auto: "es-ES",
  }
  return localeMap[locale] || "es-ES"
}
