import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, phone, email, tripSlug, people, month, message } = body
    if (!name || !phone || !tripSlug) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    const booking = await prisma.booking.create({
      data: { name, phone, email: email || '', tripSlug, people: people || 2, month: month || '', message: message || '' }
    })
    return NextResponse.json({ success: true, id: booking.id })
  } catch {
    return NextResponse.json({ error: 'Failed to save booking' }, { status: 500 })
  }
}

export async function GET() {
  const bookings = await prisma.booking.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(bookings)
}
