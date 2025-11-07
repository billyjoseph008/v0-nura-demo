"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Mic, MicOff, Play, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { nuraClient } from "@/lib/nuraClient"
import {
  createSpeechRecognition,
  getLocaleCode,
  isSpeechRecognitionSupported,
  type SpeechRecognition,
} from "@/lib/speech"
import type { FuzzyStrategy, Locale, NuraResult } from "@/lib/types"

interface CommandConsoleProps {
  utterance: string
  onUtteranceChange: (value: string) => void
  onResult: (result: NuraResult) => void
  explainMode: boolean
  onCommandExecuted?: (command: string, source: "manual" | "voice") => void
  listenForConfirmation?: boolean
}

export default function CommandConsole({
  utterance,
  onUtteranceChange,
  onResult,
  explainMode,
  onCommandExecuted,
  listenForConfirmation = false,
}: CommandConsoleProps) {
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [lastMessage, setLastMessage] = useState<string>("Listo para escucharte.")

  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const { toast } = useToast()

  const strategy: FuzzyStrategy = "hybrid"
  const threshold = 0.7
  const locale: Locale = "auto"

  const inputPlaceholder = explainMode
    ? "Modo explicación activo. Cuéntame qué necesitas revisar."
    : "Dime qué hacer, por ejemplo: \"abre el menú de órdenes\"."

  const updateMessage = useCallback((message: string) => {
    setLastMessage(message)
  }, [])

  const stopListening = useCallback(
    (statusMessage?: string) => {
      try {
        recognitionRef.current?.stop()
      } catch {
        // noop
      }
      recognitionRef.current = null
      setIsListening(false)
      if (statusMessage) {
        updateMessage(statusMessage)
      }
    },
    [updateMessage],
  )

  useEffect(() => {
    return () => {
      stopListening()
    }
  }, [stopListening])

  const runCommand = useCallback(
    async (command: string, source: "manual" | "voice" = "manual") => {
      const trimmed = command.trim()
      if (!trimmed) {
        updateMessage("Necesito una frase para ayudarte.")
        return
      }

      stopListening()
      setIsProcessing(true)

      nuraClient.setThreshold(threshold)
      nuraClient.setStrategy(strategy)
      nuraClient.setLocale(locale)
      nuraClient.setExplainMode(explainMode)

      try {
        const result = await nuraClient.process(trimmed)
        onResult(result)
        onCommandExecuted?.(trimmed, source)

        if (explainMode) {
          updateMessage("Modo explicación activo: solo te cuento lo que haría.")
        } else if (result.intent) {
          updateMessage("Hecho. Ya me encargué de eso.")
        } else {
          updateMessage("No encontré coincidencias, ¿probamos otra frase?")
        }
      } catch (error) {
        toast({
          title: "Ups",
          description:
            error instanceof Error ? error.message : "Algo salió mal al procesar tu solicitud.",
          variant: "destructive",
        })
        updateMessage("Hubo un problema, intenta de nuevo.")
      } finally {
        setIsProcessing(false)
      }
    },
    [
      explainMode,
      locale,
      onCommandExecuted,
      onResult,
      stopListening,
      strategy,
      threshold,
      toast,
      updateMessage,
    ],
  )

  const startListening = useCallback(() => {
    if (!isSpeechRecognitionSupported()) {
      toast({
        title: "Micrófono no disponible",
        description: "Tu navegador no soporta reconocimiento de voz todavía.",
        variant: "destructive",
      })
      return
    }

    if (isListening) return

    const recognition = createSpeechRecognition()
    if (!recognition) return

    recognitionRef.current = recognition
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = getLocaleCode(locale)

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      onUtteranceChange(transcript)
      stopListening()
      updateMessage("Gracias, estoy ejecutándolo.")
      void runCommand(transcript, "voice")
    }

    recognition.onerror = () => {
      stopListening("El micrófono tuvo un problema, intenta nuevamente.")
      toast({
        title: "Ups",
        description: "Ocurrió un problema con el micrófono.",
        variant: "destructive",
      })
    }

    recognition.onend = () => {
      stopListening()
      if (!isProcessing) {
        updateMessage("Listo para la siguiente indicación.")
      }
    }

    recognition.start()
    setIsListening(true)
    updateMessage("Te escucho, habla con calma.")
  }, [
    isListening,
    isProcessing,
    locale,
    onUtteranceChange,
    runCommand,
    stopListening,
    toast,
    updateMessage,
  ])

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening("Listo para escucharte.")
    } else {
      startListening()
    }
  }, [isListening, startListening, stopListening])

  useEffect(() => {
    if (listenForConfirmation) {
      startListening()
    } else {
      stopListening("Listo para la siguiente indicación.")
    }
  }, [listenForConfirmation, startListening, stopListening])

  return (
    <div
      data-testid="cmd-console"
      className="fixed bottom-4 left-4 z-50 w-[min(92vw,22rem)] rounded-2xl border border-[hsl(var(--border))/70] bg-[hsl(var(--card))/0.9] p-4 shadow-[0_25px_80px_rgba(99,102,241,0.35)] backdrop-blur-lg transition-all duration-500 hover:shadow-[0_35px_120px_rgba(99,102,241,0.45)]"
      role="complementary"
      aria-label="Consola de Nura"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/20 text-primary shadow-[0_0_20px_rgba(99,102,241,0.35)]">
            <Sparkles className="h-4 w-4" />
          </span>
          <div className="text-sm font-semibold text-[hsl(var(--foreground))]">Nura escucha</div>
        </div>
        <div
          className={`flex h-2 w-2 items-center justify-center rounded-full transition-all duration-300 ${
            isListening ? "bg-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.6)]" : "bg-primary/40"
          }`}
          data-voice-active={isListening ? "true" : undefined}
          aria-hidden="true"
        />
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={toggleListening}
          disabled={isProcessing}
          aria-pressed={isListening}
          aria-label={isListening ? "Detener escucha" : "Iniciar escucha"}
          data-testid="cmd-mic"
          className={`h-11 w-11 rounded-xl border-primary/60 bg-primary/10 text-primary transition-all duration-300 ${
            isListening ? "scale-95 bg-primary/20" : "hover:bg-primary/20"
          }`}
        >
          {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </Button>

        <Input
          value={utterance}
          onChange={(event) => onUtteranceChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault()
              void runCommand(utterance, "manual")
            }
          }}
          disabled={isProcessing}
          placeholder={inputPlaceholder}
          className="flex-1 rounded-xl border-transparent bg-[hsl(var(--muted))/0.4] text-sm text-[hsl(var(--foreground))] placeholder:text-muted-foreground/70 focus-visible:border-primary/40 focus-visible:ring-0"
          data-testid="cmd-input"
        />

        <Button
          type="button"
          size="icon"
          onClick={() => void runCommand(utterance, "manual")}
          disabled={isProcessing}
          aria-label="Ejecutar comando"
          data-testid="cmd-run"
          className="h-11 w-11 rounded-xl bg-primary text-primary-foreground transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(129,140,248,0.45)]"
        >
          <Play className="h-5 w-5" />
        </Button>
      </div>

      <p
        className="mt-3 rounded-xl border border-[hsl(var(--border))/60] bg-[hsl(var(--muted))/0.3] px-3 py-2 text-xs text-[hsl(var(--foreground))/0.8] transition-all duration-500"
        role="status"
        aria-live="polite"
        data-testid="cmd-msg"
      >
        {isProcessing ? "Estoy trabajando en ello…" : lastMessage}
      </p>
    </div>
  )
}
