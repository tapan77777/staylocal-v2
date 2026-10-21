import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import type { Prisma } from '@prisma/client'
import snapshots from './fixtures/legacy-trips.json'
import { prepareLegacy } from '@/lib/legacy-universal'

const mocks = vi.hoisted(() => ({ trip: vi.fn(), experience: vi.fn(), packages: vi.fn(), recent: vi.fn(), booking: vi.fn(), upsert: vi.fn(), access: vi.fn(), createTrip: vi.fn(), transaction: vi.fn(), createMany: vi.fn() }))
vi.mock('@/lib/prisma', () => ({ prisma: { trip: { findUnique: mocks.trip, create: mocks.createTrip }, tripExperience: { findUnique: mocks.experience, upsert: mocks.upsert }, tripPackage: { findMany: mocks.packages, createMany: mocks.createMany }, $transaction: mocks.transaction, booking: { findFirst: mocks.recent, create: mocks.booking } } }))
vi.mock('@/lib/admin-access', () => ({ adminAccess: mocks.access }))
import { POST as quote } from '@/app/api/trips/[slug]/quote/route'
import { POST as enquiry } from '@/app/api/bookings/route'
import { GET as adminConfig } from '@/app/api/admin/trips/[id]/universal/route'
import { loadUniversal, legacyPackages } from '@/lib/universal-store'
import { saveUniversal } from '@/lib/universal-write'
import { publicTripPrices } from '@/lib/public-trip-prices'
import { POST as createTrip } from '@/app/api/admin/trips/route'

