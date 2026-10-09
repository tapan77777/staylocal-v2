import TripForm from '@/components/admin/TripForm'
import { requireAdmin } from '@/lib/requireAdmin'

export default async function NewTripPage() {
  await requireAdmin()
  return (
    <>
      <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: 26, fontWeight: 700, marginBottom: 24 }}>Add New Trip</h1>
      <TripForm />
    </>
  )
}
