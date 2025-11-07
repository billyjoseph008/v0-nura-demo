import {
  ContextManager,
  createContextManager,
  normalizeSynonyms,
  parseNumeral,
} from "@nura/core"

export function demoParseNumeral(value: string, locale: string) {
  return parseNumeral(value, locale)
}

export function demoNormalizeSynonym(value: string, locale: string) {
  return normalizeSynonyms(value, locale)
}

export function demoContextConfirmation(manager: ContextManager, utterance: string) {
  manager.saveAction("delete", { intent: "delete-order", description: "Eliminar orden" })
  const normalized = utterance.split(/[,.!?]/)[0]!.trim()
  return manager.maybeConfirm("delete", normalized)
}

export function createLocaleContextManager() {
  return createContextManager()
}

export { ContextManager }
