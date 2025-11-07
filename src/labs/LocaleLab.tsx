import { useCallback, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RouterLink } from "@/Router"
import { createLocaleContextManager, demoNormalizeSynonym, demoParseNumeral } from "./localeDemo"

export default function LocaleLab() {
  const [numeralInput, setNumeralInput] = useState("quince")
  const [numeralResult, setNumeralResult] = useState<number | null>(null)
  const [synonymInput, setSynonymInput] = useState("pedidos")
  const [synonymResult, setSynonymResult] = useState<string>("")
  const [contextStatus, setContextStatus] = useState<string>("Sin acción guardada")
  const [confirmationInput, setConfirmationInput] = useState("sí, elimínala")
  const contextManager = useMemo(() => createLocaleContextManager(), [])

  const handleNumeral = useCallback(() => {
    setNumeralResult(demoParseNumeral(numeralInput, "es"))
  }, [numeralInput])

  const handleSynonym = useCallback(() => {
    const result = demoNormalizeSynonym(synonymInput, "es")
    setSynonymResult(result.normalized)
  }, [synonymInput])

  const handleSaveContext = useCallback(() => {
    contextManager.saveAction("delete", {
      intent: "delete-order",
      description: "Eliminar la orden seleccionada",
      payload: { id: 15 },
    })
    setContextStatus("Acción registrada: eliminar orden #15")
  }, [contextManager])

  const handleConfirm = useCallback(() => {
    const confirmation = contextManager.maybeConfirm("delete", confirmationInput)
    if (confirmation.confirmed) {
      setContextStatus("Acción confirmada: orden eliminada")
    } else {
      setContextStatus(`Sin cambios (${confirmation.reason ?? "sin respuesta"})`)
    }
  }, [confirmationInput, contextManager])

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
      <RouterLink to="/labs" className="text-sm text-primary/80 hover:text-primary">
        ← Volver al índice de Labs
      </RouterLink>
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Locale & Context</p>
        <h1 className="text-2xl font-bold">Laboratorio de idioma y contexto</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Convierte numerales naturales, normaliza sinónimos y controla un flujo de confirmación contextual para acciones
          sensibles.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-[1fr,1fr]">
        <Card data-testid="locale-numeral">
          <CardHeader>
            <CardTitle>Numerales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <input
              value={numeralInput}
              onChange={(event) => setNumeralInput(event.target.value)}
              className="w-full rounded-lg border border-border bg-background/60 p-2"
              data-testid="locale-numeral-input"
            />
            <Button onClick={handleNumeral} data-testid="locale-numeral-button">
              Parsear (es)
            </Button>
            <div className="rounded border border-dashed border-primary/40 bg-primary/5 p-3 text-sm" data-testid="locale-numeral-result">
              {numeralResult !== null ? `Resultado: ${numeralResult}` : "Sin evaluar"}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="locale-synonym">
          <CardHeader>
            <CardTitle>Sinónimos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <input
              value={synonymInput}
              onChange={(event) => setSynonymInput(event.target.value)}
              className="w-full rounded-lg border border-border bg-background/60 p-2"
              data-testid="locale-synonym-input"
            />
            <Button onClick={handleSynonym} variant="secondary" data-testid="locale-synonym-button">
              Normalizar (es)
            </Button>
            <div className="rounded border border-border/60 bg-background/70 p-3 text-sm" data-testid="locale-synonym-result">
              {synonymResult ? `Normalizado como “${synonymResult}”` : "Sin evaluar"}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="locale-context">
        <CardHeader>
          <CardTitle>Contexto sensible</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={handleSaveContext} data-testid="locale-context-save">
              Guardar acción de borrado
            </Button>
            <input
              value={confirmationInput}
              onChange={(event) => setConfirmationInput(event.target.value)}
              className="flex-1 rounded-lg border border-border bg-background/60 p-2"
              data-testid="locale-context-input"
            />
            <Button onClick={handleConfirm} variant="outline" data-testid="locale-context-confirm">
              Confirmar
            </Button>
          </div>
          <div className="rounded-lg border border-primary/40 bg-primary/5 p-3" data-testid="locale-context-status">
            {contextStatus}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

