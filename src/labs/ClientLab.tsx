import { useCallback, useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RouterLink } from "@/Router"
import { NuraProvider, useNuraClient } from "@nura/react"
import { createClient, type ClientCommand, type ClientLogEntry } from "./clientDemo"

function ClientLabPanel() {
  const client = useNuraClient()
  const [activePanel, setActivePanel] = useState<ClientCommand>("open_dashboard")
  const [log, setLog] = useState<ClientLogEntry[]>([])

  useEffect(() => {
    const dispose = client.on("intent", (envelope) => {
      const command = (envelope.payload as any)?.command ?? "close_panel"
      setActivePanel(command as ClientCommand)
      setLog((previous) => [
        {
          id: `${command}-${envelope.timestamp}`,
          command: command as ClientCommand,
          timestamp: envelope.timestamp,
        },
        ...previous,
      ])
    })
    return dispose
  }, [client])

  const dispatchCommand = useCallback(
    (command: ClientCommand) => {
      void client.dispatch("intent", { command })
    },
    [client],
  )

  const statusText = useMemo(() => {
    switch (activePanel) {
      case "open_dashboard":
        return "Dashboard activo"
      case "open_orders":
        return "Mostrando órdenes"
      default:
        return "Panel cerrado"
    }
  }, [activePanel])

  return (
    <div className="grid gap-4 md:grid-cols-[1fr,1fr]">
      <Card data-testid="client-actions">
        <CardHeader>
          <CardTitle>Disparar intents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Utiliza el dispatcher del cliente Nura para emitir intents y observar cómo los listeners reaccionan.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => dispatchCommand("open_dashboard")} data-testid="client-open-dashboard">
              Abrir dashboard
            </Button>
            <Button onClick={() => dispatchCommand("open_orders")} variant="secondary" data-testid="client-open-orders">
              Abrir órdenes
            </Button>
            <Button onClick={() => dispatchCommand("close_panel")} variant="outline" data-testid="client-close-panel">
              Cerrar panel
            </Button>
          </div>
          <div className="rounded-lg border border-primary/40 bg-primary/5 p-3 text-sm" data-testid="client-status">
            {statusText}
          </div>
        </CardContent>
      </Card>

      <Card data-testid="client-log">
        <CardHeader>
          <CardTitle>Eventos recibidos</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2 text-xs">
            {log.map((entry) => (
              <li key={entry.id} className="rounded border border-border/70 bg-background/70 p-2">
                <p className="font-semibold">{entry.command}</p>
                <p className="text-muted-foreground">{new Date(entry.timestamp).toLocaleTimeString()}</p>
              </li>
            ))}
            {log.length === 0 ? (
              <li className="text-muted-foreground">Aún no se han recibido intents.</li>
            ) : null}
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}

export default function ClientLab() {
  const [client] = useState(() => createClient())
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
      <RouterLink to="/labs" className="text-sm text-primary/80 hover:text-primary">
        ← Volver al índice de Labs
      </RouterLink>
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Client dispatcher</p>
        <h1 className="text-2xl font-bold">Laboratorio de @nura/client</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          El cliente expone una API de eventos sencilla: <code>on</code> para escuchar intents y <code>dispatch</code> para
          emitirlos. Esta demo actualiza la UI en función del intent recibido y registra el historial.
        </p>
      </header>
      <NuraProvider client={client}>
        <ClientLabPanel />
      </NuraProvider>
    </div>
  )
}

