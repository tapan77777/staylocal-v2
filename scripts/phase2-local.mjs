// Explicitly isolated fixture runner. Never reads production credentials or executes a remote write.
import fs from 'node:fs'
import { randomBytes } from 'node:crypto'
import { spawn } from 'node:child_process'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
const url = 'postgresql://phase2_local@127.0.0.1:55482/staylocal_phase2_fixture'
const configPath = '/tmp/staylocal-phase2-local.json'
const command = process.argv[2]
if (!['init', 'build', 'serve'].includes(command)) throw new Error('Use init, build or serve. This runner only targets the disposable loopback fixture database.')
let config
if (fs.existsSync(configPath)) config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
else { config = { url, port: 3120, email: 'phase2-admin@staylocal.test', password: randomBytes(24).toString('base64url'), secret: randomBytes(40).toString('hex') }; fs.writeFileSync(configPath, JSON.stringify(config), { mode: 0o600 }) }
if (config.url !== url || config.port !== 3120) throw new Error('Local fixture configuration mismatch.')
const env = { ...process.env, DATABASE_URL: url, TREK_SYSTEM_ENABLED: '1', TREK_WRITES_ENABLED: '1', TREK_FIXTURE_REVIEW: '1', NEXTAUTH_URL: 'http://localhost:3120', NEXTAUTH_SECRET: config.secret, NEXT_PUBLIC_SITE_URL: 'http://localhost:3120', BLOB_READ_WRITE_TOKEN: '', UNIVERSAL_TRIPS_ENABLED: '0', VERCEL: '', VERCEL_ENV: '' }
if (command === 'init') {
  const db = new PrismaClient({ datasources: { db: { url } } })
  try {
    if (await db.user.count() || await db.trip.count()) throw new Error('Fixture database is not empty. Refusing to overwrite any existing record.')
    await db.user.create({ data: { name: 'Local Phase 2 reviewer', email: config.email, password: await bcrypt.hash(config.password, 12), role: 'admin' } })
    const snapshot = JSON.parse(fs.readFileSync('artifacts/homepage-restoration/reference-data.json', 'utf8'))
    for (const trip of snapshot.trips) {
      const { id, createdAt, updatedAt, priceOnRequest, packages, ...fields } = trip
      void id; void priceOnRequest; void packages
      const row = await db.trip.create({ data: { ...fields, createdAt: new Date(createdAt), updatedAt: new Date(updatedAt) } })
      if (trip.slug.includes('kashmir')) {
        const detail = JSON.parse(fs.readFileSync('artifacts/phase2/kashmir-public-snapshot.json', 'utf8'))
        if (detail.slug !== trip.slug || !Array.isArray(detail.packages) || !detail.packages.length) throw new Error('A real public Kashmir snapshot is required; do not fabricate tour data.')
        for (const pkg of detail.packages) {
          const { id: originalPackageId, tripId: originalTripId, createdAt: packageCreated, updatedAt: packageUpdated, ...packageFields } = pkg
          void originalPackageId; void originalTripId
          await db.tripPackage.create({ data: { ...packageFields, tripId: row.id, createdAt: new Date(packageCreated), updatedAt: new Date(packageUpdated) } })
        }
      }
    }
    for (const exp of snapshot.experiences) { const { id, ...fields } = exp; void id; await db.experience.create({ data: fields }) }
    console.log('Isolated local fixture accounts and public legacy snapshots created. No trek was published or production record changed. Credentials are in /tmp/staylocal-phase2-local.json (private local file).')
  } finally { await db.$disconnect() }
} else {
  const child = spawn('npm', command === 'build' ? ['run', 'build', '--', '--webpack'] : ['run', 'start', '--', '--hostname', 'localhost', '--port', '3120'], { env, stdio: 'inherit' })
  child.on('exit', code => process.exit(code ?? 1))
}
