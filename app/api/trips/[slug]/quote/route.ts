import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { loadUniversal } from '@/lib/universal-store'
import { quoteOffer } from '@/lib/universal-trip'

const input = z.strictObject({ packageSlug: z.string().min(1).max(80), people: z.number().int().min(1).max(50), promoCode: z.string().max(80).default('') })
export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  let body: unknown
  try { body = await req.json() } catch { return Response.json({ error: 'Invalid JSON.' }, { status: 400 }) }
  const parsed = input.safeParse(body)
  if (!parsed.success) return Response.json({ error: 'Invalid offer or traveller count.' }, { status: 400 })
  try {
    const trip = await prisma.trip.findUnique({ where: { slug: (await params).slug }, include: { packages: { where: { status: 'published' } } } })
    if (!trip || trip.status !== 'published') return Response.json({ error: 'Trip not found.' }, { status: 404 })
    const config = await loadUniversal(trip)
    if (!config) return Response.json({ error: 'Universal pricing is not enabled for this trip.' }, { status: 404 })
    try { return Response.json(quoteOffer(config, trip.packages, parsed.data.packageSlug, parsed.data.people, parsed.data.promoCode), { headers: { 'Cache-Control': 'no-store' } }) }
    catch (e) { return Response.json({ error: (e as Error).message }, { status: 400 }) }
  } catch { return Response.json({ error: 'Pricing is temporarily unavailable.' }, { status: 503 }) }
}
