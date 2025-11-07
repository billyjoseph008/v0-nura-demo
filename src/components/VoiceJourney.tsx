"use client"

import { CheckCircle2, Circle, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { voiceStepMeta, voiceStepOrder, type VoiceMessage, type VoiceStepStatusMap } from "@/lib/voiceJourney"

export function VoiceJourney({
  steps,
  messages,
  onReset,
}: {
  steps: VoiceStepStatusMap
  messages: VoiceMessage[]
  onReset: () => void
}) {
  const allCompleted = voiceStepOrder.every((s) => steps[s] === "completed")

  return (
    <Card className="relative overflow-hidden border-cyan-500/30 bg-gradient-to-br from-slate-950/90 via-slate-900/80 to-blue-950/60 shadow-[0_0_50px_rgba(6,182,212,0.3)] backdrop-blur-xl">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,rgba(6,182,212,0.15),transparent_70%)]" />

      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/30 to-blue-500/30 shadow-[0_0_25px_rgba(6,182,212,0.4)] animate-pulse">
              <Sparkles className="h-5 w-5 text-cyan-200" />
            </span>
            <CardTitle className="text-xl font-bold text-white">Demo guiada por voz</CardTitle>
          </div>
          {allCompleted && (
            <Button
              size="sm"
              variant="outline"
              onClick={onReset}
              className="border-cyan-500/40 bg-cyan-900/30 text-cyan-100 hover:bg-cyan-800/50 hover:text-cyan-50 hover:border-cyan-400/60 transition-all duration-300 shadow-[0_0_20px_rgba(6,182,212,0.3)]"
            >
              Reiniciar
            </Button>
          )}
        </div>
        <CardDescription className="mt-2 text-white font-medium">
          Sigue los pasos sugeridos para vivir la experiencia playground con Nura. Cada acción por voz actualiza el
          recorrido y activa los checklists en vivo.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-3">
          {voiceStepOrder.map((stepId, idx) => {
            const status = steps[stepId]
            const meta = voiceStepMeta[stepId]
            const isCompleted = status === "completed"
            const isActive = status === "active"

            return (
              <div
                key={stepId}
                className={`group flex items-start gap-3 rounded-xl border p-4 transition-all duration-500 ${
                  isCompleted
                    ? "border-green-500/40 bg-gradient-to-r from-green-950/60 to-emerald-950/60 shadow-[0_0_25px_rgba(34,197,94,0.3)]"
                    : isActive
                      ? "animate-pulse border-cyan-500/50 bg-gradient-to-r from-slate-950/80 to-blue-950/80 shadow-[0_0_30px_rgba(6,182,212,0.4)]"
                      : "border-slate-700/50 bg-slate-950/50"
                }`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5 text-green-400 animate-bounce-once" />
                  ) : (
                    <Circle className={`h-5 w-5 ${isActive ? "text-cyan-300" : "text-slate-500"}`} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-sm font-semibold ${isCompleted ? "text-green-100" : isActive ? "text-white" : "text-slate-400"}`}
                    >
                      {meta.title}
                    </span>
                    {isCompleted && (
                      <Badge
                        variant="outline"
                        className="border-green-500/40 bg-green-900/30 text-green-200 text-xs px-2 py-0.5"
                      >
                        Listo!
                      </Badge>
                    )}
                  </div>
                  {isActive && !isCompleted && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-slate-100">{meta.description}</p>
                      <p className="text-xs text-cyan-200 italic font-medium">{meta.suggestion}</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {messages.length > 0 && (
          <div className="space-y-2 rounded-xl border border-blue-500/30 bg-gradient-to-br from-slate-950/80 to-blue-950/40 p-4 backdrop-blur-sm">
            <p className="text-xs font-semibold text-cyan-100 uppercase tracking-wide flex items-center gap-2">
              <Sparkles className="w-3 h-3" />
              Historial de conversación
            </p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`rounded-lg p-3 text-xs transition-all duration-300 ${
                    msg.role === "user"
                      ? "bg-blue-950/60 border border-blue-500/30 text-blue-50"
                      : "bg-purple-950/60 border border-purple-500/30 text-purple-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className={`font-semibold ${msg.role === "user" ? "text-blue-100" : "text-purple-100"}`}>
                      {msg.role === "user" ? "Tú" : "Nura"}
                    </span>
                    <span className="text-slate-300 text-[10px]">{msg.timestamp}</span>
                  </div>
                  <p className={msg.role === "user" ? "text-white" : "text-white"}>{msg.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {allCompleted && (
          <div className="animate-fade-in-up rounded-xl border border-green-500/40 bg-gradient-to-r from-green-950/50 to-emerald-950/50 p-4 text-center shadow-[0_0_40px_rgba(34,197,94,0.4)]">
            <Sparkles className="mx-auto mb-2 h-8 w-8 text-green-300 animate-spin-slow" />
            <p className="text-sm font-bold text-green-100">Checklist completo!</p>
            <p className="mt-1 text-xs text-green-200">
              Viviste la experiencia completa. Ahora explora libremente o reinicia el viaje.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default VoiceJourney
