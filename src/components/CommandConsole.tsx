"use client"

import { useState } from "react"
import { Mic, MicOff, Play, Info } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { nuraClient } from "@/lib/nuraClient"
import { createSpeechRecognition, getLocaleCode, isSpeechRecognitionSupported } from "@/lib/speech"
import type { NuraResult, Locale, FuzzyStrategy } from "@/lib/types"

interface CommandConsoleProps {
  onResult: (result: NuraResult) => void
  explainMode: boolean
  onExplainModeChange: (value: boolean) => void
  onOpenCapabilities: () => void
}

export default function CommandConsole({
  onResult,
  explainMode,
  onExplainModeChange,
  onOpenCapabilities,
}: CommandConsoleProps) {
  const [utterance, setUtterance] = useState("")
  const [isListening, setIsListening] = useState(false)
  const [threshold, setThreshold] = useState(0.7)
  const [strategy, setStrategy] = useState<FuzzyStrategy>("hybrid")
  const [locale, setLocale] = useState<Locale>("auto")
  const [lastCommand, setLastCommand] = useState("")
  const [lastResultText, setLastResultText] = useState("")
  const { toast } = useToast()

  const handleRun = async () => {
    if (!utterance.trim()) return

    nuraClient.setThreshold(threshold)
    nuraClient.setStrategy(strategy)
    nuraClient.setLocale(locale)
    nuraClient.setExplainMode(explainMode)

    const result = await nuraClient.process(utterance)
    onResult(result)
    setLastCommand(utterance)

    if (explainMode) {
      setLastResultText("Explain mode: No action executed")
    } else if (result.intent) {
      setLastResultText(`Executed: ${result.intent}${result.payload ? ` with ${JSON.stringify(result.payload)}` : ""}`)
    } else {
      setLastResultText("No match found")
    }

    toast({
      title: explainMode ? "Explained" : "Processed",
      description: `Intent: ${result.intent || "none"} (${result.confidence.toFixed(2)})`,
    })
  }

  const toggleListening = () => {
    if (!isSpeechRecognitionSupported()) {
      toast({
        title: "Not Supported",
        description: "Speech recognition is not supported in this browser",
        variant: "destructive",
      })
      return
    }

    if (isListening) {
      setIsListening(false)
      return
    }

    const recognition = createSpeechRecognition()
    if (!recognition) return

    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = getLocaleCode(locale)

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      setUtterance(transcript)
      setIsListening(false)
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Command Console</CardTitle>
        <CardDescription>Type or speak your commands</CardDescription>
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

        <div className="flex gap-2">
          <Input
            placeholder="ok nura abre el menú de órdenes"
            value={utterance}
            onChange={(e) => setUtterance(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleRun()}
            className="flex-1"
          />
          <Button onClick={toggleListening} variant={isListening ? "destructive" : "outline"} size="icon">
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
          <Button onClick={handleRun} size="icon">
            <Play className="h-4 w-4" />
          </Button>
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
