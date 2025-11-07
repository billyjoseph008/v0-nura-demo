import type { TestFunction, HookFunction } from "../../vitest/dist/index.d.ts"

declare const test: {
  (name: string, fn: TestFunction): void
  describe: (name: string, fn: () => void) => void
  expect: typeof import("../../vitest/dist/index.js").expect
  beforeEach: (fn: HookFunction) => void
  afterEach: (fn: HookFunction) => void
}

export default test
export { test, HookFunction, TestFunction }
export { expect, beforeEach, afterEach, describe as suite } from "../../vitest/dist/index.js"
