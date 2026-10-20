import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { findUnique } = vi.hoisted(() => ({ findUnique: vi.fn() }))
vi.mock('@/lib/prisma', () => ({ prisma: { trip: { findUnique } } }))

import { GET } from '@/app/api/trips/[slug]/route'

describe('public trip detail API', () => {
  beforeEach(() => findUnique.mockReset())

  const request = (slug: string) => GET(
    new NextRequest(`https://staylocal.test/api/trips/${slug}`),
    { params: Promise.resolve({ slug }) },
  )

  it.each(['darjeeling', 'andaman', 'jibhi'])('loads published %s with only published packages', async slug => {
    const trip = { slug, status: 'published', packages: [] }
    findUnique.mockResolvedValue(trip)
    const response = await request(slug)
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual(trip)
    expect(findUnique).toHaveBeenCalledWith({
      where: { slug },
      include: { packages: { where: { status: 'published' }, orderBy: { sortOrder: 'asc' } } },
    })
  })

  it.each([null, { slug: 'draft-trip', status: 'draft' }])('returns 404 for missing or unpublished trips: %j', async trip => {
    findUnique.mockResolvedValue(trip)
    const response = await request('unavailable')
    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ error: 'Not found' })
  })
})
