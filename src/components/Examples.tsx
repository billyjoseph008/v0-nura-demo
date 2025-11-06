"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { nuraClient } from "@/lib/nuraClient"
import type { NuraResult } from "@/lib/types"

interface ExamplesProps {
  onResult: (result: NuraResult) => void
}

const examples = [
  { label: "Open orders", utterance: "ok nura abre el menú de órdenes", testId: "ex-orders" },
  { label: "Delete order", utterance: "ok nura elimina la orden 15", testId: "ex-delete" },
  { label: "Phonetic wake", utterance: "ok nora abre el menú de órdenes", testId: "ex-phonetic" },
  { label: "Numeral ES", utterance: "ok nura borra la orden quince", testId: "ex-numeral-es" },
  { label: "Orders EN", utterance: "ok nura open orders menu", testId: "ex-orders-en" },
  { label: "Menu synonym", utterance: "abre el menú de pedidos", testId: "ex-synonym" },
  { label: "Confirm delete", utterance: "sí, elimínala", testId: "ex-confirm" },
  { label: "Help panel", utterance: "ok nura muestra capacidades", testId: "ex-capabilities" },
  { label: "Open telemetry", utterance: "ok nura abre telemetría", testId: "ex-telemetry" },
  { label: "Explain on", utterance: "ok nura activa modo explain", testId: "ex-explain-on" },
  { label: "Explain off", utterance: "ok nura desactiva explain", testId: "ex-explain-off" },
  { label: "Connect MCP", utterance: "ok nora conectar mcp", testId: "ex-mcp-connect" },
  { label: "List tools", utterance: "ok nura list tools", testId: "ex-mcp-tools" },
  { label: "List resources", utterance: "ok nura list resources", testId: "ex-mcp-resources" },
]

export default function Examples({ onResult }: ExamplesProps) {
  const handleExample = async (example: string) => {
    const result = await nuraClient.process(example)
    onResult(result)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Examples</CardTitle>
        <CardDescription>Click to test common utterances</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {examples.map((example) => (
            <Button
              key={example.testId}
              variant="outline"
              size="sm"
              onClick={() => handleExample(example.utterance)}
              className="text-xs"
              data-testid={example.testId}
            >
              {example.label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
