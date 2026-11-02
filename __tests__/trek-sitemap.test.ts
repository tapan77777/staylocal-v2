import { beforeEach, describe, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ trips: vi.fn(), kinds: vi.fn(), treks: vi.fn() }))
vi.mock('@/lib/prisma', () => ({ prisma: { trip: { findMany: mocks.trips } } }))
vi.mock('@/lib/treks/store', () => ({ getClassifications: mocks.kinds, getPublishedTreks: mocks.treks }))
import sitemap from '@/app/sitemap'
beforeEach(() => vi.clearAllMocks())
describe('canonical published trek indexing', () => {
  it('indexes real trek URLs while retaining legacy and explicit tour URLs and excluding fixtures or missing content', async () => {
    const updatedAt = new Date('2026-11-02')
    mocks.trips.mockResolvedValue([
      { id: 1, slug: 'reviewed-trek', updatedAt }, { id: 2, slug: 'legacy-kashmir', updatedAt },
      { id: 3, slug: 'explicit-tour', updatedAt }, { id: 4, slug: 'design-fixture', updatedAt },
      { id: 5, slug: 'incomplete-trek', updatedAt },
    ])
    mocks.kinds.mockResolvedValue([{ tripId: 1, kind: 'TREK' }, { tripId: 3, kind: 'TOUR' }, { tripId: 4, kind: 'TREK' }, { tripId: 5, kind: 'TREK' }])
    mocks.treks.mockResolvedValue([{ id: 1, content: { fixture: false } }, { id: 4, content: { fixture: true } }])
    const urls = (await sitemap()).map(e => new URL(e.url).pathname)
    expect(urls).toContain('/treks/reviewed-trek')
    expect(urls).not.toContain('/trip/reviewed-trek')
    expect(urls).toContain('/trip/legacy-kashmir')
    expect(urls).toContain('/trip/explicit-tour')
    expect(urls.join()).not.toMatch(/design-fixture|incomplete-trek/)
    expect(urls).toContain('/treks'); expect(urls).toContain('/tours')
  })
})
