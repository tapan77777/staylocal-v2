import { saveUniversal } from '@/lib/universal-write'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { adminAccess } from '@/lib/admin-access'
import { adminError, AdminError, positiveId } from '@/lib/admin-errors'
import { validateTripInput } from '@/lib/content-validation'
import { validatePackageArray } from '@/lib/validation'
import { splitWriteMetadata } from '@/lib/trip-schemas'
import { publishProblems } from '@/lib/trip-publish'

type Context = { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: Context) {
  const access = await adminAccess('content', req)
  if (!access.ok) return access.response
  const id = positiveId((await params).id)
  if (!id) return NextResponse.json({ error: 'Invalid trip ID.' }, { status: 400 })
  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'Body must be an object.' }, { status: 400 })
  }
  const envelope = splitWriteMetadata(body)
  if (!envelope.ok) return NextResponse.json({ error: envelope.error }, { status: 400 })
  body = envelope.body
  const packagesInput = (body as Record<string, unknown>).packages
  const packages = validatePackageArray(packagesInput)
  if (!packages.ok) return NextResponse.json({ error: packages.error }, { status: 400 })
  try {
    const result = await prisma.$transaction(async tx => {
      const existingTrip = await tx.trip.findUnique({ where: { id } })
      if (!existingTrip) throw new AdminError('Trip not found.', 404)
      if (!envelope.metadata.expectedUpdatedAt || existingTrip.updatedAt.toISOString() !== envelope.metadata.expectedUpdatedAt) {
        throw new AdminError('This trip has changed or the edit version is missing. Reload before saving; your local values are still here.', 409)
      }
      const validated = validateTripInput(body, existingTrip)
      if (!validated.ok) throw new AdminError(validated.error, 400)
      // Preserve untouched JSON exactly, including legacy fields not represented
      // by the visual editor. Validation still runs before any save.
      for (const key of ['gallery', 'highlights', 'included', 'notIncluded', 'faqs', 'pricing', 'itinerary', 'tierDetails', 'durLabels', 'durSubLabels'] as const) {
        if (envelope.body[key] === undefined || envelope.body[key] === existingTrip[key]) validated.data[key] = existingTrip[key]
      }
      if (validated.data.slug !== existingTrip.slug) throw new AdminError('Existing trip URLs are protected. Keep the original slug.', 409)
      if (validated.data.type !== existingTrip.type) throw new AdminError('Changing trip rendering modes requires a reviewed migration.', 409)
      if (existingTrip.type === 'andaman') {
        if (packagesInput !== undefined || ['pricing', 'itinerary', 'tierDetails', 'durLabels', 'durSubLabels'].some(key => {
          const value = envelope.body[key]
          return value !== undefined && value !== existingTrip[key as keyof typeof existingTrip]
        })) throw new AdminError('Andaman-specific pricing and itinerary are protected until a migration is approved.', 409)
      }
      const existing = await tx.tripPackage.findMany({ where: { tripId: id } })
      if (validated.data.status === 'published') {
        if (!envelope.metadata.publishConfirmed) throw new AdminError('Review and confirm this trip before publishing.', 409)
        const problems = publishProblems(validated.data, packagesInput === undefined ? existing : packages.data, existingTrip)
        if (problems.length) throw new AdminError(problems.join(' '), 422)
      }
      if (packagesInput !== undefined) {
        const ownedIds = new Set(existing.map(p => p.id))
        // Validate every supplied ID before making any changes, including deletions.
        if (packages.data.some(p => p.id !== undefined && !ownedIds.has(p.id))) {
          throw new AdminError('A selected package does not belong to this trip.', 400)
        }
        const keepIds = packages.data.flatMap(p => p.id === undefined ? [] : [p.id])
        const toDelete = existing.filter(p => !keepIds.includes(p.id)).map(p => p.id)
        const confirmed = new Set(envelope.metadata.removedPackageIds)
        if (toDelete.some(packageId => !confirmed.has(packageId)) || [...confirmed].some(packageId => !ownedIds.has(packageId))) {
          throw new AdminError('Package removal was not confirmed. Reload and explicitly remove the intended packages.', 409)
        }
        if (toDelete.length) await tx.tripPackage.deleteMany({ where: { tripId: id, id: { in: toDelete } } })
        for (const { id: packageId, ...payload } of packages.data) {
          if (packageId !== undefined) {
            const original = existing.find(p => p.id === packageId)!
            const submitted = (packagesInput as Record<string, unknown>[]).find(p => Number(p.id) === packageId)!
            for (const key of ['itinerary', 'inclusions', 'exclusions'] as const) {
              if (submitted[key] === original[key]) payload[key] = original[key]
            }
            const updated = await tx.tripPackage.updateMany({ where: { id: packageId, tripId: id }, data: payload })
            if (updated.count !== 1) throw new AdminError('Package changed during editing. Please reload.', 409)
          } else await tx.tripPackage.create({ data: { ...payload, tripId: id } })
        }
      }
      await saveUniversal(tx, { ...existingTrip, status: String(validated.data.status) }, envelope.metadata.universal, (access.session.user as { role: string }).role, existing)
      await tx.trip.update({ where: { id }, data: validated.data })
      return tx.trip.findUnique({ where: { id }, include: { packages: { orderBy: { sortOrder: 'asc' } } } })
    }, { isolationLevel: 'Serializable' })
    return NextResponse.json(result)
  } catch (error) { return adminError(error) }
}

export async function DELETE(req: NextRequest, { params }: Context) {
  const access = await adminAccess('admin', req)
  if (!access.ok) return access.response
  const id = positiveId((await params).id)
  if (!id) return NextResponse.json({ error: 'Invalid trip ID.' }, { status: 400 })
  try {
    await prisma.trip.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) { return adminError(error) }
}
