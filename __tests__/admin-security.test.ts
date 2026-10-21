import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => ({
  session: vi.fn(),
  trip: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
  tripPackage: { findMany: vi.fn(), createMany: vi.fn(), create: vi.fn(), updateMany: vi.fn(), deleteMany: vi.fn() },
  booking: { findMany: vi.fn(), findUnique: vi.fn(), updateMany: vi.fn() },
  experience: { create: vi.fn() },
  transaction: vi.fn(),
}))
vi.mock('next-auth', () => ({ getServerSession: mocks.session }))
vi.mock('@/lib/auth', () => ({ authOptions: { testConfig: true }, isAdminRole: (role: string) => ['admin', 'editor'].includes(role) }))
vi.mock('@/lib/prisma', () => ({ prisma: { trip: mocks.trip, tripPackage: mocks.tripPackage, booking: mocks.booking, experience: mocks.experience, $transaction: mocks.transaction } }))

import { POST as createTrip } from '@/app/api/admin/trips/route'
import { PUT as editTrip, DELETE as deleteTrip } from '@/app/api/admin/trips/[id]/route'
import { POST as createExperience } from '@/app/api/admin/experiences/route'
import { PATCH as changeBooking } from '@/app/api/admin/bookings/[id]/route'
import { GET as listBookings } from '@/app/api/bookings/route'

const trip = {
  id: 7, slug: 'jibhi', title: 'Existing trip', subtitle: '', location: 'Himachal Pradesh', category: 'Mountains',
  duration: '3 days', difficulty: 'Easy', price: 15000, status: 'published', image: '/travel/example.jpg', route: '', type: 'calculator',
  gallery: '[]', highlights: '[]', included: '[]', notIncluded: '[]', faqs: '[]', pricing: '[[15000]]', itinerary: '[]',
  tierDetails: '[]', durLabels: '[]', durSubLabels: '[]', createdAt: new Date(), updatedAt: new Date(),
}
const pkg = { slug: 'standard', label: 'Standard', days: 3, nights: 2, priceAdult: 10000, status: 'published', itinerary: JSON.stringify(Array.from({ length: 3 }, (_, i) => ({ day: `Day ${i + 1}`, title: 'Travel day', desc: 'Planned transfers and experiences' }))) }
const createBody = { slug: trip.slug, title: trip.title, location: trip.location, category: trip.category, price: trip.price, status: trip.status, image: trip.image, duration: trip.duration, packages: [pkg], publishConfirmed: true }
const context = (id = '7') => ({ params: Promise.resolve({ id }) })
const req = (body: unknown = {}, method = 'POST', origin?: string) => new NextRequest('https://staylocal.test/api/admin/test', {
  method, headers: { 'Content-Type': 'application/json', ...(origin ? { origin } : {}) }, body: JSON.stringify(method === 'PUT' && body && typeof body === 'object' && !Array.isArray(body) ? { expectedUpdatedAt: trip.updatedAt.toISOString(), publishConfirmed: true, ...body } : body),
})
const operations = [
  ['create trip', () => createTrip(req(createBody))],
  ['edit trip', () => editTrip(req({ title: 'Updated' }, 'PUT'), context())],
  ['delete trip', () => deleteTrip(req({}, 'DELETE'), context())],
  ['create experience', () => createExperience(req({ slug: 'test', title: 'Test', location: 'India' }))],
  ['change booking', () => changeBooking(req({ status: 'confirmed' }, 'PATCH'), context())],
  ['list bookings', () => listBookings()],
] as const

beforeEach(() => {
  vi.resetAllMocks()
  mocks.session.mockResolvedValue({ user: { id: '1', role: 'admin' } })
  mocks.transaction.mockImplementation(async callback => callback({ trip: mocks.trip, tripPackage: mocks.tripPackage, booking: mocks.booking }))
  mocks.trip.findUnique.mockResolvedValue(trip)
  mocks.trip.create.mockResolvedValue(trip)
  mocks.trip.update.mockResolvedValue(trip)
  mocks.tripPackage.findMany.mockResolvedValue([{ id: 10 }])
  mocks.tripPackage.updateMany.mockResolvedValue({ count: 1 })
  mocks.booking.findUnique.mockResolvedValue({ id: 7, status: 'pending' })
  mocks.booking.updateMany.mockResolvedValue({ count: 1 })
  mocks.booking.findMany.mockResolvedValue([])
  mocks.experience.create.mockResolvedValue({ id: 1 })
})

