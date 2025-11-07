function resolveFetch(fetchImpl) {
  if (fetchImpl) return fetchImpl
  if (typeof fetch === "function") return fetch.bind(globalThis)
  throw new Error("No fetch implementation available for @nura/transport-http")
}

export function createHttpTransport(options = {}) {
  const baseUrl = options.baseUrl ?? ""
  const fetchImpl = resolveFetch(options.fetchImpl)
  const defaultHeaders = options.headers ?? { "Content-Type": "application/json" }

  async function request(path, init = {}) {
    const response = await fetchImpl(`${baseUrl}${path}`, {
      method: "GET",
      ...init,
      headers: {
        ...defaultHeaders,
        ...(init.headers ?? {}),
      },
    })

    const contentType = response.headers?.get?.("content-type") ?? ""
    let data = null
    if (contentType.includes("application/json")) {
      data = await response.json()
    } else {
      data = await response.text()
    }

    return {
      status: response.status,
      ok: response.ok,
      data,
    }
  }

  async function post(path, body, init = {}) {
    return request(path, {
      method: "POST",
      body: JSON.stringify(body ?? {}),
      ...init,
    })
  }

  async function sendIntent(envelope) {
    return post("/secure-intent", envelope)
  }

  return {
    request,
    post,
    sendIntent,
  }
}
