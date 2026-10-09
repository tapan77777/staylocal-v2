import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, isAdminRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { validatePackageArray } from '@/lib/validation'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as { role?: string } | undefined)?.role
  if (!session || !isAdminRole(role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
    const trip = await prisma.$transaction(async tx => {
      const created = await tx.trip.create({ data: body as never })
      if (packagesResult.data.length > 0) {
        await tx.tripPackage.createMany({
          data: packagesResult.data.map((p, i) => ({
            tripId: created.id,
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
          })),
        })
      }
      return tx.trip.findUnique({
        where: { id: created.id },
        include: { packages: { orderBy: { sortOrder: 'asc' } } },
      })
    })
    return NextResponse.json(trip)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not save trip.'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
