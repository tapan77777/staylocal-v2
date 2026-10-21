import { prisma } from '@/lib/prisma'
import { adminAccess } from '@/lib/admin-access'
import { positiveId, adminError } from '@/lib/admin-errors'
import { universalAvailable } from '@/lib/universal-store'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await adminAccess('content')
  if (!access.ok) return access.response
  if (!universalAvailable()) return Response.json({ available: false }, { headers: { 'Cache-Control': 'no-store' } })
  const rawId = (await params).id
  if (rawId === 'new') return Response.json({ available: true, config: null, enabled: false, expectedUpdatedAt: null }, { headers: { 'Cache-Control': 'no-store' } })
  const id = positiveId(rawId)
  if (!id) return Response.json({ error: 'Invalid trip ID.' }, { status: 400 })
  try {
    const trip = await prisma.trip.findUnique({ where: { id }, select: { id: true, type: true } })
    if (!trip) return Response.json({ error: 'Not found.' }, { status: 404 })
    const row = await prisma.tripExperience.findUnique({ where: { tripId: id } })
    return Response.json({ available: true, protected: trip.type === 'andaman', config: row ? JSON.parse(row.config) : null, enabled: row?.enabled ?? false, expectedUpdatedAt: row?.updatedAt.toISOString() ?? null }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (e) { return adminError(e) }
}
