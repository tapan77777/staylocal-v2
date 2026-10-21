// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import TripForm from '@/components/admin/TripForm'
import { initialBuilder, builderPayload, builderIssues, durationSummary, moveItem, slugify, type TripBuilderRecord } from '@/lib/trip-builder'

const router = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => router }))
vi.mock('next/link', () => ({ default: ({ href, children, ...props }: { href: string; children: ReactNode }) => <a href={href} {...props}>{children}</a> }))

const existing: TripBuilderRecord = {
  ...initialBuilder().form, id: 7, title: 'Existing mountain trip', slug: 'existing-mountain-trip', location: 'Mountains',
  price: 10000, image: '/travel/cover.jpg', status: 'published', duration: '1 day',
  pricing: '[ [10000] ]', durLabels: '["1D"]', durSubLabels: '["Original label"]',
  itinerary: '[[{"day":"Day 1","title":"Original title","desc":"Original description"}]]',
  updatedAt: '2026-10-20T00:00:00.000Z',
  packages: [{ id: 10, slug: 'one-day', label: 'One day', days: 1, nights: 0, priceAdult: 10000, status: 'published', itinerary: '[{"day":"Day 1","title":"Arrival","desc":"Transfers and local experiences"}]' }],
}
const writes: { url: string; body: Record<string, unknown> }[] = []

beforeEach(() => {
  vi.clearAllMocks(); writes.length = 0
  vi.spyOn(window, 'confirm').mockReturnValue(true)
  vi.stubGlobal('fetch', vi.fn(async (url: string, options?: RequestInit) => {
    if (options?.method === 'POST' || options?.method === 'PUT') {
      writes.push({ url, body: JSON.parse(options.body as string) })
      return new Response(JSON.stringify({ id: 7 }), { status: 200 })
    }
    return new Response(JSON.stringify(String(url).includes('/media') ? { uploadsEnabled: false } : String(url).endsWith('/universal') ? { available: false } : { available: true }))
  }))
})
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks() })

