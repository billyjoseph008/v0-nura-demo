const rootSuites = []
const suiteStack = []

function createSuite(name) {
  return {
    name,
    tests: [],
    beforeEach: [],
    afterEach: [],
    suites: [],
  }
}

function getCurrentSuite() {
  if (suiteStack.length === 0) {
    const root = createSuite("root")
    rootSuites.push(root)
    suiteStack.push(root)
  }
  return suiteStack[suiteStack.length - 1]
}

export function resetTestState() {
  rootSuites.length = 0
  suiteStack.length = 0
}

export function describe(name, fn) {
  const parent = getCurrentSuite()
  const suite = createSuite(name)
  parent.suites.push(suite)
  suiteStack.push(suite)
  try {
    fn()
  } finally {
    suiteStack.pop()
  }
}

describe.skip = function skip(name, fn) {
  // no-op skip
}

describe.only = describe

export function it(name, fn) {
  const suite = getCurrentSuite()
  suite.tests.push({ name, fn })
}

export const test = it

it.only = it
it.skip = function skip() {}

export function beforeEach(fn) {
  getCurrentSuite().beforeEach.push(fn)
}

export function afterEach(fn) {
  getCurrentSuite().afterEach.push(fn)
}

function deepEqual(a, b) {
  if (Object.is(a, b)) return true
  if (typeof a !== typeof b) return false
  if (typeof a !== "object" || a === null || b === null) return false

  const keysA = Object.keys(a)
  const keysB = Object.keys(b)
  if (keysA.length !== keysB.length) return false
  return keysA.every((key) => deepEqual(a[key], b[key]))
}

function format(value) {
  if (typeof value === "string") return JSON.stringify(value)
  if (typeof value === "object" && value !== null) {
    return JSON.stringify(value, null, 2)
  }
  return String(value)
}

export function expect(actual) {
  return {
    toBe(expected) {
      if (!Object.is(actual, expected)) {
        throw new Error(`Expected ${format(actual)} to be ${format(expected)}`)
      }
    },
    toEqual(expected) {
      if (!deepEqual(actual, expected)) {
        throw new Error(`Expected ${format(actual)} to equal ${format(expected)}`)
      }
    },
    toMatchObject(expected) {
      if (typeof actual !== "object" || actual === null) {
        throw new Error(`Expected object to match ${format(expected)} but received ${format(actual)}`)
      }
      for (const key of Object.keys(expected)) {
        if (!deepEqual(actual[key], expected[key])) {
          throw new Error(`Expected property ${key} to equal ${format(expected[key])} but received ${format(actual[key])}`)
        }
      }
    },
    toBeTruthy() {
      if (!actual) {
        throw new Error(`Expected value to be truthy but received ${format(actual)}`)
      }
    },
    toContain(expected) {
      if (!Array.isArray(actual) && typeof actual !== "string") {
        throw new Error("toContain assertion requires an array or string")
      }
      if (!actual.includes(expected)) {
        throw new Error(`Expected ${format(actual)} to contain ${format(expected)}`)
      }
    },
    toHaveLength(expected) {
      if (!actual || typeof actual.length !== "number") {
        throw new Error(`Expected value to have length but received ${format(actual)}`)
      }
      if (actual.length !== expected) {
        throw new Error(`Expected length ${expected} but received ${actual.length}`)
      }
    },
    toBeGreaterThan(expected) {
      if (!(actual > expected)) {
        throw new Error(`Expected ${format(actual)} to be greater than ${format(expected)}`)
      }
    },
  }
}

async function runTest(fn, before, after) {
  for (const hook of before) {
    await hook()
  }
  await fn()
  for (const hook of after) {
    await hook()
  }
}

async function runSuite(suite, context = { before: [], after: [] }, reporter) {
  const nextBefore = [...context.before, ...suite.beforeEach]
  const nextAfter = [...suite.afterEach, ...context.after]

  for (const child of suite.suites) {
    await runSuite(child, { before: nextBefore, after: nextAfter }, reporter)
  }

  for (const testCase of suite.tests) {
    const label = [...collectSuiteNames(suite), testCase.name].join(" > ")
    try {
      await runTest(testCase.fn, nextBefore, nextAfter)
      reporter.onTestSuccess(label)
    } catch (error) {
      reporter.onTestFailure(label, error)
    }
  }
}

function collectSuiteNames(suite) {
  const names = []
  let current = suite
  while (current && current.name !== "root") {
    names.unshift(current.name)
    const parentIndex = rootSuites.findIndex((root) => root === current)
    if (parentIndex >= 0) break
    current = findParentSuite(current)
  }
  return names
}

function findParentSuite(target) {
  const stack = [...rootSuites]
  while (stack.length) {
    const candidate = stack.pop()
    if (candidate.suites.includes(target)) return candidate
    stack.push(...candidate.suites)
  }
  return null
}

export async function runAllSuites(reporter) {
  for (const suite of rootSuites) {
    await runSuite(suite, undefined, reporter)
  }
}

export function createReporter() {
  const results = {
    passed: 0,
    failed: 0,
    failures: [],
  }

  return {
    results,
    onTestSuccess(label) {
      results.passed += 1
      console.log(`✓ ${label}`)
    },
    onTestFailure(label, error) {
      results.failed += 1
      results.failures.push({ label, error })
      console.error(`✗ ${label}`)
      console.error(error.stack ?? String(error))
    },
  }
}

export default {
  describe,
  it,
  test,
  beforeEach,
  afterEach,
  expect,
  resetTestState,
  runAllSuites,
  createReporter,
}
