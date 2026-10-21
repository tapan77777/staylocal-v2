// Local fixture-only review server. Never imports Prisma or authenticates remotely.
import { createServer } from 'vite'
import { build } from 'esbuild'
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
const root = process.cwd()
const review = path.join(root, '.next/universal-review')
fs.mkdirSync(review, { recursive: true })
await build({ entryPoints: ['lib/universal-trip.ts'], outfile: path.join(review, 'pricing.mjs'), bundle: true, platform: 'node', format: 'esm', packages: 'external' })
const { quoteOffer } = await import(pathToFileURL(path.join(review, 'pricing.mjs')).href)
const fixtures = JSON.parse(fs.readFileSync('artifacts/universal-trip/previews.json', 'utf8'))
const styles = fs.existsSync('.next/static/css') ? fs.readdirSync('.next/static/css').filter(p => p.endsWith('.css')).map(p => fs.readFileSync(`.next/static/css/${p}`, 'utf8')).join('') : ''
let fontCss = ''
for (const [family, name] of [['Playfair', 'ReviewSerif'], ['DM Sans', 'ReviewSans']]) {
  const faces = [...styles.matchAll(/@font-face\{([^}]+)\}/g)].filter(m => m[1].includes(family) && m[1].includes('src:url('))
  const src = faces.at(-1)?.[1].match(/url\(([^)]+)\)/)?.[1].replace(/['"]/g, '')
  if (src) fontCss += `@font-face{font-family:${name};src:url('/@fs/${src.startsWith('/_next/') ? path.join(root, '.next', src.slice('/_next/'.length)) : path.join(root, '.next/static/css', src)}');font-weight:100 900;font-style:normal;font-display:swap}`
}
fs.writeFileSync(path.join(review, 'index.html'), `<html><head><meta name="viewport" content="width=device-width, initial-scale=1"><title>StayLocal local universal review</title><style>${fontCss}:root{--font-playfair:ReviewSerif,Georgia,serif;--font-dm-sans:ReviewSans,Arial,sans-serif}body{margin:0}</style></head><body><div id="root"></div><script type="module" src="/main.tsx"></script></body></html>`)
fs.writeFileSync(path.join(review, 'link.tsx'), `export default function Link({children,...props}){return <a {...props}>{children}</a>}`)
fs.writeFileSync(path.join(review, 'navigation.ts'), `export const useRouter=()=>({push(){},refresh(){}});`)
fs.writeFileSync(path.join(review, 'main.tsx'), `import React from 'react';import{createRoot}from'react-dom/client';import UniversalTrip from '@/components/trip/UniversalTrip';import AndamanPage from '@/components/AndamanPage';import TripForm from '@/components/admin/TripForm';import{quoteOffer}from '@/lib/universal-trip';import '@/app/globals.css';const fixtures=${JSON.stringify(fixtures)};const params=new URLSearchParams(location.search);const f=fixtures.find(f=>f.trip.slug===(params.get('slug')||'jibhi'));const quotes=Object.fromEntries(f.trip.packages.map(p=>[p.slug,quoteOffer(f.config,f.trip.packages,p.slug,Math.min(2,f.config.maxPeople))]));createRoot(document.getElementById('root')).render(params.has('builder')?<TripForm trip={f.trip}/>:params.has('reference')?<AndamanPage trip={fixtures.find(f=>f.trip.slug==='andaman').trip}/>:<UniversalTrip trip={f.trip} config={f.config} initialQuotes={quotes} preview={!params.has('interactive')}/>);`)
const server = await createServer({ root: review, configFile: false, define: { 'process.env': '{}' }, esbuild: { jsx: 'automatic' }, resolve: { alias: [{find:'next/navigation',replacement:path.join(review,'navigation.ts')},{ find: 'next/link', replacement: path.join(review, 'link.tsx') }, { find: '@', replacement: root }] }, server: { host: '127.0.0.1', port: 3097, strictPort: true, fs: { allow: [root] } }, plugins: [{ name: 'fixture-quotes', configureServer(server) {
  server.middlewares.use(async (req, res, next) => {
    if (req.url?.match(/^\/api\/admin\/trips\/\d+\/universal$/)) { const f=fixtures.find(f=>f.trip.slug==='jibhi');res.setHeader('Content-Type','application/json');return res.end(JSON.stringify({available:true,config:f.config,enabled:false,expectedUpdatedAt:null})) }
    if (req.url === '/api/admin/media') {res.setHeader('Content-Type','application/json');return res.end(JSON.stringify({uploadsEnabled:false}))}
    const match = req.url?.match(/^\/api\/trips\/([a-z-]+)\/quote$/)
    if (!match || req.method !== 'POST') return next()
    let body = ''; for await (const chunk of req) { body += chunk; if (body.length > 10000) { res.statusCode = 413; return res.end() } }
    try { const input = JSON.parse(body); const f = fixtures.find(f => f.trip.slug === match[1]); const quote = quoteOffer(f.config, f.trip.packages, input.packageSlug, input.people, input.promoCode); res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(quote)) }
    catch { res.statusCode = 400; res.end(JSON.stringify({ error: 'Invalid fixture quote.' })) }
  })
} }] })
await server.listen()
console.log('Fixture-only local review: http://127.0.0.1:3097 (no database connection)')
