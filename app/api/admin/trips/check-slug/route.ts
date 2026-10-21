import { NextRequest, NextResponse } from 'next/server'
import { adminAccess } from '@/lib/admin-access'
import { prisma } from '@/lib/prisma'
import { adminError } from '@/lib/admin-errors'
import { slugify } from '@/lib/trip-builder'
import { randomUUID } from 'node:crypto'

export async function GET(req: NextRequest) {
  const access = await adminAccess('content')
  if (!access.ok) return access.response
  const slug = req.nextUrl.searchParams.get('slug') ?? ''
  if (!slug || slug.length > 80 || slugify(slug) !== slug) return NextResponse.json({ error: 'Use lowercase letters, numbers, and hyphens.' }, { status: 400 })
  try {
    const existing = await prisma.trip.findUnique({ where: { slug }, select: { id: true } })
    const suggestion = existing ? `${slug.slice(0, 70).replace(/-$/, '')}-${randomUUID().slice(0, 8)}` : undefined
    const suggestionTaken = suggestion ? await prisma.trip.findUnique({ where: { slug: suggestion }, select: { id: true } }) : null
    return NextResponse.json({ available: !existing, suggestion: suggestionTaken ? undefined : suggestion }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) { return adminError(error) }
}
