// Read-only unless BOTH explicit apply switches and a matching target fingerprint are supplied.
import fs from 'node:fs'
import { createHash } from 'node:crypto'
import { PrismaClient } from '@prisma/client'
const args = process.argv.slice(2)
const value = key => args[args.indexOf(key) + 1]
if (!args.includes('--manifest') || !args.includes('--database-id')) throw new Error('Provide --manifest and independently reviewed --database-id. Default is a dry run.')
const target = new URL(process.env.DATABASE_URL || '')
if (!['postgres:', 'postgresql:'].includes(target.protocol)) throw new Error('PostgreSQL DATABASE_URL required.')
const identity = createHash('sha256').update(`${target.hostname.toLowerCase()}:${target.port || '5432'}${target.pathname}`).digest('hex')
if (identity !== value('--database-id')) throw new Error('Target identity mismatch. Nothing was queried or written.')
const manifest = JSON.parse(fs.readFileSync(value('--manifest'), 'utf8'))
if (!Array.isArray(manifest) || manifest.length > 500 || new Set(manifest.map(m => m.tripId)).size !== manifest.length) throw new Error('Use a bounded manifest with unique Trip IDs.')
if (manifest.some(m => m.kind !== 'TOUR' || !Number.isInteger(m.tripId) || !m.expectedSlug || !m.expectedType || !Number.isInteger(m.expectedPrice))) throw new Error('Only explicit reviewed TOUR classifications are supported. Trek conversion requires its own content and URL review.')
const apply = args.includes('--apply')
if (apply && !args.includes('--approved-reviewed-target')) throw new Error('Applying requires --approved-reviewed-target after approval of the concrete dry run.')
const db = new PrismaClient()
try {
  await db.$transaction(async tx => {
    for (const item of manifest) {
      const trip = await tx.trip.findUnique({ where: { id: item.tripId }, select: { slug: true, type: true, price: true } })
      if (!trip || trip.slug !== item.expectedSlug || trip.type !== item.expectedType || trip.price !== item.expectedPrice) throw new Error(`Trip ${item.tripId} differs from its reviewed manifest. No backfill is committed.`)
      const existing = await tx.tripClassification.findUnique({ where: { tripId: item.tripId } })
      if (existing && existing.kind !== 'TOUR') throw new Error(`Trip ${item.tripId} already has a different kind.`)
      if (apply && !existing) await tx.tripClassification.create({ data: { tripId: item.tripId, kind: 'TOUR' } })
    }
  }, { isolationLevel: 'Serializable' })
  console.log(JSON.stringify({ databaseIdentity: identity, mode: apply ? 'applied' : 'dry-run', reviewedTourIds: manifest.map(m => m.tripId), changedTripScalars: false }))
} finally { await db.$disconnect() }
