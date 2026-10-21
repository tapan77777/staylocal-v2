import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'

// Offline extraction from our own reviewed source. No customer input or remote code.
export function andamanDays() {
  const source = fs.readFileSync('components/AndamanPage.tsx', 'utf8')
  const start = source.indexOf('const BASE_DAYS:')
  const end = source.indexOf('const INCLUSIONS =')
  if (start < 0 || end < start) throw new Error('Andaman source changed; review extraction before proceeding.')
  const constants = source.slice(start, end)
  const code = ts.transpileModule(`${constants}\nJSON.stringify(ITINERARIES)`, { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText
  return JSON.parse(vm.runInNewContext(code, Object.create(null), { timeout: 1000 }))
}
