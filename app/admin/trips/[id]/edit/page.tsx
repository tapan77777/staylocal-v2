import TrekBuilder from '@/components/admin/TrekBuilder'
import { readAdminTrek } from '@/lib/treks/store'
import { trekWritesEnabled } from '@/lib/treks/flags'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import TripForm from '@/components/admin/TripForm'
import { requireAdmin } from '@/lib/requireAdmin'

export const metadata = { title: 'Edit package', robots: { index: false, follow: false } }

export const dynamic = 'force-dynamic'

export default async function EditTripPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  const parsed = Number.parseInt(id, 10)
  if (!Number.isFinite(parsed)) return notFound()
  const trek = await readAdminTrek(parsed)
  if (trek) return <TrekBuilder initial={trek} writeEnabled={trekWritesEnabled()} />
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
