import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import TripForm from '@/components/admin/TripForm'
import { requireAdmin } from '@/lib/requireAdmin'

export const dynamic = 'force-dynamic'

export default async function EditTripPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  const parsed = Number.parseInt(id, 10)
  if (!Number.isFinite(parsed)) return notFound()
  const trip = await prisma.trip.findUnique({
    where: { id: parsed },
    include: { packages: { orderBy: { sortOrder: 'asc' } } },
  })
  if (!trip) return notFound()
  return (
    <>
      <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: 26, fontWeight: 700, marginBottom: 24 }}>Edit Trip</h1>
      <TripForm trip={trip} />
    </>
  )
}
