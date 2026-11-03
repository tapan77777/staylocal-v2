import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import fixture from './fixtures/trek-system.json'
import { decodeTrekConfig, optionPackageSlug, trekWriteSchema, trekPublicationProblems } from '@/lib/treks/schema'
const mocks = vi.hoisted(() => ({ rows: vi.fn(), dates: vi.fn(), tx: vi.fn(), content: vi.fn(), pkg: vi.fn(), departure: vi.fn(), create: vi.fn(), snapshot: vi.fn() }))
vi.mock('@/lib/prisma', () => ({ prisma: { trekContent: { findMany: mocks.rows }, trekDeparture: { findMany: mocks.dates }, $transaction: mocks.tx } }))
vi.mock('next/navigation', () => ({ usePathname: () => '/treks' }))
import { getPublishedTreks } from '@/lib/treks/store'
import { saveTrekEnquiry } from '@/lib/treks/enquiry'
import TrekDetail from '@/components/treks/TrekDetail'
const option = (key: string, sellingPrice: number, priceVerified = true, status = 'published') => ({ key, label: key, sellingPrice, priceVerified, status, departureKeys: [], pickup: 'Test base', drop: 'Test base', inclusions: ['Unit test service'], exclusions: ['Unit test exclusion'] })
const input = trekWriteSchema.parse({ ...fixture, startingPrice: null, departures: [], content: { ...fixture.content, fixture: false, pricingOptions: [option('sankri', 7200), option('dehradun', 9000), option('unconfirmed', 1, false), option('retired', 10, true, 'draft')] }, privatePricing: [{ optionKey: 'sankri', operatorNetRate: 4321 }] })
const packages = input.content.pricingOptions.map((o, i) => ({ id: i + 91, tripId: 1, slug: optionPackageSlug(o.key), status: o.status, priceAdult: o.priceVerified ? o.sellingPrice : 0, priceOnRequest: !o.priceVerified, label: o.label }))
const row = { tripId: 1, packageId: 90, updatedAt: new Date('2026-11-03'), config: { storageVersion: 2, content: input.content, privatePricing: input.privatePricing }, trip: { status: 'published', title: 'Unit test trek', slug: 'unit-test', subtitle: '', location: 'Test region', packages }, package: { id: 90, status: 'published', priceAdult: 0, priceOnRequest: true, label: 'Standard' } }
beforeEach(() => {
  vi.clearAllMocks(); vi.stubEnv('TREK_SYSTEM_ENABLED', '1')
  mocks.rows.mockResolvedValue([row]); mocks.dates.mockResolvedValue([]); mocks.content.mockResolvedValue(row)
  mocks.pkg.mockResolvedValue(packages[1]); mocks.departure.mockResolvedValue(null); mocks.create.mockResolvedValue({ id: 50 })
  mocks.tx.mockImplementation(callback => callback({ trekContent: { findUnique: mocks.content }, tripPackage: { findUnique: mocks.pkg }, trekDeparture: { findUnique: mocks.departure }, booking: { findFirst: async () => null, create: mocks.create }, trekEnquiry: { create: mocks.snapshot } }))
})
afterEach(() => vi.unstubAllEnvs())
describe('trek options and private commercial data', () => {
  it('retains legacy JSON compatibility and separates the private envelope', () => {
    expect(decodeTrekConfig(fixture.content).content.pricingOptions).toEqual([])
    expect(decodeTrekConfig(row.config).privatePricing[0].operatorNetRate).toBe(4321)
  })
  it('cannot certify the original concept illustration as a verified route image', () => {
    const draft = trekWriteSchema.parse(input)
    draft.content.routeMap = { image: { src: '/treks/kedarkantha-route-concept.svg', alt: 'Concept artwork', caption: '' }, kind: 'VERIFIED', source: 'Not actual survey evidence', reviewedOn: '2026-11-03' }
    expect(trekPublicationProblems(draft).join(' ')).toContain('must remain labelled as a design concept')
  })
  it('projects only eligible confirmed public prices, never private cost or margin', async () => {
    const [publicTrek] = await getPublishedTreks()
    expect(publicTrek.startingPrice).toBe(7200)
    expect(publicTrek.options).toHaveLength(3)
    expect(publicTrek.options?.find(o => o.key === 'unconfirmed')?.sellingPrice).toBeNull()
    const serialized = JSON.stringify(publicTrek)
    expect(serialized).not.toMatch(/4321|operatorNetRate|privatePricing|margin/)
    const html = renderToStaticMarkup(<TrekDetail trek={publicTrek}/>)
    expect(html).not.toMatch(/4321|Operator net rate/)
    expect(html).toContain('7,200')
  })
  it('requires unique option/date mapping and rejects private data inside public options', () => {
    const dates = [{ ...fixture.departures[0], key: 'same' }]
    const options = input.content.pricingOptions.slice(0, 2).map(o => ({ ...o, departureKeys: ['same'] }))
    expect(trekWriteSchema.safeParse({ ...input, departures: dates, content: { ...input.content, pricingOptions: options } }).success).toBe(false)
    expect(trekWriteSchema.safeParse({ ...input, content: { ...input.content, pricingOptions: [{ ...input.content.pricingOptions[0], operatorNetRate: 1234 }] } }).success).toBe(false)
  })
  it('fails closed for a selling-price mirror mismatch in public discovery', async () => {
    const changed = structuredClone(row)
    changed.trip.packages[0].priceAdult = 1
    mocks.rows.mockResolvedValue([changed])
    const [publicTrek] = await getPublishedTreks()
    expect(publicTrek.startingPrice).toBe(9000)
    expect(publicTrek.options?.find(o => o.key === 'sankri')).toMatchObject({ sellingPrice: null, priceVerified: false })
  })
  it('quotes the selected owned option using the shared pricing engine', async () => {
    const result = await saveTrekEnquiry(1, { name: 'Unit test', phone: '9999999999', email: '', tripSlug: 'unit-test', people: 2, month: '', message: '', packageId: 92 }, undefined)
    expect(result.estimatedPrice).toBe(18000)
    expect(mocks.create.mock.calls[0][0].data.packageId).toBe(92)
    expect(mocks.snapshot.mock.calls[0][0].data.priceAdult).toBe(9000)
  })
  it('rejects foreign, retired, unconfirmed and stale-price packages', async () => {
    const data = { name: 'Unit test', phone: '9999999999', email: '', tripSlug: 'unit-test', people: 2, month: '', message: '', packageId: 92 }
    for (const pkg of [{ ...packages[1], tripId: 99 }, packages[2], packages[3], { ...packages[1], priceAdult: 1 }]) {
      mocks.pkg.mockResolvedValueOnce(pkg)
      await expect(saveTrekEnquiry(1, data, undefined)).rejects.toMatchObject({ status: 400 })
    }
    expect(mocks.create).not.toHaveBeenCalled()
  })
  it('rejects a departure from a different option on the same trek', async () => {
    mocks.departure.mockResolvedValue({ id: 'foreign-option-date', tripId: 1, key: 'other', startDate: new Date('2030-01-01'), endDate: new Date('2030-01-06'), status: 'CONFIRMED', capacity: null })
    await expect(saveTrekEnquiry(1, { name: 'Unit test', phone: '9999999999', email: '', tripSlug: 'unit-test', people: 2, month: '', message: '', packageId: 92 }, 'foreign-option-date')).rejects.toMatchObject({ status: 400 })
    expect(mocks.create).not.toHaveBeenCalled()
  })
})
