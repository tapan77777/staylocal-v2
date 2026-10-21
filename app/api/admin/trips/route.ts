import { saveUniversal } from '@/lib/universal-write'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { adminAccess } from '@/lib/admin-access'
import { adminError } from '@/lib/admin-errors'
import { validateTripInput } from '@/lib/content-validation'
import { validatePackageArray } from '@/lib/validation'
import { splitWriteMetadata } from '@/lib/trip-schemas'
import { publishProblems } from '@/lib/trip-publish'

export async function POST(req: NextRequest) {
  const access = await adminAccess('content', req)
  if (!access.ok) return access.response
  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }
  const envelope = splitWriteMetadata(body)
  if (!envelope.ok) return NextResponse.json({ error: envelope.error }, { status: 400 })
  body = envelope.body
  const result = validateTripInput(body)
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 })
  const packages = validatePackageArray((body as Record<string, unknown>).packages)
  if (!packages.ok) return NextResponse.json({ error: packages.error }, { status: 400 })
  if (packages.data.some(p => p.id !== undefined)) {
    return NextResponse.json({ error: 'New trips cannot reference existing packages.' }, { status: 400 })
  }
  if (result.data.status === 'published') {
    if (!envelope.metadata.publishConfirmed) return NextResponse.json({ error: 'Review and confirm this trip before publishing.' }, { status: 409 })
    const problems = publishProblems(result.data, packages.data)
    if (problems.length) return NextResponse.json({ error: problems.join(' ') }, { status: 422 })
  }
  try {
    const trip = await prisma.$transaction(async tx => {
      const created = await tx.trip.create({ data: result.data })
      if (packages.data.length) {
        await tx.tripPackage.createMany({
          data: packages.data.map(({ id: _id, ...p }) => ({ ...p, tripId: created.id })),
        })
      }
      await saveUniversal(tx, created, envelope.metadata.universal, (access.session.user as { role: string }).role)
      return tx.trip.findUnique({ where: { id: created.id }, include: { packages: { orderBy: { sortOrder: 'asc' } } } })
    })
    return NextResponse.json(trip)
  } catch (error) { return adminError(error) }
}
