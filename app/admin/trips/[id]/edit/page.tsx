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
      <TripForm trip={trip} />
    </>
  )
}