const source = snapshots.find(t => t.slug === 'jibhi')!
const plan = prepareLegacy(source)
const packages = plan.packages.map((p, i) => ({ ...p, id: i + 1, status: 'published' }))
const trip = { ...source, packages, status: 'published' }
const version = new Date('2026-10-21T00:00:00Z')
const row = { tripId: trip.id, enabled: true, config: JSON.stringify(plan.config), updatedAt: version }
const ctx = { params: Promise.resolve({ slug: 'jibhi' }) }
const req = (body: unknown) => new NextRequest('https://staylocal.test/api/trips/jibhi/quote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
const selection = { packageSlug: packages[0].slug, people: 4, promoCode: '' }
beforeEach(() => {
  vi.resetAllMocks(); vi.stubEnv('UNIVERSAL_TRIPS_ENABLED', '1')
  mocks.trip.mockResolvedValue(trip); mocks.experience.mockResolvedValue(row); mocks.packages.mockResolvedValue(packages)
  mocks.recent.mockResolvedValue(null); mocks.booking.mockImplementation(async ({ data }) => ({ id: 1, ...data }))
  mocks.access.mockResolvedValue({ ok: true, session: { user: { role: 'admin' } } })
  mocks.transaction.mockImplementation(async callback => callback({ trip: { findUnique: mocks.trip, create: mocks.createTrip }, tripExperience: { findUnique: mocks.experience, upsert: mocks.upsert }, tripPackage: { findMany: mocks.packages, createMany: mocks.createMany } }))
})
afterEach(() => vi.unstubAllEnvs())
describe('public universal pricing API', () => {
  it('calculates a server quote', async () => {
    const response = await quote(req(selection), ctx)
    expect(response.status).toBe(200)
    expect((await response.json()).total).toBe(28500)
  })
  it.each([null, { ...trip, status: 'draft' }])('returns 404 for missing or unpublished trips', async value => {
    mocks.trip.mockResolvedValue(value)
    expect((await quote(req(selection), ctx)).status).toBe(404)
  })
  it('rejects invalid inputs, promo codes and foreign offers', async () => {
    for (const body of [{ ...selection, people: 1.5 }, { ...selection, promoCode: 'invalid' }, { ...selection, packageSlug: 'foreign' }, { ...selection, total: 1 }]) expect((await quote(req(body), ctx)).status).toBe(400)
  })
  it('does not touch the additive table when global flag is off', async () => {
    vi.stubEnv('UNIVERSAL_TRIPS_ENABLED', '')
    expect(await loadUniversal(trip)).toBeNull()
    expect(mocks.experience).not.toHaveBeenCalled()
  })
  it('protects Andaman regardless of configuration flags', async () => {
    expect(await loadUniversal({ ...trip, type: 'andaman' })).toBeNull()
    expect(mocks.experience).not.toHaveBeenCalled()
  })
  it('ignores draft offer metadata without breaking the published selection', async () => {
    const mixed = { ...trip, packages: packages.map((p, i) => ({ ...p, status: i ? 'draft' : 'published' })) }
    expect((await loadUniversal(mixed))?.offers).toHaveLength(1)
  })
  it('keeps migrated offers out of the legacy package picker', () => expect(legacyPackages(packages)).toEqual([]))
  it('uses eligible offer prices for cards and labels price-on-request without overwriting saved price', async () => {
    const [priced] = await publicTripPrices([trip])
    expect(priced.price).toBe(7500)
    expect(trip.price).toBe(15000)
    mocks.trip.mockResolvedValue({ ...trip, packages: packages.map(p => ({ ...p, priceOnRequest: true })) })
    expect((await publicTripPrices([trip]))[0].priceOnRequest).toBe(true)
  })
})
describe('server-authoritative enquiry estimates', () => {
  const body = () => ({ name: 'Fixture traveller', phone: '9999999999', tripSlug: 'jibhi', people: 4, packageId: 1, estimatedPrice: 1, universalSelection: { packageSlug: packages[0].slug, promoCode: '' } })
  it('ignores a tampered customer total and stores the server estimate', async () => {
    const response = await enquiry(req(body()))
    expect(response.status).toBe(200)
    expect((await response.json()).estimatedPrice).toBe(28500)
    expect(mocks.booking.mock.calls[0][0].data.estimatedPrice).toBe(28500)
  })
  it('rejects cross-trip package IDs and missing selections before writing', async () => {
    expect((await enquiry(req({ ...body(), packageId: 999 }))).status).toBe(400)
    expect((await enquiry(req({ ...body(), universalSelection: undefined }))).status).toBe(400)
    expect(mocks.booking).not.toHaveBeenCalled()
  })
  it('does not return a different stored quote as a duplicate success', async () => {
    mocks.recent.mockResolvedValue({ id: 9, people: 2, estimatedPrice: 15000, packageId: 1 })
    expect((await enquiry(req(body()))).status).toBe(409)
  })
  it('rejects stale universal forms after fallback activation', async () => {
    mocks.experience.mockResolvedValue({ ...row, enabled: false })
    expect((await enquiry(req(body()))).status).toBe(409)
    expect(mocks.booking).not.toHaveBeenCalled()
  })
})
describe('universal administration', () => {
  const tx = { tripExperience: { findUnique: mocks.experience, upsert: mocks.upsert }, tripPackage: { findMany: mocks.packages } } as unknown as Prisma.TransactionClient
  const write = (config = plan.config, enabled = true, expectedUpdatedAt: string | null = version.toISOString(), role = 'admin') => saveUniversal(tx, trip, { config, enabled, expectedUpdatedAt }, role, packages)
  it('denies anonymous config reads', async () => {
    mocks.access.mockResolvedValue({ ok: false, response: Response.json({ error: 'Sign in' }, { status: 401 }) })
    expect((await adminConfig(new Request('https://test'), { params: Promise.resolve({ id: '1' }) })).status).toBe(401)
    expect(mocks.experience).not.toHaveBeenCalled()
  })
  it('rejects stale versions, unsafe shapes and cross-trip references', async () => {
    await expect(write(plan.config, true, null)).rejects.toMatchObject({ status: 409 })
    await expect(saveUniversal(tx, trip, { config: 'invalid' }, 'admin')).rejects.toMatchObject({ status: 400 })
    const config = structuredClone(plan.config); config.offers[0].packageSlug = 'foreign'
    await expect(write(config)).rejects.toMatchObject({ status: 422 })
    expect(mocks.upsert).not.toHaveBeenCalled()
  })
  it('allows editor content edits but reserves activation for admin', async () => {
    await write(plan.config, true, version.toISOString(), 'editor')
    expect(mocks.upsert).toHaveBeenCalled()
    mocks.experience.mockResolvedValue({ ...row, enabled: false })
    await expect(write(plan.config, true, version.toISOString(), 'editor')).rejects.toMatchObject({ status: 403 })
  })
  it('requires admin to approve comparison pricing', async () => {
    const config = structuredClone(plan.config); config.offers[0].comparison = { price: 10000, evidence: 'reviewed-record', approved: true }
    await expect(write(config, true, version.toISOString(), 'editor')).rejects.toMatchObject({ status: 403 })
    await write(config)
    expect(mocks.upsert).toHaveBeenCalled()
  })
  it('requires explicit legacy migration confirmation before the first activation', async () => {
    mocks.experience.mockResolvedValue({ ...row, enabled: false })
    await expect(write()).rejects.toMatchObject({ status: 409 })
    await saveUniversal(tx, trip, { config: plan.config, enabled: true, expectedUpdatedAt: version.toISOString(), migrationConfirmed: true }, 'admin')
    expect(mocks.upsert).toHaveBeenCalled()
  })
  it('refuses Andaman mutation and incomplete activation', async () => {
    await expect(saveUniversal(tx, { ...trip, type: 'andaman' }, {}, 'admin')).rejects.toMatchObject({ status: 409 })
    mocks.packages.mockResolvedValue([])
    await expect(write()).rejects.toMatchObject({ status: 422 })
  })
  it('creates a new published universal trip through the existing trip API', async () => {
    mocks.experience.mockResolvedValue(null)
    mocks.createTrip.mockResolvedValue({ id: 123, type: 'calculator', status: 'published', pricing: '[]' })
    const config = { ...plan.config, offers: [plan.config.offers[0]] }
    const pkg = { ...packages[0], id: undefined }
    const response = await createTrip(req({ slug: 'universal-fixture', title: 'Fixture trip', location: 'Fixture destination', category: 'Mountains', duration: '3 days', price: 7500, image: '/fixture.jpg', status: 'published', publishConfirmed: true, packages: [pkg], universal: { config, enabled: true, expectedUpdatedAt: null } }))
    expect(response.status).toBe(200)
    expect(mocks.createMany).toHaveBeenCalled()
    expect(mocks.upsert.mock.calls[0][0].create.tripId).toBe(123)
    expect(mocks.upsert.mock.calls[0][0].create.enabled).toBe(true)
  })
})
