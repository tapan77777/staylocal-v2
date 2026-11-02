import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { AdminError } from '@/lib/admin-errors'
import { calculatePackageTotal } from '@/lib/pricing'
import { trekContentSchema, departureIsEnquirable, type TrekDeparture } from './schema'

export async function saveTrekEnquiry(tripId: number, data: { name: string; phone: string; email: string; tripSlug: string; people: number; month: string; message: string; packageId: number | null }, selected: unknown) {
  if (selected !== undefined && (typeof selected !== 'string' || selected.length > 80)) throw new AdminError('Invalid departure selection.', 400)
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const row = await tx.trekContent.findUnique({ where: { tripId }, include: { trip: true, package: true } })
    if (!row || row.trip.status !== 'published' || row.package.status !== 'published') throw new AdminError('This trek is not available for enquiry.', 400)
    const content = trekContentSchema.parse(row.config)
    if (content.fixture) throw new AdminError('This trek is not available.', 404)
    if (content.enquiryOnly) throw new AdminError('Please enquire on WhatsApp for dates & pricing.', 409)
    if (data.packageId !== null && data.packageId !== row.packageId) throw new AdminError('Selected package does not belong to this trek.', 400)
    const departure = selected ? await tx.trekDeparture.findUnique({ where: { id: selected as string } }) : null
    if (selected && (!departure || departure.tripId !== tripId)) throw new AdminError('Selected departure does not belong to this trek.', 400)
    if (departure && !departureIsEnquirable({ ...departure, startDate: departure.startDate.toISOString().slice(0, 10), endDate: departure.endDate.toISOString().slice(0, 10) } as TrekDeparture)) throw new AdminError('This departure is not open for enquiries. Please choose another date or request a custom date.', 409)
    if (departure?.capacity && data.people > departure.capacity) throw new AdminError('Your group exceeds the declared batch capacity. Please request a custom date.', 400)
    const priceAdult = departure?.priceAdult ?? row.package.priceAdult
    if (!Number.isInteger(priceAdult) || priceAdult <= 0) throw new AdminError('Trek pricing needs operator confirmation.', 503)
    const estimatedPrice = calculatePackageTotal(priceAdult, data.people)
    const recent = await tx.booking.findFirst({ where: { phone: data.phone, tripSlug: data.tripSlug, createdAt: { gte: new Date(Date.now() - 120000) } }, include: { trekEnquiry: true } })
    if (recent) {
      if (recent.trekEnquiry?.departureId !== (departure?.id ?? null) || recent.people !== data.people || recent.estimatedPrice !== estimatedPrice) throw new AdminError('Your recent enquiry has different selections. Please wait two minutes before resending.', 409)
      return { success: true, duplicate: true, id: recent.id, packageId: recent.packageId, packageLabel: recent.packageLabel, estimatedPrice: recent.estimatedPrice }
    }
    const booking = await tx.booking.create({ data: { ...data, packageId: row.packageId, packageLabel: row.package.label, estimatedPrice } })
    await tx.trekEnquiry.create({ data: { bookingId: booking.id, tripId, departureId: departure?.id ?? null, departureLabel: departure ? `${departure.startDate.toISOString().slice(0, 10)} – ${departure.endDate.toISOString().slice(0, 10)}` : 'Custom dates requested', priceAdult } })
    return { success: true, id: booking.id, packageId: row.packageId, packageLabel: row.package.label, estimatedPrice }
  }, { isolationLevel: 'Serializable' })
}
