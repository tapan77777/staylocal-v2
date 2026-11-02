// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import TrailOverview from '@/components/treks/TrailOverview'
import { trekWriteSchema } from '@/lib/treks/schema'
import fixture from './fixtures/trek-system.json'
import TrekBuilder from '@/components/admin/TrekBuilder'
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }), usePathname: () => '/treks' }))
afterEach(cleanup)
describe('route and itinerary selection', () => {
  it('opens the corresponding day from an interactive verified waypoint', () => {
    Element.prototype.scrollIntoView = () => {}
    const content = trekWriteSchema.parse(fixture).content
    // Synthetic unit-test coordinates only, never a public route or fixture claim.
    content.stages[0].latitude = 0; content.stages[0].longitude = 0
    content.stages[1].latitude = .001; content.stages[1].longitude = .001
    render(<TrailOverview content={content} />)
    fireEvent.click(screen.getByRole('button', { name: `Show day 2: ${content.stages[1].title}` }))
    expect(screen.getByText(content.stages[1].description).closest('details')?.open).toBe(true)
    expect(screen.getByText(content.stages[0].description).closest('details')?.open).toBe(false)
    fireEvent.keyDown(screen.getByRole('button', { name: `Show day 1: ${content.stages[0].title}` }), { key: 'Enter' })
    expect(screen.getByText(content.stages[0].description).closest('details')?.open).toBe(true)
  })
  it('reopens a selected stage after the reader closes its native disclosure', () => {
    Element.prototype.scrollIntoView = () => {}
    const content = trekWriteSchema.parse(fixture).content
    render(<TrailOverview content={content} />)
    const details = screen.getByText(content.stages[0].description).closest('details')!
    expect(details.open).toBe(true)
    details.open = false
    fireEvent.click(screen.getByRole('button', { name: new RegExp(content.stages[0].campsite) }))
    expect(details.open).toBe(true)
  })
})
describe('enquiry-only Trek Builder setting', () => {
  it('explicitly marks the draft and clears the price without enabling preview enquiries', () => {
    const input = trekWriteSchema.parse({ ...fixture, content: { ...fixture.content, fixture: false } })
    render(<TrekBuilder initial={{ ...input, id: 10, packageId: 20, updatedAt: '2026-11-02T00:00:00.000Z' }} writeEnabled />)
    fireEvent.click(screen.getByRole('button', { name: /Departures & pricing/ }))
    const price = screen.getByLabelText('Starting price per person (INR)') as HTMLInputElement
    expect(price.value).toBe('6800')
    fireEvent.click(screen.getByLabelText(/Enquiry-only/))
    expect(price.disabled).toBe(true)
    expect(price.value).toBe('')
    fireEvent.click(screen.getByRole('button', { name: /^Preview$/ }))
    expect(screen.getByRole('heading', { name: 'Enquire for dates & pricing' })).toBeTruthy()
    expect((screen.getByRole('button', { name: 'Enquiries disabled in preview' }) as HTMLButtonElement).disabled).toBe(true)
    expect(screen.queryByRole('link', { name: /Enquire on WhatsApp/ })).toBeNull()
  })
})
