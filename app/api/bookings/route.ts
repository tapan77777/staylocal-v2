import { NextRequest, NextResponse } from 'next/server'
import { adminAccess } from '@/lib/admin-access'
import { adminError } from '@/lib/admin-errors'
import { prisma } from '@/lib/prisma'
import { validateBooking } from '@/lib/validation'
import { calculatePackageTotal } from '@/lib/pricing'
import { loadUniversal, legacyPackages } from '@/lib/universal-store'
import { quoteOffer } from '@/lib/universal-trip'
import { z } from 'zod'

export async function POST(req: NextRequest) {
  let payload: unknown
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const result = validateBooking(payload)
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }
  const data = result.data

  const trip = await prisma.trip.findUnique({
    where: { slug: data.tripSlug },
    include: { packages: true },
  })
  if (!trip || trip.status !== 'published') {
    return NextResponse.json({ error: 'This trip is not available for enquiry.' }, { status: 400 })
  }

  let packageId: number | null = null
  let packageLabel = ''
  let estimatedPrice: number | null = null
  let universal
  try { universal = await loadUniversal(trip) } catch { return NextResponse.json({ error: 'Pricing is temporarily unavailable.' }, { status: 503 }) }
  if (!universal && (payload as Record<string, unknown>).universalSelection !== undefined) return NextResponse.json({ error: 'This offer has changed. Reload the trip before enquiring.' }, { status: 409 })
  if (universal) {
    const selection = z.strictObject({ packageSlug: z.string().min(1).max(80), promoCode: z.string().max(80).default('') }).safeParse((payload as Record<string, unknown>).universalSelection)
    if (!selection.success) return NextResponse.json({ error: 'Choose an available offer before enquiring.' }, { status: 400 })
    const pkg = trip.packages.find(p => p.id === data.packageId && p.slug === selection.data.packageSlug)
    if (!pkg) return NextResponse.json({ error: 'Selected offer does not belong to this trip.' }, { status: 400 })
    try {
      const quote = quoteOffer(universal, trip.packages, pkg.slug, data.people, selection.data.promoCode)
      packageId = pkg.id; packageLabel = pkg.label; estimatedPrice = quote.total
    } catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 400 }) }
  }
  if (!universal && data.packageId !== null) {
    const pkg = legacyPackages(trip.packages).find(p => p.id === data.packageId)
    if (!pkg) {
      return NextResponse.json({ error: 'Selected package is not available for this trip.' }, { status: 400 })
    }
    if (pkg.status !== 'published') {
      return NextResponse.json({ error: 'Selected package is not available right now.' }, { status: 400 })
    }
    packageId = pkg.id
    packageLabel = pkg.label
    estimatedPrice = pkg.priceOnRequest ? null : calculatePackageTotal(pkg.priceAdult, data.people)
  }

  // basic duplicate suppression — same phone + same trip within last 2 minutes
  const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000)
  const recent = await prisma.booking.findFirst({
    where: { phone: data.phone, tripSlug: data.tripSlug, createdAt: { gte: twoMinAgo } },
  })
  if (recent) {
    if (universal && (recent.packageId !== packageId || recent.people !== data.people || recent.estimatedPrice !== estimatedPrice)) return NextResponse.json({ error: 'A recent enquiry has different selections. Please wait two minutes before sending another.' }, { status: 409 })
    return NextResponse.json({ success: true, id: recent.id, duplicate: true, ...(universal ? { packageId: recent.packageId, packageLabel: recent.packageLabel, estimatedPrice: recent.estimatedPrice } : {}) })
  }

  try {
    const booking = await prisma.booking.create({
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email,
        tripSlug: data.tripSlug,
        people: data.people,
        month: data.month,
        message: data.message,
        packageId,
        packageLabel,
        estimatedPrice,
      },
    })
    return NextResponse.json({
      success: true,
      id: booking.id,
      packageId,
      packageLabel,
      estimatedPrice,
    })
  } catch {
    return NextResponse.json({ error: 'We could not save your enquiry. Please try again or WhatsApp us.' }, { status: 500 })
  }
}

export async function GET() {
  const access = await adminAccess('admin')
  if (!access.ok) return access.response
  try {
    const bookings = await prisma.booking.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json(bookings)
  } catch (error) { return adminError(error) }
}