describe('admin route authorization', () => {
  it.each(operations)('denies anonymous %s', async (_label, operation) => {
    mocks.session.mockResolvedValue(null)
    expect((await operation()).status).toBe(401)
    expect(mocks.transaction).not.toHaveBeenCalled()
    expect(mocks.experience.create).not.toHaveBeenCalled()
    expect(mocks.booking.findMany).not.toHaveBeenCalled()
  })
  it.each(operations)('denies nonstaff %s', async (_label, operation) => {
    mocks.session.mockResolvedValue({ user: { id: '1', role: 'customer' } })
    expect((await operation()).status).toBe(403)
  })
  it.each(operations)('uses configured NextAuth for %s', async (_label, operation) => {
    await operation()
    expect(mocks.session).toHaveBeenCalledWith({ testConfig: true })
  })
  it.each([operations[2], operations[4], operations[5]])('denies editor access to %s', async (_label, operation) => {
    mocks.session.mockResolvedValue({ user: { id: '2', role: 'editor' } })
    expect((await operation()).status).toBe(403)
  })
  it.each([operations[0], operations[1], operations[3]])('allows editor to %s', async (_label, operation) => {
    mocks.session.mockResolvedValue({ user: { id: '2', role: 'editor' } })
    expect((await operation()).status).toBe(200)
  })
  it('fails closed when authentication is unavailable', async () => {
    mocks.session.mockRejectedValue(new Error('private details'))
    const response = await createTrip(req(createBody))
    expect(response.status).toBe(503)
    expect(await response.text()).not.toContain('private details')
  })
  it('rejects cross-origin writes', async () => {
    expect((await createTrip(req(createBody, 'POST', 'https://other.test'))).status).toBe(403)
    expect(mocks.transaction).not.toHaveBeenCalled()
  })
})

describe('trip writes and package ownership', () => {
  it.each([null, [], { ...createBody, title: '' }, { ...createBody, price: -1 }, { ...createBody, gallery: 'null' }, { ...createBody, id: 10 }, { ...createBody, packages: null }])('rejects invalid creation %j before writes', async body => {
    expect((await createTrip(req(body))).status).toBe(400)
    expect(mocks.transaction).not.toHaveBeenCalled()
  })
  it('rejects package IDs when creating trips', async () => {
    expect((await createTrip(req({ ...createBody, packages: [{ ...pkg, id: 10 }] }))).status).toBe(400)
    expect(mocks.transaction).not.toHaveBeenCalled()
  })
  it('rejects foreign package IDs before updates or deletions', async () => {
    const response = await editTrip(req({ packages: [{ ...pkg, id: 999 }] }, 'PUT'), context())
    expect(response.status).toBe(400)
    expect(mocks.tripPackage.deleteMany).not.toHaveBeenCalled()
    expect(mocks.tripPackage.updateMany).not.toHaveBeenCalled()
    expect(mocks.trip.update).not.toHaveBeenCalled()
  })
  it('scopes package updates AND deletions to their parent trip', async () => {
    expect((await editTrip(req({ packages: [{ ...pkg, id: 10 }] }, 'PUT'), context())).status).toBe(200)
    expect(mocks.tripPackage.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 10, tripId: 7 } }))
    expect(mocks.tripPackage.deleteMany).not.toHaveBeenCalled()
  })
  it('omitted packages leave existing packages untouched', async () => {
    expect((await editTrip(req({ title: 'Updated' }, 'PUT'), context())).status).toBe(200)
    expect(mocks.tripPackage.deleteMany).not.toHaveBeenCalled()
  })
  it('empty packages remove only this trip’s packages', async () => {
    expect((await editTrip(req({ packages: [], removedPackageIds: [10] }, 'PUT'), context())).status).toBe(200)
    expect(mocks.tripPackage.deleteMany).toHaveBeenCalledWith({ where: { tripId: 7, id: { in: [10] } } })
  })
  it('rejects package omission-as-deletion unless removal is explicitly confirmed', async () => {
    expect((await editTrip(req({ packages: [] }, 'PUT'), context())).status).toBe(409)
    expect(mocks.tripPackage.deleteMany).not.toHaveBeenCalled()
  })
  it('rejects stale edits without mutating content', async () => {
    expect((await editTrip(req({ expectedUpdatedAt: '2020-01-01T00:00:00.000Z' }, 'PUT'), context())).status).toBe(409)
    expect(mocks.trip.update).not.toHaveBeenCalled()
  })
  it('protects existing trip slugs and rendering types', async () => {
    expect((await editTrip(req({ slug: 'different-trip' }, 'PUT'), context())).status).toBe(409)
    expect((await editTrip(req({ type: 'enquiry' }, 'PUT'), context())).status).toBe(409)
  })
  it('preserves untouched legacy JSON exactly on a title edit', async () => {
    const legacy = { ...trip, pricing: '[ [15000] ]', durSubLabels: '[ "Saved label" ]' }
    mocks.trip.findUnique.mockResolvedValue(legacy)
    expect((await editTrip(req({ title: 'Updated' }, 'PUT'), context())).status).toBe(200)
    expect(mocks.trip.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ pricing: legacy.pricing, durSubLabels: legacy.durSubLabels }) }))
  })
  it('protects Andaman packages and special pricing during general edits', async () => {
    const tier = { name: 'Standard', subtitle: '', popular: false, hotels: { portblair: '', havelock: '', neil: '' }, ferry: '', meals: '', features: [], bufferPrice: [1000, 2000], price: [1000, 2000], promoPrice: [900, 1800], discount: [10, 10] }
    const pricing = JSON.stringify({ durations: [{ label: '3D', sub: '', image: '' }, { label: '4D', sub: '', image: '' }], tiers: [tier, tier], promoCodes: [], promoDiscount: 100 })
    mocks.trip.findUnique.mockResolvedValue({ ...trip, type: 'andaman', pricing })
    expect((await editTrip(req({ title: 'Updated' }, 'PUT'), context())).status).toBe(200)
    expect((await editTrip(req({ packages: [] }, 'PUT'), context())).status).toBe(409)
    expect((await editTrip(req({ pricing: pricing.replace('Standard', 'Different tier') }, 'PUT'), context())).status).toBe(409)
  })
  it('requires explicit review confirmation to publish', async () => {
    expect((await createTrip(req({ ...createBody, publishConfirmed: false }))).status).toBe(409)
    expect(mocks.trip.create).not.toHaveBeenCalled()
  })
  it('rejects incomplete publication while allowing a valid unfinished draft', async () => {
    expect((await createTrip(req({ ...createBody, packages: [] }))).status).toBe(422)
    expect((await createTrip(req({ ...createBody, packages: [], status: 'draft', publishConfirmed: false }))).status).toBe(200)
  })
  it('rejects publishing a package with missing itinerary days', async () => {
    expect((await createTrip(req({ ...createBody, packages: [{ ...pkg, itinerary: '[]' }] }))).status).toBe(422)
    expect(mocks.trip.create).not.toHaveBeenCalled()
  })
  it('reports a concurrent package change', async () => {
    mocks.tripPackage.updateMany.mockResolvedValue({ count: 0 })
    expect((await editTrip(req({ packages: [{ ...pkg, id: 10 }] }, 'PUT'), context())).status).toBe(409)
    expect(mocks.trip.update).not.toHaveBeenCalled()
  })
  it('returns safe errors without raw database messages', async () => {
    mocks.trip.create.mockRejectedValue(new Error('sensitive database context'))
    const response = await createTrip(req(createBody))
    expect(response.status).toBe(500)
    expect(await response.text()).not.toContain('sensitive database context')
  })
  it('reports duplicate slugs as a conflict', async () => {
    mocks.trip.create.mockRejectedValue({ code: 'P2002' })
    expect((await createTrip(req(createBody))).status).toBe(409)
  })
  it.each(['7junk', '0', '-1', '2.5', '999999999999999999999'])('rejects invalid IDs: %s', async id => {
    expect((await editTrip(req({}, 'PUT'), context(id))).status).toBe(400)
    expect((await deleteTrip(req({}, 'DELETE'), context(id))).status).toBe(400)
  })
})

