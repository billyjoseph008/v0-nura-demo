import { stripWake, type StripWakeResult } from "@nura/core"

export const wakeConfig = {
  wakeWords: ["ok nura"],
  aliases: {
    "ok nura": ["ok nora", "oye nura", "ok nueva"],
  },
  minConfidence: 0.7,
}

export function analyzeWakePhrase(phrase: string): StripWakeResult {
  return stripWake(phrase, wakeConfig)
}
