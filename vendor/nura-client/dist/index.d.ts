export interface NuraClientOptions<T = unknown> {
  baseUrl?: string
  transport?: {
    dispatch?: (envelope: NuraEnvelope<T>) => Promise<unknown> | unknown
    sendIntent?: (envelope: NuraEnvelope<T>) => Promise<unknown> | unknown
  }
}

export interface NuraEnvelope<T = unknown> {
  event: string
  payload: T
  timestamp: number
}

export type NuraListener<T = unknown> = (envelope: NuraEnvelope<T>) => void

export declare class NuraClient<T = unknown> {
  constructor(options?: NuraClientOptions<T>)
  on(event: string, handler: NuraListener<T>): () => void
  once(event: string, handler: NuraListener<T>): () => void
  emit(event: string, payload: NuraEnvelope<T>): void
  dispatch(event: string, payload?: T): Promise<unknown>
}

export declare function createNuraClient<T = unknown>(options?: NuraClientOptions<T>): NuraClient<T>
