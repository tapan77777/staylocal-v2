import fs from 'node:fs'
import { PrismaClient } from '@prisma/client'
import { stageJibhi } from '@/lib/universal-backfill'
import { prepareLegacy } from '@/lib/legacy-universal'
import { andamanDays } from './universal-source.mjs'
import { quoteOffer } from '@/lib/universal-trip'

const args = process.argv.slice(2)
const snapshotPath = args[args.indexOf('--snapshot') + 1]
if (!args.includes('--snapshot') || !snapshotPath) throw new Error('Provide --snapshot PATH (public Trip records only). Default is local report only.')
const trips = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'))
const results = trips.filter((t: { slug: string }) => ['jibhi', 'darjeeling', 'andaman'].includes(t.slug)).map((trip: any) => {
  const plan = prepareLegacy(trip, andamanDays())
  const packages = plan.packages.map(p => ({ ...p, status: 'published' }))
  let cases = 0
  for (const offer of plan.config.offers) for (let people = 1; people <= plan.config.maxPeople; people++) {
    const pkg = packages.find(p => p.slug === offer.packageSlug)!
    const d = Number(offer.durationId.split('-')[1]) - 1
    const t = Number(offer.packageSlug.split('-t')[1]) - 1
    const prices = JSON.parse(trip.pricing)
    for (const promo of trip.type === 'andaman' ? [false, true] : [false]) {
      const base = trip.type === 'andaman' ? prices.tiers[t][promo ? 'promoPrice' : 'price'][d] : prices[d][t]
      const reduction = trip.type === 'andaman' ? people === 1 ? -.15 : people <= 3 ? 0 : people <= 5 ? .05 : people <= 7 ? .1 : .15 : people >= 6 ? .1 : people >= 4 ? .05 : 0
      const expected = trip.type === 'andaman' ? Math.round(base * (1 - reduction)) * people : Math.round(base * people * (1 - reduction))
      if (quoteOffer(plan.config, packages, pkg.slug, people, promo ? prices.promoCodes[0] : '').total !== expected) throw new Error(`Pricing parity failed for ${trip.slug}.`)
      cases++
    }
  }
  return { trip, ...plan, cases }
})
if (args.includes('--apply-local')) {
  const url = new URL(process.env.DATABASE_URL ?? '')
  if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) || process.env.VERCEL || process.env.VERCEL_ENV || process.env.NODE_ENV === 'production' || process.env.CONFIRM_DISPOSABLE_LOCAL_DATABASE !== 'yes' || !/^\/staylocal_universal_[a-z0-9_]+$/.test(url.pathname) || [...url.searchParams.keys()].some(k => !['schema', 'sslmode', 'connection_limit', 'connect_timeout'].includes(k))) throw new Error('Backfill writes are restricted to a disposable local database.')
  const prisma = new PrismaClient({ log: [] })
  try {
    // Stage Jibhi drafts only. No automatic publication, price edits, or activation.
    const plan = results.find((r: any) => r.trip.slug === 'jibhi')
    if (!plan) throw new Error('Jibhi snapshot is required.')
    await prisma.$transaction(async tx => {
      await stageJibhi(tx, plan)
    }, { isolationLevel: 'Serializable' })
  } finally { await prisma.$disconnect() }
}
fs.mkdirSync('artifacts/universal-trip', { recursive: true })
fs.writeFileSync('artifacts/universal-trip/parity.json', JSON.stringify(results.map(({ trip, blockers, warnings, cases }: any) => ({ slug: trip.slug, blockers, warnings, cases, enabled: false })), null, 2))
fs.writeFileSync('artifacts/universal-trip/previews.json', JSON.stringify(results.map(({ trip, config, packages }: any) => ({ trip: { ...trip, packages: packages.map((p: any) => ({ ...p, status: 'published' })) }, config })), null, 2))
console.log(JSON.stringify(results.map(({ trip, cases, blockers }: any) => ({ slug: trip.slug, parityCases: cases, blockers })), null, 2))
