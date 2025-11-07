import React, { createContext, useContext, useMemo } from "react"
import { NuraClient, createNuraClient } from "@nura/client"

const NuraContext = createContext(null)

export function NuraProvider({ client, options, children }) {
  const value = useMemo(() => {
    if (client) return client
    return createNuraClient(options)
  }, [client, options])

  return React.createElement(NuraContext.Provider, { value }, children)
}

export function useNuraClient() {
  const context = useContext(NuraContext)
  if (!context) {
    throw new Error("useNuraClient must be used within a NuraProvider")
  }
  return context
}

export { NuraClient, createNuraClient }
