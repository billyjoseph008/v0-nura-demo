#!/usr/bin/env node
import fs from "fs"
import { promises as fsp } from "fs"
import path from "path"
import Module from "module"
import ts from "typescript"
import {
  resetTestState,
  runAllSuites,
  createReporter,
} from "./index.js"

const require = Module.createRequire(import.meta.url)
const registeredExtensions = new Set()
let aliasesPatched = false

function registerAliases() {
  if (aliasesPatched) return
  const rootDir = process.cwd()
  const aliasMap = new Map([
    ["@/", path.join(rootDir, "src") + path.sep],
    ["@nura/core", path.join(rootDir, "vendor/nura-core/dist/index.js")],
    ["@nura/client", path.join(rootDir, "vendor/nura-client/dist/index.js")],
    ["@nura/react", path.join(rootDir, "vendor/nura-react/dist/index.js")],
    ["@nura/transport-http", path.join(rootDir, "vendor/nura-transport-http/dist/index.js")],
    ["@nura/intents", path.join(rootDir, "vendor/nura-intents/dist/index.js")],
    ["vitest", path.join(rootDir, "vendor/vitest/dist/index.js")],
    ["@playwright/test", path.join(rootDir, "vendor/playwright-test/dist/index.js")],
    ["@axe-core/playwright", path.join(rootDir, "vendor/axe-core-playwright/dist/index.js")],
  ])

  const originalResolve = Module._resolveFilename
  Module._resolveFilename = function patchedResolve(request, parent, isMain, options) {
    if (request.startsWith("@/")) {
      const resolved = path.join(aliasMap.get("@/"), request.slice(2))
      return originalResolve(resolved, parent, isMain, options)
    }
    if (aliasMap.has(request)) {
      return originalResolve(aliasMap.get(request), parent, isMain, options)
    }
    return originalResolve(request, parent, isMain, options)
  }

  aliasesPatched = true
}

function registerTypeScript() {
  if (registeredExtensions.size > 0) return
  const compile = (module, filename) => {
    const source = fs.readFileSync(filename, "utf8")
    const { outputText } = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        jsx: ts.JsxEmit.React,
        esModuleInterop: true,
        resolveJsonModule: true,
      },
      fileName: filename,
    })
    module._compile(outputText, filename)
  }

  const extensions = [".ts", ".tsx"]
  for (const extension of extensions) {
    Module._extensions[extension] = compile
    registeredExtensions.add(extension)
  }
}

function matchesTest(file) {
  return /\.(spec|test)\.(ts|tsx|js|jsx|mjs|cjs)$/.test(file)
}

async function collectTests(targets) {
  const files = []

  async function walk(current) {
    let stat
    try {
      stat = await fsp.stat(current)
    } catch (error) {
      return
    }

    if (stat.isDirectory()) {
      if (path.basename(current) === "node_modules") return
      const entries = await fsp.readdir(current)
      await Promise.all(entries.map((entry) => walk(path.join(current, entry))))
      return
    }

    if (stat.isFile() && matchesTest(current)) {
      files.push(current)
    }
  }

  for (const target of targets) {
    await walk(target)
  }

  files.sort()
  return files
}

async function runFiles(files, options) {
  const rootDir = options.rootDir
  let totalPassed = 0
  let totalFailed = 0
  const failures = []

  for (const file of files) {
    console.log(`\n▶ ${path.relative(rootDir, file)}`)
    resetTestState()
    delete require.cache[file]
    registerTypeScript()
    registerAliases()
    require(file)
    const reporter = createReporter()
    await runAllSuites(reporter)
    totalPassed += reporter.results.passed
    totalFailed += reporter.results.failed
    failures.push(...reporter.results.failures)
  }

  console.log(`\nSummary: ${totalPassed} passed, ${totalFailed} failed`)
  if (failures.length > 0) {
    process.exitCode = 1
  }
}

async function main() {
  const args = process.argv.slice(2)
  if (args.length === 0 || args[0] === "run") {
    const targets = args.length > 1 ? args.slice(1) : ["tests"]
    const absoluteTargets = targets.map((target) => path.resolve(process.cwd(), target))
    const files = await collectTests(absoluteTargets)
    if (files.length === 0) {
      console.log("No test files found")
      return
    }
    await runFiles(files, { rootDir: process.cwd() })
    return
  }

  console.error(`Unsupported command: ${args[0]}`)
  process.exitCode = 1
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
