import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import fixture from './fixtures/trek-system.json'
import { emptyTrek, trekWriteSchema, trekPublicationProblems, stageSchema, departureSchema, departureIsEnquirable, type TrekRecord } from '@/lib/treks/schema'
import { trekSystemEnabled, trekFixturesAllowed } from '@/lib/treks/flags'
import { safeJsonLd, trekMetadata, trekStructuredData } from '@/lib/treks/seo'
import TrekDetail from '@/components/treks/TrekDetail'
import TrekListing, { filterTreks } from '@/components/treks/TrekListing'
import ElevationProfile from '@/components/treks/ElevationProfile'
import { isDedicatedTrek } from '@/lib/discovery'
vi.mock('next/navigation', () => ({ usePathname: () => '/treks' }))
const data = trekWriteSchema.parse(fixture)
const trek: TrekRecord = { id: 10, packageId: 20, ...data, updatedAt: '2026-11-02T00:00:00.000Z' }
afterEach(() => vi.unstubAllEnvs())
describe('strict trek content and honest publication', () => {
  it('accepts partial drafts but requires reviewed content for publication', () => {
    const draft = { ...emptyTrek(), title: 'Unfinished trek', slug: 'unfinished-trek' }
    expect(trekWriteSchema.safeParse(draft).success).toBe(true)
    expect(trekPublicationProblems(draft).length).toBeGreaterThan(5)
    expect(trekPublicationProblems({ ...data, content: { ...data.content, fixture: false } })).toEqual([])
  })
  it('rejects unsupported fields, invalid media, paired-coordinate errors and duplicate stage IDs', () => {
    expect(trekWriteSchema.safeParse({ ...data, role: 'admin' }).success).toBe(false)
    expect(trekWriteSchema.safeParse({ ...data, content: { ...data.content, hero: { ...data.content.hero, src: 'javascript:alert(1)' } } }).success).toBe(false)
    expect(stageSchema.safeParse({ ...data.content.stages[0], latitude: 30, longitude: null }).success).toBe(false)
    expect(stageSchema.safeParse({ ...data.content.stages[0], latitude: 91, longitude: 45 }).success).toBe(false)
    expect(trekWriteSchema.safeParse({ ...data, content: { ...data.content, stages: [data.content.stages[0], data.content.stages[0]] } }).success).toBe(false)
  })
  it('does not allow unreviewed numerical route facts or unreviewed safety text to publish', () => {
    const value = structuredClone(data)
    value.content.routeVerification.verified = false
    value.content.preparation.operatorVerified = false
    expect(trekPublicationProblems(value).join(' ')).toContain('Verify numerical route facts')
    expect(trekPublicationProblems(value).join(' ')).toContain('operator review')
    value.content.maxAltitudeM = 2000
    expect(trekPublicationProblems(value).join(' ')).toContain('below a documented stage')
  })
  it('validates departure dates, prices, capacity and stable IDs', () => {
    expect(departureSchema.safeParse({ ...data.departures[0], endDate: '2020-01-01' }).success).toBe(false)
    expect(departureSchema.safeParse({ ...data.departures[0], startDate: '2027-02-30' }).success).toBe(false)
    expect(departureSchema.safeParse({ ...data.departures[0], priceAdult: -1 }).success).toBe(false)
    expect(departureSchema.safeParse({ ...data.departures[0], capacity: 0 }).success).toBe(false)
    expect(trekWriteSchema.safeParse({ ...data, departures: [{ ...data.departures[0], id: 'same' }, { ...data.departures[1], id: 'same' }] }).success).toBe(false)
    expect(departureIsEnquirable({ ...data.departures[0], status: 'FULL' })).toBe(false)
    expect(departureIsEnquirable({ ...data.departures[0], startDate: '2020-01-01' })).toBe(false)
  })
  it('never infers product kind from categories and gates fixtures to the exact local database', () => {
    expect(isDedicatedTrek({ category: 'Trek' })).toBe(false)
    expect(isDedicatedTrek({ category: 'Mountains', productKind: 'TREK' })).toBe(true)
    vi.stubEnv('TREK_SYSTEM_ENABLED', '')
    expect(trekSystemEnabled()).toBe(false)
    vi.stubEnv('TREK_FIXTURE_REVIEW', '1'); vi.stubEnv('VERCEL', '')
    vi.stubEnv('DATABASE_URL', 'postgresql://local@remote.example/staylocal_phase2_fixture')
    expect(trekFixturesAllowed()).toBe(false)
    vi.stubEnv('DATABASE_URL', 'postgresql://local@127.0.0.1:55482/staylocal_phase2_fixture')
    expect(trekFixturesAllowed()).toBe(true)
    vi.stubEnv('VERCEL', '1')
    expect(trekFixturesAllowed()).toBe(false)
  })
})
describe('public trek discovery and documentation', () => {
  it('filters actual records by each supported facet without inventing inventory', () => {
    expect(filterTreks([trek], { region: trek.content.region, difficulty: 'Moderate', duration: 'short', season: 'Spring', price: 'under-10000' })).toHaveLength(1)
    expect(filterTreks([trek], { season: 'Winter' })).toEqual([])
    expect(filterTreks([], {})).toEqual([])
    expect(filterTreks([trek], { duration: 'bogus' })).toEqual([])
  })
  it('renders essential detail content on the server with a route fallback and all closed-day descriptions', () => {
    const html = renderToStaticMarkup(<TrekDetail trek={trek} />)
    for (const stage of data.content.stages) expect(html).toContain(stage.description)
    expect(html).toContain('A geographic map is not available')
    expect(html).toContain('Artificial UI fixture values')
    expect(html).toContain('No seats are reserved')
    expect(html).toContain('LOCAL DESIGN FIXTURE')
    expect(html).not.toContain('application/ld+json')
  })
  it('only renders the waypoint map and elevation profile with reviewed input', () => {
    const unverified = structuredClone(trek)
    unverified.content.routeVerification.verified = false
    expect(renderToStaticMarkup(<ElevationProfile content={unverified.content} />)).not.toContain('<svg')
    const located = structuredClone(trek)
    located.content.stages[0].latitude = 0; located.content.stages[0].longitude = 0
    located.content.stages[1].latitude = 0.001; located.content.stages[1].longitude = 0.001
    const html = renderToStaticMarkup(<TrekDetail trek={located} />)
    expect(html).toContain('Interactive route waypoint overview')
    expect(html).toContain('not a navigable trail trace')
    expect(renderToStaticMarkup(<TrekDetail trek={unverified} />)).not.toContain('Interactive route waypoint overview')
  })
  it('renders real GET filter fields and a compact-card link rather than a browse carousel', () => {
    const html = renderToStaticMarkup(<TrekListing treks={[trek]} />)
    expect(html).toContain('method="get"')
    expect(html).toContain('href="/treks/pine-ridge-trek-design-fixture"')
    expect(html).toContain('name="region"')
    expect(html).not.toContain('hscroll')
    expect(renderToStaticMarkup(<TrekListing treks={[]} />)).toContain('Dedicated trek itineraries are being prepared')
  })
  it('uses canonical trek URLs, real INR offers and escaped JSON-LD without fake availability or ratings', () => {
    const actual = { ...trek, content: { ...trek.content, fixture: false } }
    expect(trekMetadata(trek).robots).toMatchObject({ index: false })
    expect(trekMetadata(actual).alternates?.canonical).toMatch(/\/treks\/pine-ridge/)
    const structured = trekStructuredData(actual)
    expect(JSON.stringify(structured)).toContain('INR')
    expect(JSON.stringify(structured)).not.toMatch(/aggregateRating|availability|InStock/)
    expect(safeJsonLd({ value: '</script><script>' })).not.toContain('</script>')
    expect(renderToStaticMarkup(<TrekDetail trek={actual} />)).toContain('application/ld+json')
  })
})
