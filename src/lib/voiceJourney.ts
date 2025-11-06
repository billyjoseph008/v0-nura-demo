export type VoiceStepId = "openMenu" | "addOrder" | "updateOrder" | "deleteOrder"

export type VoiceStepStatus = "pending" | "active" | "completed"

export type VoiceStepStatusMap = Record<VoiceStepId, VoiceStepStatus>

export interface VoiceMessage {
  id: string
  role: "user" | "nura"
  content: string
  timestamp: string
}

export const voiceStepOrder: VoiceStepId[] = ["openMenu", "addOrder", "updateOrder", "deleteOrder"]

export const voiceStepMeta: Record<VoiceStepId, { title: string; description: string; suggestion: string }> = {
  openMenu: {
    title: "Abre el menú de órdenes",
    description: "Despierta a Nura con \"ok nura\" y pide que abra el panel interactivo de órdenes.",
    suggestion: 'Frase sugerida: "ok nura abre el menú de órdenes"',
  },
  addOrder: {
    title: "Agrega una orden nueva",
    description: "Suma un pedido especial usando tu voz y mira cómo aparece instantáneamente en la lista.",
    suggestion: 'Frase sugerida: "ok nura agrega la orden matcha latte con nota sin azúcar"',
  },
  updateOrder: {
    title: "Modifica una orden existente",
    description: "Actualiza nombre o notas para demostrar correcciones dinámicas.",
    suggestion: 'Frase sugerida: "ok nura modifica la orden dos con nota agrega canela"',
  },
  deleteOrder: {
    title: "Elimina una orden",
    description: "Confirma la eliminación con el flujo de doble verificación por voz.",
    suggestion: 'Frase sugerida: "ok nura elimina la orden dos" y luego "sí, elimínala"',
  },
}

export const createInitialVoiceState = (): VoiceStepStatusMap => ({
  openMenu: "active",
  addOrder: "pending",
  updateOrder: "pending",
  deleteOrder: "pending",
})
