import { chmodSync, mkdirSync, writeFileSync } from "fs"
import { join, resolve } from "path"
import { pathToFileURL } from "url"

const tool = process.argv[2]
if (!tool) {
  console.error("Usage: node scripts/setup-test-runner.mjs <tool>")
  process.exit(1)
}

const rootDir = process.cwd()
const binDir = join(rootDir, "node_modules", ".bin")
mkdirSync(binDir, { recursive: true })

function writeExecutable(name, targetPath) {
  const executablePath = join(binDir, name)
  const moduleUrl = pathToFileURL(resolve(rootDir, targetPath)).href
  const script = `#!/usr/bin/env node\nimport('${moduleUrl}');\n`
  writeFileSync(executablePath, script, "utf8")
  chmodSync(executablePath, 0o755)

  const cmdPath = `${executablePath}.cmd`
  const windowsScript = `@ECHO OFF\r\n"%~dp0\\..\\${targetPath.replace(/\\/g, "/")}" %*\r\n`
  writeFileSync(cmdPath, windowsScript, "utf8")
}

if (tool === "vitest") {
  writeExecutable("vitest", "vendor/vitest/dist/cli.js")
} else if (tool === "playwright") {
  writeExecutable("playwright", "vendor/playwright-test/dist/cli.js")
} else {
  console.error(`Unsupported tool: ${tool}`)
  process.exit(1)
}
