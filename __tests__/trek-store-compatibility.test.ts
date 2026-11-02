import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import fixture from './fixtures/trek-system.json'
import { trekDisplayPrice, trekWriteSchema } from '@/lib/treks/schema'
const mocks = vi.hoisted(() => ({ transaction: vi.fn(), oldContent: vi.fn(), update: vi.fn(), kinds: vi.fn(), contents: vi.fn(), departures: vi.fn() }))
vi.mock('@/lib/prisma', () => ({ prisma: { $transaction: mocks.transaction, tripClassification: { findMany: mocks.kinds }, trekContent: { findMany: mocks.contents }, trekDeparture: { findMany: mocks.departures } } }))
import { getPublishedTreks, getClassifications, publicInventoryOnly, saveTrek } from '@/lib/treks/store'
const input = trekWriteSchema.parse({ ...fixture, content: { ...fixture.content, fixture: false } })
beforeEach(() => {
  vi.clearAllMocks()
  mocks.transaction.mockImplementation(callback => callback({ trekContent: { findUnique: mocks.oldContent }, trip: { update: mocks.update } }))
})
afterEach(() => vi.unstubAllEnvs())
describe('migration and compatibility boundaries', () => {
  it('makes zero new-table queries before activation', async () => {
    vi.stubEnv('TREK_SYSTEM_ENABLED', '')
    expect(await getPublishedTreks()).toEqual([])
    expect(await getClassifications([1, 2])).toEqual([])
    await expect(saveTrek(input)).rejects.toMatchObject({ status: 503 })
    expect(mocks.transaction).not.toHaveBeenCalled()
  })
  it('can suspend authoring without requiring a destructive rollback', async () => {
    vi.stubEnv('TREK_SYSTEM_ENABLED', '1'); vi.stubEnv('TREK_WRITES_ENABLED', '0')
    await expect(saveTrek(input)).rejects.toMatchObject({ status: 503 })
    expect(mocks.transaction).not.toHaveBeenCalled()
  })
  it('keeps legacy JSON compatible before activation without querying sidecars', async () => {
    vi.stubEnv('TREK_SYSTEM_ENABLED', '')
    const trips = [{ id: 1, slug: 'unchanged-tour' }]
    expect(await publicInventoryOnly(trips)).toEqual(trips)
    expect(mocks.kinds).not.toHaveBeenCalled()
    expect(mocks.contents).not.toHaveBeenCalled()
  })
  it('does not expose a classified trek missing visible real content through legacy JSON', async () => {
    vi.stubEnv('TREK_SYSTEM_ENABLED', '1')
    mocks.kinds.mockResolvedValue([{ tripId: 2, kind: 'TREK' }])
    mocks.contents.mockResolvedValue([])
    expect(await publicInventoryOnly([{ id: 1 }, { id: 2 }])).toEqual([{ id: 1 }])
  })
  it.each([true, false])('legacy JSON excludes fixture=%s while retaining real published treks', async isFixture => {
    vi.stubEnv('TREK_SYSTEM_ENABLED', '1'); vi.stubEnv('TREK_FIXTURE_REVIEW', '1'); vi.stubEnv('VERCEL', '')
    vi.stubEnv('DATABASE_URL', 'postgresql://local@127.0.0.1:55482/staylocal_phase2_fixture')
    mocks.kinds.mockResolvedValue([{ tripId: 2, kind: 'TREK' }])
    mocks.contents.mockResolvedValue([{ tripId: 2, packageId: 20, config: { ...fixture.content, fixture: isFixture }, updatedAt: new Date('2026-11-02'), trip: { title: fixture.title, slug: fixture.slug, subtitle: '', location: '', status: 'published' }, package: { priceOnRequest: false, priceAdult: 6800 } }])
    mocks.departures.mockResolvedValue([])
    expect(await publicInventoryOnly([{ id: 1 }, { id: 2 }])).toEqual(isFixture ? [{ id: 1 }] : [{ id: 1 }, { id: 2 }])
  })
  it('cannot strip the fixture marker to promote a test product', async () => {
    vi.stubEnv('TREK_SYSTEM_ENABLED', '1'); vi.stubEnv('TREK_WRITES_ENABLED', '1')
    mocks.oldContent.mockResolvedValue({ config: fixture.content, updatedAt: new Date('2026-11-02'), trip: { classification: { kind: 'TREK' }, slug: input.slug } })
    await expect(saveTrek({ ...input, expectedUpdatedAt: '2026-11-02T00:00:00.000Z' }, 10)).rejects.toMatchObject({ status: 409 })
    expect(mocks.update).not.toHaveBeenCalled()
  })
  it('rejects fixture publication before starting any write transaction', async () => {
    vi.stubEnv('TREK_SYSTEM_ENABLED', '1'); vi.stubEnv('TREK_WRITES_ENABLED', '1')
    vi.stubEnv('TREK_FIXTURE_REVIEW', '1'); vi.stubEnv('VERCEL', '')
    vi.stubEnv('DATABASE_URL', 'postgresql://local@127.0.0.1:55482/staylocal_phase2_fixture')
    await expect(saveTrek({ ...fixture, status: 'published', publishConfirmed: true })).rejects.toMatchObject({ status: 422 })
    expect(mocks.transaction).not.toHaveBeenCalled()
  })
  it('normalizes enquiry-only published reads to no price or departure inventory', async () => {
    vi.stubEnv('TREK_SYSTEM_ENABLED', '1')
    mocks.kinds.mockResolvedValue([{ tripId: 2, kind: 'TREK' }])
    mocks.contents.mockResolvedValue([{ tripId: 2, packageId: 20, config: { ...fixture.content, fixture: false, enquiryOnly: true }, updatedAt: new Date('2026-11-02'), trip: { title: fixture.title, slug: fixture.slug, subtitle: '', location: '', status: 'published' }, package: { priceOnRequest: false, priceAdult: 6800 } }])
    mocks.departures.mockResolvedValue([{ id: 'old', tripId: 2, key: 'old', startDate: new Date('2030-01-01'), endDate: new Date('2030-01-03'), status: 'CONFIRMED', priceAdult: 5000, capacity: 12, notes: '' }])
    expect((await getPublishedTreks())[0]).toMatchObject({ startingPrice: null, basePrice: null, departures: [] })
    expect(await publicInventoryOnly([{ id: 2 }])).toEqual([{ id: 2, enquiryOnly: true, priceOnRequest: true }])
  })
  it('never converts an existing tour by posting its ID to the Trek Builder', async () => {
    vi.stubEnv('TREK_SYSTEM_ENABLED', '1'); vi.stubEnv('TREK_WRITES_ENABLED', '1')
    mocks.oldContent.mockResolvedValue(null)
    await expect(saveTrek(input, 10)).rejects.toMatchObject({ status: 409 })
    expect(mocks.update).not.toHaveBeenCalled()
  })
  it('rejects stale timestamps before changing any shared Trip fields', async () => {
    vi.stubEnv('TREK_SYSTEM_ENABLED', '1'); vi.stubEnv('TREK_WRITES_ENABLED', '1')
    mocks.oldContent.mockResolvedValue({ updatedAt: new Date('2026-11-02'), trip: { classification: { kind: 'TREK' }, slug: input.slug } })
    await expect(saveTrek({ ...input, expectedUpdatedAt: '2026-01-01T00:00:00.000Z' }, 10)).rejects.toMatchObject({ status: 409 })
    expect(mocks.update).not.toHaveBeenCalled()
  })
  it('advertises lower confirmed departure prices without changing the base or using full-batch minima', () => {
    const departures = input.departures.map(d => ({ ...d, startDate: '2030-03-10', endDate: '2030-03-12' }))
    departures[0].priceAdult = 5000; departures[1].priceAdult = 1
    expect(trekDisplayPrice(6800, departures)).toEqual({ basePrice: 6800, startingPrice: 5000 })
    expect(input.startingPrice).toBe(6800)
  })
})
