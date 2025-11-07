"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Mic, MicOff, Play, Info, Sparkles } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { nuraClient } from "@/lib/nuraClient"
import { createSpeechRecognition, getLocaleCode, isSpeechRecognitionSupported, type SpeechRecognition } from "@/lib/speech"
import type { NuraResult, Locale, FuzzyStrategy } from "@/lib/types"

interface CommandConsoleProps {
  onResult: (result: NuraResult) => void
  explainMode: boolean
  onExplainModeChange: (value: boolean) => void
  onOpenCapabilities: () => void
  onCommandExecuted?: (command: string, source: "manual" | "voice") => void
  listenForConfirmation?: boolean
}

export default function CommandConsole({
  onResult,
  explainMode,
  onExplainModeChange,
  onOpenCapabilities,
  onCommandExecuted,
  listenForConfirmation = false,
}: CommandConsoleProps) {
  const [utterance, setUtterance] = useState("")
  const [isListening, setIsListening] = useState(false)
  const [threshold, setThreshold] = useState(0.7)
  const [strategy, setStrategy] = useState<FuzzyStrategy>("hybrid")
  const [locale, setLocale] = useState<Locale>("auto")
  const [lastCommand, setLastCommand] = useState("")
  const [lastResultText, setLastResultText] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const { toast } = useToast()
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  const runCommand = useCallback(
    async (command: string, source: "manual" | "voice" = "manual") => {
      const trimmed = command.trim()
      if (!trimmed) return

      setUtterance(trimmed)
      setIsProcessing(true)
      nuraClient.setThreshold(threshold)
      nuraClient.setStrategy(strategy)
      nuraClient.setLocale(locale)
      nuraClient.setExplainMode(explainMode)

      try {
        const result = await nuraClient.process(trimmed)
        onResult(result)
        setLastCommand(trimmed)
        onCommandExecuted?.(trimmed, source)

        if (explainMode) {
          setLastResultText("Explain mode: No action executed")
        } else if (result.intent) {
          setLastResultText(
            `Executed: ${result.intent}${result.payload ? ` with ${JSON.stringify(result.payload)}` : ""}`,
          )
        } else {
          setLastResultText("No match found")
        }

        toast({
          title: explainMode ? "Explained" : source === "voice" ? "Voice command executed" : "Processed",
          description: `Intent: ${result.intent || "none"} (${result.confidence.toFixed(2)})`,
        })
      } finally {
        setIsProcessing(false)
      }
    },
    [explainMode, locale, onCommandExecuted, onResult, strategy, threshold, toast],
  )

  const handleManualRun = () => {
    void runCommand(utterance, "manual")
  }

  const stopListening = () => {
    try {
      recognitionRef.current?.stop()
    } catch {
      // noop
    }
    setIsListening(false)
  }

  const startListening = () => {
    if (!isSpeechRecognitionSupported()) {
      toast({
        title: "Not Supported",
        description: "Speech recognition is not supported in this browser",
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
      setUtterance(transcript)
      setIsListening(false)
      void runCommand(transcript, "voice")
    }

    recognition.onerror = () => {
      setIsListening(false)
      toast({
        title: "Error",
        description: "Speech recognition error",
        variant: "destructive",
      })
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.start()
    setIsListening(true)
  }

  const toggleListening = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  useEffect(() => {
    if (listenForConfirmation) {
      // Auto-start listening when a confirmation dialog is open
      startListening()
    } else if (isListening) {
      // Stop listening once confirmation flow ends
      stopListening()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listenForConfirmation])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>Command Console</CardTitle>
            <CardDescription>Type or speak your commands</CardDescription>
          </div>
          <div
            className="hidden items-center gap-2 rounded-full border border-dashed border-primary bg-primary/10 px-3 py-1 text-xs font-medium text-primary sm:flex"
            aria-hidden={!isListening}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Ready to listen
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" data-testid="capabilities-open" onClick={onOpenCapabilities}>
            Help & Capabilities
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => setUtterance("ok nura muestra capacidades")}
          >
            Prefill help phrase
          </Button>
        </div>

        <div className="space-y-2">
          <Label htmlFor="command-input" className="flex items-center gap-2 text-sm font-medium">
            <Mic className="h-4 w-4" />
            Say "ok nura" or type the action you want to execute
          </Label>
          <div className="flex gap-2">
            <Input
              id="command-input"
              placeholder="ok nura abre el menú de órdenes"
              value={utterance}
              onChange={(e) => setUtterance(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handleManualRun()
                }
              }}
              className="flex-1"
              disabled={isProcessing}
            />
            <Button
              onClick={toggleListening}
              variant={isListening ? "destructive" : "outline"}
              size="icon"
              aria-pressed={isListening}
              aria-label={isListening ? "Stop listening" : "Start listening"}
              disabled={isProcessing}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
            <Button onClick={handleManualRun} size="icon" disabled={isProcessing} aria-label="Run command">
              <Play className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div
          className="relative overflow-hidden rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-3">
            <span className="relative flex h-4 w-4">
              <span
                className={`absolute inline-flex h-full w-full rounded-full bg-primary/60 ${
                  isListening ? "animate-ping" : ""
                }`}
              />
              <span className="relative inline-flex h-4 w-4 rounded-full bg-primary" />
            </span>
            <span className="font-medium">
              {isListening
                ? "Listening... your command will run automatically when you finish speaking"
                : "Tap the microphone to speak. Voice commands execute instantly now."}
            </span>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="threshold">Threshold: {threshold.toFixed(2)}</Label>
            <Slider
              id="threshold"
              min={0.5}
              max={0.95}
              step={0.05}
              value={[threshold]}
              onValueChange={([value]) => setThreshold(value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="strategy">Strategy</Label>
            <Select value={strategy} onValueChange={(value) => setStrategy(value as FuzzyStrategy)}>
              <SelectTrigger id="strategy">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="damerau">Damerau</SelectItem>
                <SelectItem value="soundex">Soundex</SelectItem>
                <SelectItem value="double-metaphone">Double Metaphone</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="locale">Locale</Label>
            <Select value={locale} onValueChange={(value) => setLocale(value as Locale)}>
              <SelectTrigger id="locale">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto</SelectItem>
                <SelectItem value="es">Spanish (ES)</SelectItem>
                <SelectItem value="en">English (EN)</SelectItem>
                <SelectItem value="es-419">Spanish (419)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="explain" className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              Explain Mode
            </Label>
            <Switch id="explain" checked={explainMode} onCheckedChange={onExplainModeChange} data-testid="explain-switch" />
          </div>
        </div>

        {isProcessing && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 animate-spin" />
            Processing command...
          </div>
        )}

        {lastCommand && (
          <div className="space-y-2 rounded-lg border bg-muted/50 p-3">
            <div className="text-sm">
              <span className="font-medium">Last command:</span> {lastCommand}
            </div>
            <div className="text-sm text-muted-foreground">{lastResultText}</div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
