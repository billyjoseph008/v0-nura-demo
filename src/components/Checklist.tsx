import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, Circle } from "lucide-react"
import {
  type VoiceStepStatusMap,
  voiceStepMeta,
  voiceStepOrder,
} from "@/lib/voiceJourney"

const checklistItems = [
  'Phonetic wake: "ok nora abre el menú de órdenes"',
  'Multiple wake aliases: "ok lura..." and "ok nula..."',
  'Numerals ES: "ok nura borra la orden quince" → id=15',
  'Numerals EN: "ok nura delete order fifteen" → id=15',
  'Synonyms: "abre el menú de pedidos" → orders',
  'Incomplete: "abre menú" → explain mode shows Top-K',
  'Context confirmation: "elimina la orden 15" then "sí, elimínala"',
  'Capabilities modal: "muestra capacidades" or "help panel" opens dialog',
  'Telemetry focus: "abre telemetría" highlights card/modal',
  'Explain toggles: "activa modo explain" / "desactiva explain" update switch',
  'MCP workflows: "conectar mcp", "list resources", "list tools" trigger panel',
  'Threshold=0.9 on borderline inputs → "No match"',
  "Compare strategies: damerau, soundex, double-metaphone, hybrid",
  "Locale auto vs forced (auto/es/en/es-419)",
  'Keyboard shortcuts: ?, t, e respond globally',
]

interface ChecklistProps {
  voiceStatuses: VoiceStepStatusMap
}

export default function Checklist({ voiceStatuses }: ChecklistProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Manual E2E Checklist</CardTitle>
        <CardDescription>
          Sigue el recorrido por voz y luego valida los escenarios adicionales cuando quieras comparar estrategias.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-primary">
            Playground guiado
          </p>
          <ul className="space-y-2">
            {voiceStepOrder.map((step) => {
              const status = voiceStatuses[step]
              const completed = status === "completed"
              const Icon = completed ? CheckCircle2 : Circle
              return (
                <li key={step} className="flex items-start gap-2 rounded-xl bg-muted/40 p-2 text-sm">
                  <Icon
                    className={`mt-0.5 h-4 w-4 flex-shrink-0 ${completed ? "text-emerald-500" : status === "active" ? "text-primary animate-pulse" : "text-muted-foreground"}`}
                  />
                  <div>
                    <p className="font-medium text-foreground">{voiceStepMeta[step].title}</p>
                    <p className="text-xs text-muted-foreground">{voiceStepMeta[step].suggestion}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-primary">
            Casos adicionales para explorar
          </p>
          <ul className="space-y-2">
            {checklistItems.map((item, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <span className="text-muted-foreground">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
