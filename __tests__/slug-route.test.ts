import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
const mocks = vi.hoisted(() => ({ access: vi.fn(), findUnique: vi.fn() }))
vi.mock('@/lib/admin-access', () => ({ adminAccess: mocks.access }))
vi.mock('@/lib/prisma', () => ({ prisma: { trip: { findUnique: mocks.findUnique } } }))
import { GET } from '@/app/api/admin/trips/check-slug/route'

beforeEach(() => { vi.clearAllMocks(); mocks.access.mockResolvedValue({ ok: true }); mocks.findUnique.mockResolvedValue(null) })
const request = (slug: string) => new NextRequest(`https://staylocal.test/api/admin/trips/check-slug?slug=${encodeURIComponent(slug)}`)

describe('authenticated slug availability', () => {
  it('does not disclose slug availability to anonymous visitors', async () => {
    mocks.access.mockResolvedValue({ ok: false, response: NextResponse.json({ error: 'Denied' }, { status: 401 }) })
    expect((await GET(request('test'))).status).toBe(401)
    expect(mocks.findUnique).not.toHaveBeenCalled()
  })
  it('checks draft and published trips equally', async () => {
    expect(await (await GET(request('test'))).json()).toEqual({ available: true })
    expect(mocks.findUnique).toHaveBeenCalledWith({ where: { slug: 'test' }, select: { id: true } })
  })
  it('suggests an available suffix on collisions', async () => {
    mocks.findUnique.mockResolvedValueOnce({ id: 1 }).mockResolvedValueOnce(null)
    const data = await (await GET(request('test'))).json()
    expect(data.available).toBe(false)
    expect(data.suggestion).toMatch(/^test-[a-f0-9]{8}$/)
  })
  it.each(['', '../trip', 'Bad Slug', 'a'.repeat(81)])('rejects invalid slugs: %s', async slug => {
    expect((await GET(request(slug))).status).toBe(400)
    expect(mocks.findUnique).not.toHaveBeenCalled()
  })
})
