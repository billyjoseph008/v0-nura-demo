import { NuraClient } from "@nura/client"

export type ClientCommand = "open_dashboard" | "open_orders" | "close_panel"

export interface ClientLogEntry {
  id: string
  command: ClientCommand
  timestamp: number
}

export function createClient() {
  return new NuraClient({ baseUrl: "/api" })
}

export function runClientDemoSequence(commands: ClientCommand[]) {
  const client = createClient()
  const events: ClientLogEntry[] = []
  client.on("intent", (envelope) => {
    const command = (envelope.payload as any)?.command ?? "close_panel"
    events.push({ id: `${command}-${events.length}`, command: command as ClientCommand, timestamp: envelope.timestamp })
  })
  commands.forEach((command) => {
    void client.dispatch("intent", { command })
  })
  return events
}
