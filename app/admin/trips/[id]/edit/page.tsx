import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import TripForm from '@/components/admin/TripForm'

export const dynamic = 'force-dynamic'

export default async function EditTripPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const trip = await prisma.trip.findUnique({ where: { id: parseInt(id) } })
  if (!trip) return notFound()
  return (
    <>
      <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: 26, fontWeight: 700, marginBottom: 24 }}>Edit Trip</h1>
      <TripForm trip={trip} />
    </>
  )
}