describe('Trip Builder interaction', () => {
  it('starts new trips in universal mode when storage is available and requires activation before publishing', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ available: true })))
    const user = userEvent.setup(); render(<TripForm />)
    await user.click(screen.getByRole('button', { name: /Packages & Itinerary/ }))
    await screen.findByRole('heading', { name: 'Durations, experiences & offers' })
    await user.click(screen.getByRole('button', { name: /Review & Publish/ }))
    expect(screen.getByText('An administrator must activate the universal experience before this new trip is published.')).toBeTruthy()
    expect(screen.getByRole('button', { name: /Publish trip/ }).hasAttribute('disabled')).toBe(true)
  })
  it('creates a draft with an automatic editable slug and retains values across steps', async () => {
    const user = userEvent.setup(); render(<TripForm />)
    await user.type(screen.getByLabelText(/Trip title/), 'A Quiet Valley')
    await user.type(screen.getByLabelText('Destination'), 'Himachal Pradesh')
    expect((screen.getByLabelText('Trip URL') as HTMLInputElement).value).toBe('a-quiet-valley')
    await user.click(screen.getByRole('button', { name: /Photos/ }))
    await user.click(screen.getByRole('button', { name: /Basics/ }))
    expect((screen.getByLabelText(/Trip title/) as HTMLInputElement).value).toBe('A Quiet Valley')
    await user.clear(screen.getByLabelText('Trip URL')); await user.type(screen.getByLabelText('Trip URL'), 'my-valley')
    await user.type(screen.getByLabelText(/Trip title/), ' Escape')
    expect((screen.getByLabelText('Trip URL') as HTMLInputElement).value).toBe('my-valley')
    await user.click(screen.getByRole('button', { name: 'Save draft' }))
    await waitFor(() => expect(writes).toHaveLength(1))
    expect(writes[0].body).toMatchObject({ slug: 'my-valley', status: 'draft', type: 'calculator', packages: [] })
  })

  it('edits an existing trip without changing its slug or legacy values', async () => {
    const user = userEvent.setup(); render(<TripForm trip={existing} />)
    expect((screen.getByLabelText('Trip URL') as HTMLInputElement).readOnly).toBe(true)
    await user.clear(screen.getByLabelText(/Trip title/)); await user.type(screen.getByLabelText(/Trip title/), 'Updated mountain trip')
    await user.click(screen.getByRole('button', { name: /Save as draft/ }))
    await waitFor(() => expect(writes).toHaveLength(1))
    expect(writes[0].url).toBe('/api/admin/trips/7')
    expect(writes[0].body).toMatchObject({ slug: existing.slug, pricing: existing.pricing, itinerary: existing.itinerary, durLabels: existing.durLabels, durSubLabels: existing.durSubLabels, expectedUpdatedAt: existing.updatedAt, status: 'draft' })
  })

  it('requires confirmation before unpublishing an existing trip', async () => {
    vi.mocked(window.confirm).mockReturnValue(false)
    const user = userEvent.setup(); render(<TripForm trip={existing} />)
    await user.click(screen.getByRole('button', { name: /Save as draft/ }))
    expect(writes).toHaveLength(0)
  })
  it('automatically suggests a unique URL when a generated slug is taken', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => new Response(JSON.stringify(String(url).endsWith('slug=valley-trip')
      ? { available: false, suggestion: 'valley-trip-abcd1234' } : { available: true }))))
    const user = userEvent.setup(); render(<TripForm />)
    await user.type(screen.getByLabelText(/Trip title/), 'Valley Trip')
    await waitFor(() => expect((screen.getByLabelText('Trip URL') as HTMLInputElement).value).toBe('valley-trip-abcd1234'))
  })
  it('reorders itinerary days visually without losing their content', async () => {
    const user = userEvent.setup(); render(<TripForm trip={existing} />)
    await user.click(screen.getByRole('button', { name: /Packages & Itinerary/ }))
    await user.click(screen.getByRole('button', { name: '+ Add day' }))
    await user.type(screen.getByLabelText('Package 1 day 2 title'), 'Second day')
    await user.type(screen.getByLabelText('Package 1 day 2 description'), 'Second day details')
    await user.click(screen.getByRole('button', { name: 'Move package 1 day 2 up' }))
    expect((screen.getByLabelText('Package 1 day 1 title') as HTMLInputElement).value).toBe('Second day')
    expect((screen.getByLabelText('Package 1 day 2 title') as HTMLInputElement).value).toBe('Arrival')
  })

  it('cannot publish missing content or bypass the review checkbox', async () => {
    const user = userEvent.setup(); render(<TripForm />)
    await user.click(screen.getByRole('button', { name: /Review & Publish/ }))
    expect((screen.getByRole('button', { name: /Publish trip/ }) as HTMLButtonElement).disabled).toBe(true)
    await user.click(screen.getByRole('button', { name: 'Save draft' }))
    expect(screen.getByRole('alert').textContent).toBeTruthy()
    expect(writes).toHaveLength(0)
  })

  it('builds a visual package itinerary and publishes only after explicit review', async () => {
    const user = userEvent.setup(); render(<TripForm />)
    await user.type(screen.getByLabelText(/Trip title/), 'Valley Day')
    await user.type(screen.getByLabelText('Destination'), 'Himachal Pradesh')
    await user.click(screen.getByRole('button', { name: /Photos/ }))
    await user.type(screen.getByLabelText('Or add an image URL'), '/travel/cover.jpg')
    await user.click(screen.getByRole('button', { name: 'Add photo' }))
    await user.click(screen.getByRole('button', { name: /Packages & Itinerary/ }))
    await user.click(screen.getByRole('button', { name: /Add a duration package/ }))
    await user.clear(screen.getByLabelText('Days')); await user.type(screen.getByLabelText('Days'), '1')
    await user.clear(screen.getByLabelText('Nights')); await user.type(screen.getByLabelText('Nights'), '0')
    await user.clear(screen.getByLabelText(/Starting price per person/)); await user.type(screen.getByLabelText(/Starting price per person/), '5000')
    await user.click(screen.getByRole('button', { name: '+ Add day' }))
    await user.type(screen.getByLabelText('Package 1 day 1 title'), 'Arrival and valley walk')
    await user.type(screen.getByLabelText('Package 1 day 1 description'), 'Local pickup, a guided walk and a return transfer.')
    await user.click(screen.getByLabelText('Ready for customers'))
    await user.click(screen.getByRole('button', { name: /Review & Publish/ }))
    expect((screen.getByRole('button', { name: /Publish trip/ }) as HTMLButtonElement).disabled).toBe(true)
    await user.click(screen.getByLabelText(/I’ve reviewed/))
    await user.click(screen.getByRole('button', { name: /Publish trip/ }))
    await waitFor(() => expect(writes).toHaveLength(1))
    expect(writes[0].body).toMatchObject({ status: 'published', publishConfirmed: true, price: 5000, duration: '1 day · 0 nights' })
    const packages = writes[0].body.packages as { status: string; itinerary: string }[]
    expect(packages[0].status).toBe('published')
    expect(JSON.parse(packages[0].itinerary)[0].title).toBe('Arrival and valley walk')
  })

  it('requires confirmation for a saved package removal and supports undo', async () => {
    const user = userEvent.setup(); render(<TripForm trip={existing} />)
    await user.click(screen.getByRole('button', { name: /Packages & Itinerary/ }))
    await user.click(screen.getByRole('button', { name: 'Remove package 1' }))
    expect(window.confirm).toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Undo removal' }))
    expect((screen.getByLabelText('Package name') as HTMLInputElement).value).toBe('One day')
  })

  it('validates photo URLs and supports cover selection/reordering', async () => {
    const user = userEvent.setup(); render(<TripForm trip={existing} />)
    await user.click(screen.getByRole('button', { name: /Photos/ }))
    await user.type(screen.getByLabelText('Or add an image URL'), 'javascript:bad')
    await user.click(screen.getByRole('button', { name: 'Add photo' }))
    expect(screen.getByRole('alert').textContent).toContain('valid HTTP')
    await user.clear(screen.getByLabelText('Or add an image URL'))
    await user.type(screen.getByLabelText('Or add an image URL'), '/travel/second.jpg')
    await user.click(screen.getByRole('button', { name: 'Add photo' }))
    await user.click(screen.getByRole('button', { name: 'Set as cover' }))
    expect((screen.getByAltText('Trip cover preview') as HTMLImageElement).getAttribute('src')).toBe('/travel/second.jpg')
  })

  it('shows failed saves while keeping entered values', async () => {
    const user = userEvent.setup(); render(<TripForm trip={existing} />)
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ error: 'This trip has changed. Reload before saving.' }), { status: 409 })))
    await user.type(screen.getByLabelText(/Trip title/), ' Updated')
    await user.click(screen.getByRole('button', { name: /Save as draft/ }))
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('trip has changed'))
    expect((screen.getByLabelText(/Trip title/) as HTMLInputElement).value).toContain('Updated')
  })
})

