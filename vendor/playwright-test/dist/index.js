import { describe, it, expect, beforeEach, afterEach } from "../../vitest/dist/index.js"

function createTest() {
  const runner = (name, handler) => it(name, handler)
  runner.describe = describe
  runner.expect = expect
  runner.beforeEach = beforeEach
  runner.afterEach = afterEach
  return runner
}

const test = createTest()

export default test
export { describe as suite, test as test, expect, beforeEach, afterEach }
