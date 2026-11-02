import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import fixture from './fixtures/trek-system.json'
import { trekWriteSchema } from '@/lib/treks/schema'
const mocks = vi.hoisted(() => ({ access: vi.fn(), save: vi.fn(), read: vi.fn(), transaction: vi.fn(), content: vi.fn(), departure: vi.fn(), recent: vi.fn(), create: vi.fn(), snapshot: vi.fn() }))
vi.mock('@/lib/admin-access', () => ({ adminAccess: mocks.access }))
vi.mock('@/lib/treks/store', () => ({ saveTrek: mocks.save, readAdminTrek: mocks.read }))
vi.mock('@/lib/prisma', () => ({ prisma: { $transaction: mocks.transaction } }))
import { POST } from '@/app/api/admin/treks/route'
import { PUT, GET } from '@/app/api/admin/treks/[id]/route'
import { saveTrekEnquiry } from '@/lib/treks/enquiry'
import { AdminError } from '@/lib/admin-errors'
const payload = trekWriteSchema.parse(fixture)
const enquiry = { name: 'Local test', phone: '9999999999', email: '', tripSlug: payload.slug, people: 2, month: '', message: '', packageId: 90 }
const request = (body: unknown, method = 'POST') => new NextRequest('https://staylocal.test/api/admin/treks', { method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
beforeEach(() => {
  vi.clearAllMocks()
  mocks.access.mockResolvedValue({ ok: true })
  mocks.save.mockResolvedValue({ id: 1 })
  mocks.read.mockResolvedValue({ id: 1 })
  mocks.content.mockResolvedValue({ tripId: 1, packageId: 90, trip: { status: 'published' }, package: { status: 'published', priceAdult: 6800, label: 'Standard' }, config: { ...payload.content, fixture: false } })
  mocks.departure.mockResolvedValue({ ...payload.departures[0], id: 'owned', tripId: 1, startDate: new Date('2030-03-10'), endDate: new Date('2030-03-12') })
  mocks.recent.mockResolvedValue(null)
  mocks.create.mockResolvedValue({ id: 50 })
  mocks.transaction.mockImplementation(callback => callback({ trekContent: { findUnique: mocks.content }, trekDeparture: { findUnique: mocks.departure }, booking: { findFirst: mocks.recent, create: mocks.create }, trekEnquiry: { create: mocks.snapshot } }))
})
afterEach(() => vi.unstubAllEnvs())
describe('trek admin boundaries', () => {
  it('requires existing content authorization for create, edit and private reads', async () => {
    mocks.access.mockResolvedValue({ ok: false, response: Response.json({ error: 'Sign in' }, { status: 401 }) })
    expect((await POST(request(payload))).status).toBe(401)
    expect((await PUT(request(payload, 'PUT'), { params: Promise.resolve({ id: '1' }) })).status).toBe(401)
    expect((await GET(request({}, 'POST'), { params: Promise.resolve({ id: '1' }) })).status).toBe(401)
    expect(mocks.save).not.toHaveBeenCalled(); expect(mocks.read).not.toHaveBeenCalled()
  })
  it('uses the shared save service and maps stale edits to conflicts', async () => {
    expect((await POST(request(payload))).status).toBe(200)
    mocks.save.mockRejectedValue(new AdminError('Changed', 409))
    expect((await PUT(request(payload, 'PUT'), { params: Promise.resolve({ id: '1' }) })).status).toBe(409)
    expect((await PUT(request(payload, 'PUT'), { params: Promise.resolve({ id: '../bad' }) })).status).toBe(400)
  })
})
describe('shared server-priced trek enquiries', () => {
  it('cannot create invented quotes or bookings for enquiry-only treks', async () => {
    mocks.content.mockResolvedValue({ tripId: 1, packageId: 90, trip: { status: 'published' }, package: { status: 'published', priceAdult: 0, label: 'Standard' }, config: { ...payload.content, fixture: false, enquiryOnly: true } })
    await expect(saveTrekEnquiry(1, enquiry, undefined)).rejects.toMatchObject({ status: 409 })
    expect(mocks.create).not.toHaveBeenCalled(); expect(mocks.snapshot).not.toHaveBeenCalled()
  })
  it('rejects fixture bookings even in the isolated review runtime', async () => {
    vi.stubEnv('TREK_FIXTURE_REVIEW', '1'); vi.stubEnv('VERCEL', '')
    vi.stubEnv('DATABASE_URL', 'postgresql://local@127.0.0.1:55482/staylocal_phase2_fixture')
    mocks.content.mockResolvedValue({ tripId: 1, packageId: 90, trip: { status: 'published' }, package: { status: 'published' }, config: payload.content })
    await expect(saveTrekEnquiry(1, enquiry, undefined)).rejects.toMatchObject({ status: 404 })
    expect(mocks.create).not.toHaveBeenCalled()
  })
  it('uses the owned departure override and persists an enquiry snapshot with the shared booking', async () => {
    const result = await saveTrekEnquiry(1, enquiry, 'owned')
    expect(result.estimatedPrice).toBe(14400)
    expect(mocks.create.mock.calls[0][0].data).toMatchObject({ estimatedPrice: 14400, packageId: 90 })
    expect(mocks.snapshot.mock.calls[0][0].data).toMatchObject({ bookingId: 50, tripId: 1, departureId: 'owned', priceAdult: 7200 })
  })
  it('supports a trip-level custom-date enquiry without losing shared pricing', async () => {
    expect((await saveTrekEnquiry(1, { ...enquiry, packageId: null }, undefined)).estimatedPrice).toBe(13600)
    expect(mocks.departure).not.toHaveBeenCalled()
  })
  it('rejects cross-trip selections, full/cancelled batches and impossible group sizes', async () => {
    mocks.departure.mockResolvedValueOnce({ ...payload.departures[0], tripId: 99 })
    await expect(saveTrekEnquiry(1, enquiry, 'foreign')).rejects.toMatchObject({ status: 400 })
    mocks.departure.mockResolvedValueOnce({ ...payload.departures[0], tripId: 1, status: 'FULL', startDate: new Date('2030-03-10'), endDate: new Date('2030-03-12') })
    await expect(saveTrekEnquiry(1, enquiry, 'full')).rejects.toMatchObject({ status: 409 })
    await expect(saveTrekEnquiry(1, { ...enquiry, people: 20 }, 'owned')).rejects.toMatchObject({ status: 400 })
    await expect(saveTrekEnquiry(1, { ...enquiry, packageId: 91 }, 'owned')).rejects.toMatchObject({ status: 400 })
    expect(mocks.create).not.toHaveBeenCalled()
  })
  it('preserves duplicate suppression without silently replacing a selected date or estimate', async () => {
    mocks.recent.mockResolvedValue({ id: 7, people: 2, estimatedPrice: 14400, packageId: 90, packageLabel: 'Standard', trekEnquiry: { departureId: 'owned' } })
    expect((await saveTrekEnquiry(1, enquiry, 'owned')).duplicate).toBe(true)
    await expect(saveTrekEnquiry(1, { ...enquiry, people: 3 }, 'owned')).rejects.toMatchObject({ status: 409 })
    expect(mocks.create).not.toHaveBeenCalled()
  })
})
