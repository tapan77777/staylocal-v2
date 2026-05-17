import TripForm from '@/components/admin/TripForm'

export default function NewTripPage() {
  return (
    <>
      <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: 26, fontWeight: 700, marginBottom: 24 }}>Add New Trip</h1>
      <TripForm />
    </>
  )
}
