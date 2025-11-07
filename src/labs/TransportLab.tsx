import { useCallback, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RouterLink } from "@/Router"
import type { SecureIntentResponse } from "@/api/labs/secure-intent"
import {
  createSecureTransport,
  defaultSecureIntent,
  resetSecureIntentRateLimiter,
} from "./transportDemo"

export default function TransportLab() {
  const [logs, setLogs] = useState<SecureIntentResponse[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const transport = useMemo(() => createSecureTransport(), [])

  const triggerRequest = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await transport.post("/secure-intent", defaultSecureIntent)
      const entry: SecureIntentResponse = {
        status: response.status,
        body: (response.data as Record<string, unknown>) ?? {},
      }
      setLogs((previous) => [entry, ...previous].slice(0, 6))
      if (!response.ok) {
        setError(`El endpoint respondió ${response.status}`)
      }
    } catch (requestError) {
      setError((requestError as Error).message)
    } finally {
      setIsLoading(false)
    }
  }, [transport])

  const clearLogs = useCallback(() => {
    setLogs([])
    resetSecureIntentRateLimiter()
    setError(null)
  }, [])

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
      <RouterLink to="/labs" className="text-sm text-primary/80 hover:text-primary">
        ← Volver al índice de Labs
      </RouterLink>
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Transport HTTP</p>
        <h1 className="text-2xl font-bold">Laboratorio de transporte seguro</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Simula un endpoint protegido <code>/api/labs/secure-intent</code> con validaciones de token, esquema y rate-limit en
          memoria. Usa el dispatcher HTTP de Nura para enviar solicitudes firmadas y ver las respuestas.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1fr,1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Solicitud preparada</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <pre className="overflow-auto rounded-md bg-muted/70 p-3 text-xs" data-testid="transport-request">
              {JSON.stringify(defaultSecureIntent, null, 2)}
            </pre>
            <div className="flex gap-2">
              <Button type="button" onClick={triggerRequest} disabled={isLoading} data-testid="transport-trigger">
                {isLoading ? "Consultando..." : "Probar endpoint"}
              </Button>
              <Button type="button" variant="secondary" onClick={clearLogs} data-testid="transport-reset">
                Reiniciar
              </Button>
            </div>
            {error ? <p className="text-destructive">{error}</p> : null}
          </CardContent>
        </Card>

        <Card data-testid="transport-log">
          <CardHeader>
            <CardTitle>Historial de respuestas</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2 text-xs">
              {logs.map((entry, index) => (
                <li key={`${entry.status}-${index}`} className="rounded border border-border/70 bg-background/70 p-2">
                  <p className="font-semibold">Status {entry.status}</p>
                  <pre className="whitespace-pre-wrap break-words text-[11px] text-muted-foreground">
                    {JSON.stringify(entry.body, null, 2)}
                  </pre>
                </li>
              ))}
              {logs.length === 0 ? (
                <li className="text-muted-foreground">Aún no se han realizado solicitudes.</li>
              ) : null}
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

