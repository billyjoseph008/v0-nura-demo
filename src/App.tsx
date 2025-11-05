"use client"

import { useState } from "react"
import { Toaster } from "@/components/ui/toaster"
import Header from "@/components/Header"
import Badges from "@/components/Badges"
import CommandConsole from "@/components/CommandConsole"
import Examples from "@/components/Examples"
import Telemetry from "@/components/Telemetry"
import McpPanel from "@/components/McpPanel"
import Checklist from "@/components/Checklist"
import Footer from "@/components/Footer"
import type { NuraResult } from "@/lib/types"

export default function App() {
  const [lastResult, setLastResult] = useState<NuraResult | null>(null)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Header />

        {lastResult && (
          <div className="mb-6">
            <Badges result={lastResult} />
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <CommandConsole onResult={setLastResult} />
            <Examples onResult={setLastResult} />
            <Checklist />
          </div>

          <div className="space-y-6">
            <Telemetry lastResult={lastResult} />
            <McpPanel />
          </div>
        </div>

        <Footer />
      </div>

      <Toaster />
    </div>
  )
}
