import { build } from 'esbuild'
import { mkdir } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
await mkdir('.next/universal-tools', { recursive: true })
await build({ entryPoints: ['scripts/universal-backfill.ts'], outfile: '.next/universal-tools/backfill.mjs', bundle: true, platform: 'node', format: 'esm', packages: 'external' })
await import(pathToFileURL(`${process.cwd()}/.next/universal-tools/backfill.mjs`).href)
