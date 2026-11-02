import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { existsSync, readFileSync } from 'node:fs'
import snapshots from './fixtures/legacy-trips.json'
const mocks = vi.hoisted(() => ({ trips: vi.fn(), experiences: vi.fn(), catalogue: vi.fn() }))
vi.mock('@/lib/prisma', () => ({ prisma: { trip: { findMany: mocks.trips }, experience: { findMany: mocks.experiences } } }))
vi.mock('@/lib/public-catalogue', () => ({ getPublicCatalogue: mocks.catalogue }))
vi.mock('next/navigation', () => ({ usePathname: () => '/', useRouter: () => ({ push() {} }) }))
vi.mock('next/font/google', () => ({ Playfair_Display: () => ({ variable: 'playfair' }), DM_Sans: () => ({ variable: 'dm-sans' }) }))
import Home, { metadata as homeMetadata } from '@/app/page'
import { metadata as rootMetadata } from '@/app/layout'
import robots from '@/app/robots'
import { brand } from '@/lib/config'
import DiscoveryLanding from '@/components/DiscoveryLanding'
import { generateMetadata as trekMetadataFn } from '@/app/treks/page'
import { metadata as tourMetadata } from '@/app/tours/page'
import sitemap, { dynamic } from '@/app/sitemap'

beforeEach(() => {
  mocks.trips.mockReset().mockResolvedValue([])
  mocks.experiences.mockReset().mockResolvedValue([])
  mocks.catalogue.mockReset().mockResolvedValue(snapshots)
})
describe('crawlable discovery architecture', () => {
  it('uses the requested branding, live origin and inherited homepage sharing preview', () => {
    expect(brand.siteUrl).toBe(process.env.NEXT_PUBLIC_SITE_URL || 'https://staylocal.buddytechlabs.com')
    expect(rootMetadata.metadataBase?.toString()).toBe(`${brand.siteUrl}/`)
    expect(homeMetadata.title.absolute).toBe('StayLocal Trips — Treks, Tours & Travel Experiences')
    expect(homeMetadata.description).toBe('Explore Himalayan treks, curated India tours and memorable group adventures with StayLocal. Discover authentic experiences and plan your next trip.')
    expect(homeMetadata.alternates.canonical).toBe(`${brand.siteUrl}/`)
    expect(rootMetadata.openGraph?.title).toBe('StayLocal Trips — Explore More. Travel Differently.')
    expect(rootMetadata.twitter?.title).toBe(rootMetadata.openGraph?.title)
    expect(rootMetadata.openGraph?.images).toEqual([{ url: '/images/himalayan-peaks.jpg', alt: 'Himalayan mountain peaks' }])
    expect(existsSync(new URL('../public/images/himalayan-peaks.jpg', import.meta.url))).toBe(true)
    expect(robots()).toEqual({ rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api'] }], sitemap: `${brand.siteUrl}/sitemap.xml`, host: brand.siteUrl })
    expect(readFileSync(new URL('../app/icon.svg', import.meta.url), 'utf8')).toContain('<title>StayLocal Trips</title>')
    expect(existsSync(new URL('../app/favicon.ico', import.meta.url))).toBe(false)
  })
  it('renders both homepage choices and founder story with original storytelling, direct category links and no broken experience cards', async () => {
    const html = renderToStaticMarkup(await Home())
    expect(html).toContain('href="/treks"')
    expect(html).toContain('href="/tours"')
    expect(html).toContain('Tapan Naik')
    expect(html).toContain('taken the local bus')
    expect(html).toContain('id="enquiry"')
    for (const old of ['/trip/billing', '/trip/rishikesh', '/trip/simlipal', '/trip/jibhi-waterfalls']) expect(html).not.toContain(old)
    expect(html).toContain('Hand-picked trips, ready to go')
    expect(html).toContain('From first click to departure day')
    expect(html).toContain('What would you like to explore?')
    expect(html).toContain('<dialog')
    expect(html).not.toMatch(/<dialog[^>]* open/)
    expect((html.match(/<h1/g) ?? []).length).toBe(1)
  })
  it('keeps existing package URLs and labels related trekking holidays honestly', async () => {
    const html = renderToStaticMarkup(await DiscoveryLanding({ kind: 'treks' }))
    expect(html).toContain('href="/trip/jibhi"')
    expect(html).toContain('rather than dedicated trek departures')
    expect(html).not.toContain('href="/treks/jibhi"')
    const tours = renderToStaticMarkup(await DiscoveryLanding({ kind: 'tours' }))
    expect(tours).toContain('href="/trip/andaman"')
    expect(tours).toContain('href="/trip/darjeeling"')
  })
  it('retains the original founder cards only for published package destinations', async () => {
    mocks.experiences.mockResolvedValue([{ id: 1, slug: 'jibhi', title: 'Jibhi Valley', location: 'Himachal Pradesh', category: 'Mountains', description: '', visited: true }])
    const html = renderToStaticMarkup(await Home())
    expect(html).toContain('Jibhi Valley')
    expect(html).toContain('Been there')
    expect(mocks.experiences).toHaveBeenCalledWith({ where: { status: 'published', slug: { in: snapshots.map(t => t.slug) } }, orderBy: { createdAt: 'desc' } })
    for (const slug of ['billing', 'rishikesh', 'simlipal', 'jibhi-waterfalls']) expect(html).not.toContain(`href="/trip/${slug}"`)
  })
  it('lists explicit trek categories in the primary trek section only', async () => {
    mocks.catalogue.mockResolvedValue([{ ...snapshots[0], category: 'Trek', productKind: 'TREK', slug: 'actual-trek' }])
    expect(renderToStaticMarkup(await DiscoveryLanding({ kind: 'treks' }))).toContain('/trip/actual-trek')
    expect(renderToStaticMarkup(await DiscoveryLanding({ kind: 'tours' }))).not.toContain('/trip/actual-trek')
  })
  it('has distinct canonical and social metadata', async () => {
    const trekMetadata = await trekMetadataFn({ searchParams: Promise.resolve({}) })
    expect(homeMetadata.alternates?.canonical).toMatch(/\/$/)
    expect(trekMetadata.alternates?.canonical).toMatch(/\/treks$/)
    expect(tourMetadata.alternates?.canonical).toMatch(/\/tours$/)
    expect(trekMetadata.title).not.toBe(tourMetadata.title)
    expect(trekMetadata.openGraph?.images).toBeTruthy()
  })
  it('queries fresh published inventory each time, including Kashmir and both hubs', async () => {
    const updatedAt = new Date('2026-11-02')
    mocks.trips.mockResolvedValueOnce([{ slug: 'jibhi', updatedAt }]).mockResolvedValueOnce([{ slug: 'jibhi', updatedAt }, { slug: 'kashmir-valleys-lakes-mountain-escapes', updatedAt }])
    expect(dynamic).toBe('force-dynamic')
    expect((await sitemap()).some(e => e.url.includes('/trip/kashmir'))).toBe(false)
    const entries = await sitemap()
    expect(entries.every(entry => entry.url.startsWith(`${brand.siteUrl}/`))).toBe(true)
    expect(entries.some(e => e.url.endsWith('/treks'))).toBe(true)
    expect(entries.some(e => e.url.endsWith('/tours'))).toBe(true)
    expect(entries.find(e => e.url.includes('/trip/kashmir'))?.lastModified).toBe(updatedAt)
    expect(mocks.trips).toHaveBeenLastCalledWith({ where: { status: 'published' }, select: { id: true, slug: true, updatedAt: true } })
  })
  it('does not publish a silently truncated sitemap during database failure', async () => {
    mocks.trips.mockRejectedValue(new Error('Database unavailable'))
    await expect(sitemap()).rejects.toThrow('Database unavailable')
  })
})