describe('booking status writes', () => {
  it.each([null, [], {}, { status: 'paid' }, { status: null }, { status: 'confirmed', name: 'Overwritten' }])('rejects invalid status input %j', async body => {
    expect((await changeBooking(req(body, 'PATCH'), context())).status).toBe(400)
    expect(mocks.booking.updateMany).not.toHaveBeenCalled()
  })
  it.each([
    ['pending', 'pending', 200], ['pending', 'confirmed', 200], ['pending', 'cancelled', 200],
    ['confirmed', 'pending', 409], ['confirmed', 'confirmed', 200], ['confirmed', 'cancelled', 200],
    ['cancelled', 'pending', 409], ['cancelled', 'confirmed', 200], ['cancelled', 'cancelled', 200],
    ['invalid-legacy-status', 'confirmed', 409],
  ])('%s → %s returns %i', async (from, to, status) => {
    mocks.booking.findUnique.mockResolvedValue({ id: 7, status: from })
    expect((await changeBooking(req({ status: to }, 'PATCH'), context())).status).toBe(status)
    if (status !== 200 || from === to) expect(mocks.booking.updateMany).not.toHaveBeenCalled()
    else expect(mocks.booking.updateMany).toHaveBeenCalledWith({ where: { id: 7, status: from }, data: { status: to } })
  })
  it('returns 404 for missing bookings', async () => {
    mocks.booking.findUnique.mockResolvedValue(null)
    expect((await changeBooking(req({ status: 'confirmed' }, 'PATCH'), context())).status).toBe(404)
  })
  it('returns 409 for concurrent changes instead of overwriting', async () => {
    mocks.booking.updateMany.mockResolvedValue({ count: 0 })
    expect((await changeBooking(req({ status: 'confirmed' }, 'PATCH'), context())).status).toBe(409)
  })
  it('returns 400 for malformed JSON', async () => {
    const request = new NextRequest('https://staylocal.test/api/admin/bookings/7', { method: 'PATCH', body: '{' })
    expect((await changeBooking(request, context())).status).toBe(400)
  })
})
