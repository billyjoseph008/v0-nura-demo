"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { nuraClient } from "@/lib/nuraClient"
import type { NuraResult } from "@/lib/types"

interface ExamplesProps {
  onResult: (result: NuraResult) => void
}

const examples = [
  "ok nura abre el menú de órdenes",
  "ok nura elimina la orden 15",
  "ok nora abre el menú de órdenes",
  "ok nura borra la orden quince",
  "ok nura open orders menu",
  "abre el menú de pedidos",
  "sí, elimínala",
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
          {examples.map((example, index) => (
            <Button key={index} variant="outline" size="sm" onClick={() => handleExample(example)} className="text-xs">
              {example}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
