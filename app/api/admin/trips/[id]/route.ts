import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, isAdminRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { validatePackageArray } from '@/lib/validation'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as { role?: string } | undefined)?.role
  if (!session || !isAdminRole(role)) return null
  return session
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: idStr } = await params
  const id = parseInt(idStr, 10)
  if (!Number.isFinite(id) || id < 1) {
    return NextResponse.json({ error: 'Invalid trip id.' }, { status: 400 })
  }

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const packagesInput = body.packages
  delete body.packages
  const packagesResult = validatePackageArray(packagesInput)
  if (!packagesResult.ok) {
    return NextResponse.json({ error: packagesResult.error }, { status: 400 })
  }

  try {
    const result = await prisma.$transaction(async tx => {
      const trip = await tx.trip.update({ where: { id }, data: body as never })

      if (packagesInput !== undefined) {
        const existing = await tx.tripPackage.findMany({ where: { tripId: id } })
        const keepIds = new Set(packagesResult.data.map(p => p.id).filter((x): x is number => typeof x === 'number'))
        const toDelete = existing.filter(e => !keepIds.has(e.id)).map(e => e.id)
        if (toDelete.length > 0) {
          await tx.tripPackage.deleteMany({ where: { id: { in: toDelete } } })
        }
        for (let i = 0; i < packagesResult.data.length; i++) {
          const p = packagesResult.data[i]
          const payload = {
            slug: p.slug,
            label: p.label,
            days: p.days,
            nights: p.nights,
            priceAdult: p.priceAdult,
            priceBasis: p.priceBasis,
            priceOnRequest: p.priceOnRequest,
            image: p.image,
            sortOrder: p.sortOrder ?? i,
            status: p.status,
            itinerary: p.itinerary,
            accommodation: p.accommodation,
            inclusions: p.inclusions,
            exclusions: p.exclusions,
            notes: p.notes,
          }
          if (p.id) {
            await tx.tripPackage.update({ where: { id: p.id }, data: payload })
          } else {
            await tx.tripPackage.create({ data: { ...payload, tripId: id } })
          }
        }
      }

      return tx.trip.findUnique({
        where: { id: trip.id },
        include: { packages: { orderBy: { sortOrder: 'asc' } } },
      })
    })
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not save trip.'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: idStr } = await params
  const id = parseInt(idStr, 10)
  if (!Number.isFinite(id) || id < 1) {
    return NextResponse.json({ error: 'Invalid trip id.' }, { status: 400 })
  }

  try {
    await prisma.trip.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Could not delete trip.' }, { status: 400 })
  }
}
