// Reconstruct the historical UI on localhost. No DB connection or write routes.
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { createServer } from 'vite'
import { JSDOM } from 'jsdom'

const revision = '7305285'
const root = process.cwd()
const review = path.join(root, '.next/original-home-reference')
const source = path.join(review, 'original')
fs.mkdirSync(source, { recursive: true })
const git = name => execFileSync('git', ['show', `${revision}:${name}`], { encoding: 'utf8' })
for (const name of execFileSync('git', ['ls-tree', '-r', '--name-only', revision, 'components', 'lib'], { encoding: 'utf8' }).trim().split('\n')) {
  const destination = path.join(source, name)
  fs.mkdirSync(path.dirname(destination), { recursive: true })
  fs.writeFileSync(destination, git(name))
}
const snapshotPath = 'artifacts/homepage-restoration/reference-data.json'
let snapshot
if (fs.existsSync(snapshotPath)) snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'))
else {
  const base = process.argv[2] || 'http://127.0.0.1:3116'
  if (!['127.0.0.1', 'localhost'].includes(new URL(base).hostname)) throw new Error('Reference data must come from localhost')
  const trips = await (await fetch(`${base}/api/trips`)).json()
  const html = await (await fetch(base)).text()
  const originalHtml = '/tmp/staylocal-audit-home.html'
  const document = new JSDOM(fs.existsSync(originalHtml) ? fs.readFileSync(originalHtml, 'utf8') : html).window.document
  const founder = [...document.querySelectorAll('h2')].find(h => h.textContent.includes('actually been'))?.closest('section')
  const experiences = [...(founder?.querySelectorAll('a[href^="/trip/"]') || [])].map((a, index) => ({
    id: index + 1, slug: a.getAttribute('href').split('/').pop(), title: a.querySelectorAll('p')[0]?.textContent,
    location: a.querySelectorAll('p')[1]?.textContent, category: a.textContent.includes('🏝') ? 'Islands' : a.textContent.includes('🐘') ? 'Wildlife' : a.textContent.includes('🌿') ? 'Hills' : 'Mountains', description: '', visited: true,
  }))
  snapshot = { revision, capturedAt: new Date().toISOString(), trips, experiences, htmlClass: html.match(/<html[^>]*class="([^"]*)"/)?.[1] || '', experienceSource: fs.existsSync(originalHtml) ? 'Original read-only public HTML audit snapshot' : 'Current safe founder cards' }
  fs.mkdirSync(path.dirname(snapshotPath), { recursive: true })
  fs.writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2) + '\n')
}
const css = fs.readdirSync('.next/static/css', { recursive: true }).filter(n => n.endsWith('.css')).map(n => `<link rel="stylesheet" href="/_next/static/css/${n}">`).join('')
fs.writeFileSync(path.join(review, 'index.html'), `<html lang="en" class="${snapshot.htmlClass}"><head><meta name="viewport" content="width=device-width, initial-scale=1">${css}<title>Original StayLocal homepage — Git ${revision}</title></head><body><div id="root"></div><script type="module" src="/main.tsx"></script></body></html>`)
fs.writeFileSync(path.join(review, 'link.tsx'), `export default function Link({children,...props}){return <a {...props}>{children}</a>}`)
fs.writeFileSync(path.join(review, 'navigation.ts'), `export const usePathname=()=>'/';export const useRouter=()=>({push(url){location.assign(url)},replace(){},refresh(){}});`)
const pageSource = git('app/page.tsx')
const region = pageSource.slice(pageSource.indexOf('function regionOf'), pageSource.indexOf('export default async function'))
const names = ['Navbar', 'Hero', 'SearchBar', 'Discover', 'TravelByStyle', 'WhySection', 'HowItWorks', 'FounderSection', 'EnquiryForm', 'Footer', 'PlannerSheet']
fs.writeFileSync(path.join(review, 'main.tsx'), `import React from 'react';import{createRoot}from'react-dom/client';${names.map(n => `import ${n} from '@/components/${n}';`).join('')}const data=${JSON.stringify(snapshot)};${region}const trips=data.trips;const destinations=[...new Set(trips.map(t=>regionOf(t.location,t.category)))].map(key=>({key,label:key}));createRoot(document.getElementById('root')).render(<><Navbar/><main><Hero/><SearchBar/><Discover trips={trips} destinationTrips={trips}/><TravelByStyle/><WhySection/><HowItWorks/><FounderSection experiences={data.experiences}/><EnquiryForm trips={trips}/></main><Footer/><PlannerSheet destinations={destinations}/></>);`)
const server = await createServer({
  root: review, configFile: false, define: { 'process.env': '{}' }, esbuild: { jsx: 'automatic' },
  resolve: { alias: [{ find: 'next/link', replacement: path.join(review, 'link.tsx') }, { find: 'next/navigation', replacement: path.join(review, 'navigation.ts') }, { find: '@', replacement: source }] },
  server: { host: '127.0.0.1', port: 3117, strictPort: true, fs: { allow: [root] } },
  plugins: [{ name: 'historical-assets-only', configureServer(vite) {
    vite.middlewares.use((req, res, next) => {
      if (req.url?.startsWith('/api/')) { res.statusCode = 405; return res.end('Reference UI only') }
      if (!req.url?.startsWith('/_next/static/')) return next()
      const asset = path.resolve(root, '.next', req.url.slice('/_next/'.length).split('?')[0])
      if (!asset.startsWith(path.join(root, '.next/static/')) || !fs.existsSync(asset)) { res.statusCode = 404; return res.end() }
      res.setHeader('Content-Type', asset.endsWith('.css') ? 'text/css' : 'font/woff2')
      fs.createReadStream(asset).pipe(res)
    })
  } }],
})
await server.listen()
console.log(`Original Git ${revision} UI reference: http://127.0.0.1:3117 (public snapshot; no database or writes)`)
