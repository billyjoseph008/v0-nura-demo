import { beforeEach, describe, expect, it } from "vitest"
import { probeSecureIntent, resetSecureIntentRateLimiter } from "@/labs/transportDemo"

describe("Secure intent endpoint", () => {
  beforeEach(() => {
    resetSecureIntentRateLimiter()
  })

  it("responde 200 con token válido", async () => {
    const response = await probeSecureIntent()
    expect(response.status).toBe(200)
    expect(response.body.ok).toBe(true)
  })

  it("aplica rate limit", async () => {
    await probeSecureIntent(undefined, { reset: true })
    await probeSecureIntent(undefined, { reset: false })
    await probeSecureIntent(undefined, { reset: false })
    const limited = await probeSecureIntent(undefined, { reset: false })
    expect(limited.status).toBe(429)
    expect(limited.body.reason).toBe("RATE_LIMITED")
  })
})
