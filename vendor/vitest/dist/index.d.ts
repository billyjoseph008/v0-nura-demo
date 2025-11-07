export type TestFunction = () => void | Promise<void>
export type HookFunction = () => void | Promise<void>

export interface TestReporter {
  results: {
    passed: number
    failed: number
    failures: Array<{ label: string; error: unknown }>
  }
  onTestSuccess(label: string): void
  onTestFailure(label: string, error: unknown): void
}

export declare function describe(name: string, fn: () => void): void
export declare function it(name: string, fn: TestFunction): void
export declare function test(name: string, fn: TestFunction): void
export declare namespace describe {
  const skip: (name: string, fn: () => void) => void
  const only: (name: string, fn: () => void) => void
}
export declare namespace it {
  const skip: (name: string, fn: TestFunction) => void
  const only: (name: string, fn: TestFunction) => void
}
export declare namespace test {
  const skip: (name: string, fn: TestFunction) => void
  const only: (name: string, fn: TestFunction) => void
}
export declare function beforeEach(fn: HookFunction): void
export declare function afterEach(fn: HookFunction): void

export interface Expectation<T> {
  toBe(expected: T): void
  toEqual(expected: T): void
  toMatchObject(expected: Partial<T>): void
  toBeTruthy(): void
  toContain(expected: unknown): void
  toHaveLength(expected: number): void
}

export declare function expect<T = unknown>(actual: T): Expectation<T>
export declare function resetTestState(): void
export declare function createReporter(): TestReporter
export declare function runAllSuites(reporter: TestReporter): Promise<void>
