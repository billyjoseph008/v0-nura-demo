"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { nuraClient } from "@/lib/nuraClient"
import { eventBus, formatEvent } from "@/lib/telemetry"
import type { TelemetryEvent } from "@/lib/types"

interface TelemetryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function TelemetryModal({ open, onOpenChange }: TelemetryModalProps) {
  const [events, setEvents] = React.useState<TelemetryEvent[]>([])

  React.useEffect(() => {
    if (!open) return
    const update = () => setEvents(eventBus.getEvents())
    update()
    eventBus.on("*", update)
    return () => {
      eventBus.off("*", update)
    }
  }, [open])

  const ranking = React.useMemo(() => (open ? nuraClient.getLastRanking() : []), [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <div data-testid="telemetry-modal" className="space-y-4">
          <DialogHeader className="space-y-2">
          <DialogTitle className="text-2xl">Telemetry Overview</DialogTitle>
          <DialogDescription>Inspect similarity ranking and live event stream without leaving context.</DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="ranking" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ranking">Ranking</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
          </TabsList>

          <TabsContent value="ranking" className="mt-4">
            <div className="max-h-[45vh] overflow-auto rounded-lg border bg-[hsl(var(--muted))/0.4] p-4">
              {ranking.length > 0 ? (
                <pre className="font-mono text-xs text-[hsl(var(--foreground))]">{JSON.stringify(ranking, null, 2)}</pre>
              ) : (
                <p className="text-sm text-[hsl(var(--muted-foreground))]">Run a command to populate ranking insights.</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="events" className="mt-4">
            <div className="max-h-[45vh] overflow-auto rounded-lg border bg-[hsl(var(--muted))/0.4] p-4">
              {events.length > 0 ? (
                <div className="space-y-4 font-mono text-xs text-[hsl(var(--foreground))]">
                  {events.map((event, index) => (
                    <div key={index} className="border-b border-dashed border-[hsl(var(--border))] pb-2 last:border-0">
                      {formatEvent(event)}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[hsl(var(--muted-foreground))]">No telemetry events yet.</p>
              )}
            </div>
          </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <DialogClose className="ml-auto">Close</DialogClose>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
