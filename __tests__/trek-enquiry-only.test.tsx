import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import fixture from './fixtures/trek-system.json'
import { trekWriteSchema, trekPublicationProblems, type TrekRecord } from '@/lib/treks/schema'
import { trekStructuredData } from '@/lib/treks/seo'
import TrekCard from '@/components/treks/TrekCard'
import TrekDetail from '@/components/treks/TrekDetail'
import TrekEnquiryForm from '@/components/treks/TrekEnquiryForm'
import TripCard from '@/components/TripCard'
import tours from './fixtures/legacy-trips.json'
vi.mock('next/navigation', () => ({ usePathname: () => '/treks' }))
// Synthetic, in-memory validation input only. Never seeded or published.
const draft = trekWriteSchema.parse({ ...fixture, startingPrice: null, departures: [], content: { ...fixture.content, fixture: false, enquiryOnly: true } })
const trek: TrekRecord = { ...draft, id: 10, packageId: 20, updatedAt: '2026-11-02T00:00:00.000Z' }
describe('explicit enquiry-only publication', () => {
  it('permits reviewed content without price or dates only when explicitly marked', () => {
    expect(trekPublicationProblems(draft)).toEqual([])
    expect(trekPublicationProblems({ ...draft, content: { ...draft.content, enquiryOnly: false } }).join(' ')).toContain('starting price')
    expect(trekWriteSchema.parse(fixture).content.enquiryOnly).toBe(false)
    expect(trekWriteSchema.safeParse({ ...draft, startingPrice: 6800 }).success).toBe(false)
  })
  it('keeps all operator and route review requirements', () => {
    expect(trekPublicationProblems({ ...draft, content: { ...draft.content, preparation: { ...draft.content.preparation, operatorVerified: false } } }).join(' ')).toContain('operator review')
    expect(trekPublicationProblems({ ...draft, content: { ...draft.content, routeVerification: { ...draft.content.routeVerification, verified: false } } }).join(' ')).toContain('Verify numerical route facts')
    expect(trekPublicationProblems({ ...draft, content: { ...draft.content, difficulty: null } }).join(' ')).toContain('difficulty')
  })
  it('never allows design fixtures to be published, even with complete review input', () => {
    const testDraft = { ...draft, content: { ...draft.content, fixture: true } }
    expect(trekWriteSchema.safeParse(testDraft).success).toBe(true)
    expect(trekPublicationProblems(testDraft)).toContain('Design fixtures must remain drafts.')
  })
})
describe('enquiry-only public presentation', () => {
  it('renders the exact message and a real WhatsApp link, without a broken quote form', () => {
    const html = renderToStaticMarkup(<TrekEnquiryForm trek={trek} />)
    expect(html).toContain('Enquire for pricing')
    expect(html).toContain('https://wa.me/919178628894?text=')
    expect(html).toContain('Enquire on WhatsApp')
    expect(html).not.toContain('<form')
    expect(html).not.toContain('Group estimate')
    expect(html).not.toContain('₹')
    const preview = renderToStaticMarkup(<TrekEnquiryForm trek={trek} preview />)
    expect(preview).not.toContain('wa.me')
    expect(preview).toContain('disabled')
  })
  it('suppresses all stale numerical prices and departure offers in cards, detail and SEO', () => {
    const stale = { ...trek, startingPrice: 6800, departures: trekWriteSchema.parse(fixture).departures }
    const card = renderToStaticMarkup(<TrekCard trek={stale} />)
    const detail = renderToStaticMarkup(<TrekDetail trek={stale} />)
    for (const html of [card, detail]) {
      expect(html).toContain('Enquire for pricing')
      expect(html).not.toContain('₹')
      expect(html).not.toContain('2027-03-10')
    }
    expect(JSON.stringify(trekStructuredData(stale))).not.toMatch(/"offers"|"price"|"availability"/)
  })
  it('updates only trek card messaging, preserving tour prices', () => {
    const source = { ...tours[0], productKind: 'TREK' as const, enquiryOnly: true, priceOnRequest: true }
    expect(renderToStaticMarkup(<TripCard trip={source} />)).toContain('Enquire for dates &amp; pricing')
    const tour = renderToStaticMarkup(<TripCard trip={{ ...source, productKind: 'TOUR', priceOnRequest: false }} />)
    expect(tour).not.toContain('Enquire for dates &amp; pricing')
    expect(tour).toContain(`₹${source.price.toLocaleString('en-IN')}`)
  })
})
