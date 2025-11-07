export interface HttpTransportOptions {
  baseUrl?: string
  headers?: Record<string, string>
  fetchImpl?: typeof fetch
}

export interface HttpResponse<T = unknown> {
  status: number
  ok: boolean
  data: T
}

export interface HttpTransport {
  request<T = unknown>(path: string, init?: RequestInit): Promise<HttpResponse<T>>
  post<T = unknown>(path: string, body?: unknown, init?: RequestInit): Promise<HttpResponse<T>>
  sendIntent<T = unknown>(envelope: unknown): Promise<HttpResponse<T>>
}

export declare function createHttpTransport(options?: HttpTransportOptions): HttpTransport
