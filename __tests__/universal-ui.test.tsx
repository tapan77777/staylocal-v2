// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import UniversalTrip from '@/components/trip/UniversalTrip'
import UniversalEditor from '@/components/admin/builder/UniversalEditor'
import { prepareLegacy } from '@/lib/legacy-universal'
import { quoteOffer } from '@/lib/universal-trip'
import snapshots from './fixtures/legacy-trips.json'
const source = snapshots.find(t => t.slug === 'jibhi')!
const plan = prepareLegacy(source)
const packages = plan.packages.map((p, i) => ({ ...p, status: 'published', priceBasis: 'per person', sortOrder: i }))
afterEach(cleanup)
describe('universal trip interaction', () => {
  it('changes duration, tier and traveller count without losing the itinerary selection', async () => {
    const user = userEvent.setup()
    const initialQuotes = Object.fromEntries(packages.map(p => [p.slug, quoteOffer(plan.config, packages, p.slug, 2)]))
    render(<UniversalTrip trip={{ ...source, packages }} config={plan.config} initialQuotes={initialQuotes} preview />)
    expect(screen.getByRole('button', { name: 'Submit enquiry' }).hasAttribute('disabled')).toBe(true)
    await user.click(screen.getByRole('button', { name: /4D\/3N/ }))
    await user.click(screen.getByRole('button', { name: /Deluxe/ }))
    const people = screen.getByLabelText('Number of people')
    await user.clear(people); await user.type(people, '4')
    await waitFor(() => expect(screen.getByText('₹56,996')).toBeTruthy())
    expect(screen.queryByText(/% off/)).toBeNull()
    expect(screen.getByText('Day by day')).toBeTruthy()
  })
  it('lets an operator add durations and optional tiers without a JSON editor', async () => {
    const user = userEvent.setup(); const change = vi.fn()
    render(<UniversalEditor config={plan.config} packages={packages} onChange={change} />)
    await user.click(screen.getByRole('button', { name: '+ Add duration' }))
    expect(change.mock.calls[0][0].durations).toHaveLength(4)
    await user.click(screen.getByRole('button', { name: '+ Add tier' }))
    expect(change.mock.calls[1][0].tiers).toHaveLength(4)
    expect(screen.queryByRole('textbox', { name: /JSON/i })).toBeNull()
  })
})
