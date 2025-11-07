import type { ReactNode } from "react"
import type { NuraClient, NuraClientOptions } from "@nura/client"

export interface NuraProviderProps<T = unknown> {
  client?: NuraClient<T>
  options?: NuraClientOptions<T>
  children: ReactNode
}

export declare function NuraProvider<T = unknown>(props: NuraProviderProps<T>): JSX.Element
export declare function useNuraClient<T = unknown>(): NuraClient<T>
export { NuraClient, NuraClientOptions } from "@nura/client"
