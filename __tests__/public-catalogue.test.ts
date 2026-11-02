import { beforeEach, describe, expect, it, vi } from 'vitest'
import snapshots from './fixtures/legacy-trips.json'
const mocks = vi.hoisted(() => ({ findMany: vi.fn(), loadUniversal: vi.fn() }))
vi.mock('@/lib/prisma', () => ({ prisma: { trip: { findMany: mocks.findMany } } }))
vi.mock('@/lib/universal-store', () => ({ loadUniversal: mocks.loadUniversal }))
import { getPublicCatalogue } from '@/lib/public-catalogue'

beforeEach(() => {
  mocks.findMany.mockReset().mockResolvedValue([{ ...snapshots[0], packages: [] }])
  mocks.loadUniversal.mockReset().mockResolvedValue(null)
})
describe('published catalogue read adapter', () => {
  it('queries only published trips/packages and returns normalized card data', async () => {
    const [trip] = await getPublicCatalogue()
    expect(mocks.findMany).toHaveBeenCalledWith({ where: { status: 'published' }, orderBy: { createdAt: 'desc' }, include: { packages: { where: { status: 'published' }, orderBy: { sortOrder: 'asc' } } } })
    expect(trip.price).toBe(7500)
    expect(trip.duration).toBe('3D/2N')
    expect(trip.slug).toBe('jibhi')
    expect(trip).not.toHaveProperty('pricing')
    expect(trip).not.toHaveProperty('packages')
  })
  it('keeps an empty published inventory empty', async () => {
    mocks.findMany.mockResolvedValue([])
    expect(await getPublicCatalogue()).toEqual([])
    expect(mocks.loadUniversal).not.toHaveBeenCalled()
  })
})
