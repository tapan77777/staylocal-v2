import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, isAdminRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { validateBooking } from '@/lib/validation'
import { calculatePackageTotal } from '@/lib/pricing'

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
  if (data.packageId !== null) {
    const pkg = trip.packages.find(p => p.id === data.packageId)
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
    return NextResponse.json({ success: true, id: recent.id, duplicate: true })
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
  const session = await getServerSession(authOptions)
  const role = (session?.user as { role?: string } | undefined)?.role
  if (!session || !isAdminRole(role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const bookings = await prisma.booking.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(bookings)
}
