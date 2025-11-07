import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RouterLink } from "@/Router"
import { type IntentEvent, type IntentPayload } from "@nura/intents"
import { createIntentDemoSession, defaultIntent } from "./intentsDemo"

function stringifyIntent(payload: IntentPayload) {
  return JSON.stringify(payload, null, 2)
}

function parseIntent(source: string): IntentPayload {
  const parsed = JSON.parse(source) as IntentPayload
  if (typeof parsed.intent !== "string" || parsed.intent.trim() === "") {
    throw new Error("El campo intent es obligatorio")
  }
  if (!parsed.parameters || typeof parsed.parameters !== "object") {
    throw new Error("Se requiere un objeto parameters")
  }
  if (typeof (parsed.parameters as any).productId !== "number") {
    throw new Error("parameters.productId debe ser numérico")
  }
  if (typeof (parsed.parameters as any).quantity !== "number") {
    throw new Error("parameters.quantity debe ser numérico")
  }
  return parsed
}

function createSession() {
  return createIntentDemoSession()
}

export default function IntentsLab() {
  const [intentSource, setIntentSource] = useState(() => stringifyIntent(defaultIntent))
  const [events, setEvents] = useState<IntentEvent[]>([])
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<unknown>(null)
  const [session] = useState(() => createSession())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [approvalPending, setApprovalPending] = useState(false)
  const [approvalSummary, setApprovalSummary] = useState<string | null>(null)
  const [sessionStatus, setSessionStatus] = useState(session.getState().status)

  useEffect(() => {
    const dispose = session.on((event) => {
      setEvents((previous) => [...previous, event])
      setSessionStatus(event.state.status)
      if (event.type === "executed") {
        setResult(event.payload?.result ?? event.payload)
        setApprovalPending(false)
      }
      if (event.type === "approval-required") {
        const summary = event.payload?.approval?.metadata?.summary ?? "Confirmar ejecución"
        setApprovalSummary(summary)
        setApprovalPending(true)
      }
      if (event.type === "approval-granted") {
        setApprovalPending(false)
      }
      if (event.type === "rejected") {
        setApprovalPending(false)
        setResult({ ok: false, reason: event.payload?.reason })
      }
      if (event.type === "error") {
        setError(event.payload?.error?.message ?? "Error inesperado")
      }
    })
    return dispose
  }, [session])

  const resetState = useCallback(() => {
    setEvents([])
    setError(null)
    setResult(null)
    setApprovalPending(false)
    setApprovalSummary(null)
  }, [])

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault()
      resetState()
      try {
        const parsed = parseIntent(intentSource)
        setIsSubmitting(true)
        await session.start(parsed)
      } catch (intentError) {
        setError((intentError as Error).message)
      } finally {
        setIsSubmitting(false)
      }
    },
    [intentSource, resetState, session],
  )

  const handleApprove = useCallback(async () => {
    setIsSubmitting(true)
    try {
      await session.approve({ approvedBy: "labs-user" })
    } finally {
      setIsSubmitting(false)
    }
  }, [session])

  const handleReject = useCallback(async () => {
    setIsSubmitting(true)
    try {
      session.reject("rejected-by-operator")
    } finally {
      setIsSubmitting(false)
    }
  }, [session])

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
      <RouterLink to="/labs" className="text-sm text-primary/80 hover:text-primary">
        ← Volver al índice de Labs
      </RouterLink>

      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">IAE • Intent → Approval → Execute</p>
        <h1 className="text-2xl font-bold">Laboratorio de Intents</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Prueba el orquestador de intents con una validación básica de esquema y una fase de aprobación controlada.
          Envía el intent como JSON, revisa la solicitud y ejecútala para ver el resultado simulado.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-[1.1fr,0.9fr]">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Intent JSON</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <textarea
              value={intentSource}
              onChange={(event) => setIntentSource(event.target.value)}
              className="h-64 w-full rounded-lg border border-border bg-background/60 p-3 font-mono text-sm"
              data-testid="intents-json-input"
            />
            <Button type="submit" disabled={isSubmitting} data-testid="intents-submit">
              {isSubmitting ? "Procesando..." : "Enviar intent"}
            </Button>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Estado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>
                <span className="font-semibold">Fase actual:</span> {sessionStatus}
              </p>
              {approvalPending ? (
                <div className="space-y-2 rounded-lg border border-primary/40 bg-primary/5 p-3" data-testid="intents-approval">
                  <p className="text-sm font-medium text-primary">{approvalSummary}</p>
                  <div className="flex gap-2">
                    <Button type="button" onClick={handleApprove} disabled={isSubmitting} data-testid="intents-approve">
                      Aprobar
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleReject}
                      disabled={isSubmitting}
                      data-testid="intents-reject"
                    >
                      Rechazar
                    </Button>
                  </div>
                </div>
              ) : null}
              {result ? (
                <pre className="overflow-auto rounded-md bg-muted/70 p-3 text-xs" data-testid="intents-result">
                  {JSON.stringify(result, null, 2)}
                </pre>
              ) : null}
            </CardContent>
          </Card>

          <Card className="flex-1" data-testid="intents-log">
            <CardHeader>
              <CardTitle>Eventos</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2 text-xs">
                {events.map((event, index) => (
                  <li
                    key={`${event.type}-${event.timestamp}-${index}`}
                    className="rounded border border-border/60 bg-background/70 p-2"
                  >
                    <p className="font-semibold">{event.type}</p>
                    <pre className="whitespace-pre-wrap break-words text-[11px] text-muted-foreground">
                      {JSON.stringify(event.payload ?? {}, null, 2)}
                    </pre>
                  </li>
                ))}
                {events.length === 0 ? (
                  <li className="text-muted-foreground">Envía un intent para ver el log del flujo.</li>
                ) : null}
              </ol>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  )
}

