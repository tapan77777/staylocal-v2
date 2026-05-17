import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const trips = await prisma.trip.findMany({ where: { status: 'published' }, orderBy: { createdAt: 'desc' } })
  return NextResponse.json(trips)
}
