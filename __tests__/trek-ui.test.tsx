// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import TrailOverview from '@/components/treks/TrailOverview'
import { trekWriteSchema } from '@/lib/treks/schema'
import fixture from './fixtures/trek-system.json'
import TrekBuilder from '@/components/admin/TrekBuilder'
import TrekOptionsEditor from '@/components/admin/TrekOptionsEditor'
import { useState } from 'react'
import { pricingOptionSchema, type PrivatePricing } from '@/lib/treks/schema'
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
    expect(screen.getByRole('heading', { name: 'Enquire for pricing' })).toBeTruthy()
    expect((screen.getByRole('button', { name: 'Enquiries disabled in preview' }) as HTMLButtonElement).disabled).toBe(true)
    expect(screen.queryByRole('link', { name: /Enquire on WhatsApp/ })).toBeNull()
  })
})
describe('package option commercial confirmation', () => {
  it('clears public confirmation on price edits, keeps costs separate and can remove an unsaved option', () => {
    function Editor() {
      const [options, setOptions] = useState([pricingOptionSchema.parse({ key: 'sankri', label: 'Sankri to Sankri', status: 'published', sellingPrice: 7200, priceVerified: true })])
      const [costs, setCosts] = useState<PrivatePricing>([{ optionKey: 'sankri', operatorNetRate: 4000 }])
      return <TrekOptionsEditor options={options} costs={costs} savedKeys={[]} departures={[]} onChange={(next, privateCosts) => { setOptions(next); setCosts(privateCosts) }}/>
    }
    render(<Editor/>)
    expect(screen.getByText('Margin: ₹3,200 per person')).toBeTruthy()
    fireEvent.change(screen.getByLabelText('Public selling price / person (INR)'), { target: { value: '7300' } })
    expect((screen.getByLabelText('This public selling price is confirmed.') as HTMLInputElement).checked).toBe(false)
    expect((screen.getByLabelText('Operator net rate / person (INR)') as HTMLInputElement).value).toBe('4000')
    expect(screen.getByText('Margin: ₹3,300 per person')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Remove unsaved option' }))
    expect(screen.queryByLabelText('Public selling price / person (INR)')).toBeNull()
  })
})
