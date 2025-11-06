import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"

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

export default function Checklist() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Manual E2E Checklist</CardTitle>
        <CardDescription>Test these scenarios manually</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {checklistItems.map((item, index) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
              <span className="text-muted-foreground">{item}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
