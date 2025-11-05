"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { eventBus, formatEvent } from "@/lib/telemetry"
import { nuraClient } from "@/lib/nuraClient"
import type { NuraResult, TelemetryEvent } from "@/lib/types"

interface TelemetryProps {
  lastResult: NuraResult | null
}

export default function Telemetry({ lastResult }: TelemetryProps) {
  const [events, setEvents] = useState<TelemetryEvent[]>([])

  useEffect(() => {
    const handler = () => {
      setEvents(eventBus.getEvents())
    }

    eventBus.on("*", handler)
    return () => eventBus.off("*", handler)
  }, [])

  const handleClear = () => {
    eventBus.clear()
    setEvents([])
  }

  const ranking = lastResult ? nuraClient.getLastRanking() : []

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Telemetry & Ranking</CardTitle>
            <CardDescription>Real-time events and intent matching</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClear}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="ranking">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ranking">Ranking</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
          </TabsList>

          <TabsContent value="ranking" className="mt-4">
            <div className="max-h-96 overflow-auto rounded-lg border bg-muted/50 p-4">
              {ranking.length > 0 ? (
                <pre className="font-mono text-xs text-foreground">{JSON.stringify(ranking, null, 2)}</pre>
              ) : (
                <p className="text-sm text-muted-foreground">No ranking data yet. Run a command to see results.</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="events" className="mt-4">
            <div className="max-h-96 overflow-auto rounded-lg border bg-muted/50 p-4">
              {events.length > 0 ? (
                <div className="space-y-4 font-mono text-xs text-foreground">
                  {events.map((event, index) => (
                    <div key={index} className="border-b border-border pb-2 last:border-0">
                      {formatEvent(event)}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No events yet. Interact with the app to see telemetry.</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
