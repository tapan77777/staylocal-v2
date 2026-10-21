import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { adminAccess } from '@/lib/admin-access'
import { adminError, AdminError, positiveId } from '@/lib/admin-errors'
import { isBookingStatus, canChangeBookingStatus } from '@/lib/booking-status'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const access = await adminAccess('admin', req)
  if (!access.ok) return access.response
  const id = positiveId((await params).id)
  if (!id) return NextResponse.json({ error: 'Invalid booking ID.' }, { status: 400 })
  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(k => k !== 'status') || !('status' in body) || !isBookingStatus(body.status)) {
    return NextResponse.json({ error: 'Status must be pending, confirmed, or cancelled.' }, { status: 400 })
  }
  const status = body.status
  try {
    const booking = await prisma.$transaction(async tx => {
      const current = await tx.booking.findUnique({ where: { id } })
      if (!current) throw new AdminError('Booking not found.', 404)
      if (!canChangeBookingStatus(current.status, status)) throw new AdminError('This status transition is not allowed.', 409)
      if (current.status !== status) {
        const update = await tx.booking.updateMany({ where: { id, status: current.status }, data: { status } })
        if (update.count !== 1) throw new AdminError('Booking changed during editing. Please reload and retry.', 409)
      }
      return { ...current, status }
    })
    return NextResponse.json(booking)
  } catch (error) { return adminError(error) }
}