describe('builder preservation and state transformations', () => {
  it('keeps all legacy JSON bytes and package IDs in an edit payload', () => {
    const payload = builderPayload(initialBuilder(existing), 'draft', existing)
    for (const key of ['pricing', 'itinerary', 'tierDetails', 'durLabels', 'durSubLabels'] as const) expect(payload[key]).toBe(existing[key])
    expect(payload.packages?.[0].id).toBe(10)
    expect(payload.removedPackageIds).toEqual([])
  })
  it('explicitly lists saved package removals', () => {
    expect(builderPayload({ ...initialBuilder(existing), packages: [] }, 'draft', existing).removedPackageIds).toEqual([10])
  })
  it('omits package writes for Andaman and preserves its pricing', () => {
    const andaman = { ...existing, type: 'andaman' }
    const payload = builderPayload(initialBuilder(andaman), 'draft', andaman)
    expect(payload).not.toHaveProperty('packages')
    expect(payload.pricing).toBe(existing.pricing)
  })
  it('uses public-compatible defaults without exposing trip types to operators', () => {
    expect(initialBuilder().form.type).toBe('calculator')
    expect(builderIssues(initialBuilder(), 'published')).not.toHaveLength(0)
  })
  it('normalizes slugs and safely reorders values', () => {
    expect(slugify(' Café & Mountain Days! ')).toBe('cafe-mountain-days')
    expect(moveItem(['a', 'b'], 1, -1)).toEqual(['b', 'a'])
    expect(moveItem(['a'], 0, -1)).toEqual(['a'])
    expect(durationSummary([{ days: 3, nights: 2 }, { days: 5, nights: 4 }])).toBe('3–5 days')
  })
})
