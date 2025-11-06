"use client"

import { useMemo } from "react"
import { Sparkles, CheckCircle2, Circle, Mic, Bot } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  type VoiceMessage,
  type VoiceStepStatusMap,
  voiceStepMeta,
  voiceStepOrder,
} from "@/lib/voiceJourney"

interface VoiceJourneyProps {
  steps: VoiceStepStatusMap
  messages: VoiceMessage[]
  onReset?: () => void
}

const statusStyles: Record<VoiceStepStatusMap[keyof VoiceStepStatusMap], string> = {
  completed: "bg-emerald-500/10 text-emerald-600 border-emerald-500/40",
  active: "bg-sky-500/10 text-sky-600 border-sky-500/40 animate-pulse",
  pending: "bg-muted text-muted-foreground border-muted/60",
}

export default function VoiceJourney({ steps, messages, onReset }: VoiceJourneyProps) {
  const renderedMessages = useMemo(() => messages.slice(-6), [messages])

  return (
    <Card className="relative overflow-hidden border-primary/20 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.28),_rgba(255,255,255,0.95))] shadow-xl shadow-primary/10">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.35),_transparent_60%)]" />
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Sparkles className="h-5 w-5" /> Demo guiada por voz
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Sigue los pasos sugeridos para vivir la experiencia playground con Nura. Cada acción por voz actualiza el recorrido y activa los checklists en vivo.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          {voiceStepOrder.map((stepId) => {
            const meta = voiceStepMeta[stepId]
            const status = steps[stepId]
            const Icon = status === "completed" ? CheckCircle2 : status === "active" ? Sparkles : Circle
            const iconClass =
              status === "completed"
                ? "text-emerald-500"
                : status === "active"
                  ? "text-sky-500 animate-pulse"
                  : "text-muted-foreground"

            return (
              <div
                key={stepId}
                className={`relative overflow-hidden rounded-2xl border p-4 transition-all duration-500 ${statusStyles[status]} ${status === "completed" ? "shadow-md shadow-emerald-500/30" : ""}`}
              >
                <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-sky-400 via-indigo-400 to-emerald-400" aria-hidden />
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-base font-semibold">
                      <Icon className={`h-4 w-4 ${iconClass}`} /> {meta.title}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{meta.description}</p>
                    <p className="mt-1 text-xs font-medium uppercase tracking-wide text-primary/70">
                      {meta.suggestion}
                    </p>
                  </div>
                  <Badge variant="outline" className="border-transparent bg-white/60 text-xs text-primary">
                    {status === "completed"
                      ? "¡Listo!"
                      : status === "active"
                        ? "En progreso"
                        : "Pendiente"}
                  </Badge>
                </div>
              </div>
            )
          })}
        </div>

        <div className="rounded-3xl border border-primary/10 bg-white/70 p-4 shadow-inner shadow-primary/5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-semibold text-primary">Chat de la demo</p>
                <p className="text-xs text-muted-foreground">Escucha y responde con tu voz, estilo playground.</p>
              </div>
            </div>
            {onReset && (
              <Button variant="ghost" size="sm" onClick={onReset} className="text-xs">
                Reiniciar
              </Button>
            )}
          </div>
          <div className="grid gap-3 text-sm">
            {renderedMessages.length === 0 && (
              <div className="flex items-center gap-2 rounded-2xl border border-dashed border-primary/30 bg-primary/5 px-3 py-2 text-primary">
                <Mic className="h-4 w-4 animate-pulse" />
                <span>Saluda con "ok nura" y dispara el primer paso.</span>
              </div>
            )}
            {renderedMessages.map((message) => (
              <div
                key={message.id}
                className={`max-w-full rounded-2xl px-3 py-2 shadow-sm shadow-primary/10 transition-all duration-300 ${message.role === "user" ? "ml-auto bg-sky-500/10 text-sky-700" : "bg-primary/10 text-primary"}`}
              >
                <div className="flex items-center justify-between gap-2 text-[10px] uppercase tracking-wide text-muted-foreground/70">
                  <span>{message.role === "user" ? "Tú" : "Nura"}</span>
                  <span>{message.timestamp}</span>
                </div>
                <p className="mt-1 text-sm font-medium leading-relaxed">{message.content}</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
