import { useCallback, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RouterLink } from "@/Router"
import type { StripWakeResult } from "@nura/core"
import { analyzeWakePhrase, wakeConfig } from "./voiceDemo"

export default function VoiceLab() {
  const [phrase, setPhrase] = useState("ok nora abrir órdenes")
  const [result, setResult] = useState<StripWakeResult | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)

  const processPhrase = useCallback(() => {
    const evaluation = analyzeWakePhrase(phrase)
    setResult(evaluation)
    const normalizedCommand = (evaluation.command ?? "")
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
    if (evaluation.matched && normalizedCommand.includes("ordenes")) {
      setPanelOpen(true)
    } else {
      setPanelOpen(false)
    }
  }, [phrase])

  const panelState = useMemo(() => (panelOpen ? "Panel de Órdenes abierto" : "Panel cerrado"), [panelOpen])

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
      <RouterLink to="/labs" className="text-sm text-primary/80 hover:text-primary">
        ← Volver al índice de Labs
      </RouterLink>
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Wake word</p>
        <h1 className="text-2xl font-bold">Laboratorio de voz</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Valida frases con wake words y detecta el comando resultante. Usa alias y un mínimo de confianza para evitar
          disparos accidentales.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-[1fr,1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Entrada de voz simulada</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <textarea
              value={phrase}
              onChange={(event) => setPhrase(event.target.value)}
              className="h-32 w-full rounded-lg border border-border bg-background/60 p-3"
              data-testid="voice-input"
            />
            <Button type="button" onClick={processPhrase} data-testid="voice-process">
              Analizar frase
            </Button>
            <div
              className={`rounded-lg border p-3 text-sm ${
                panelOpen ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
              }`}
              data-testid="voice-panel-state"
            >
              {panelState}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="voice-result">
          <CardHeader>
            <CardTitle>Resultado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            {result ? (
              <>
                <p>
                  <span className="font-semibold">Wake word detectada:</span> {result.matched ? result.wakeWord : "No"}
                </p>
                <p>
                  <span className="font-semibold">Confianza:</span> {result.confidence.toFixed(2)}
                </p>
                <p>
                  <span className="font-semibold">Comando:</span> {result.command || "(vacío)"}
                </p>
              </>
            ) : (
              <p className="text-muted-foreground">Procesa una frase para ver el análisis.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

