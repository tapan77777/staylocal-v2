import TripForm from '@/components/admin/TripForm'
import { requireAdmin } from '@/lib/requireAdmin'

export default async function NewTripPage() {
  await requireAdmin()
  return (
    <>
      <TripForm />
    </>
  )
}
