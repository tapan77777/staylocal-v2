'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface Props {
  id: number
  current: string
}

export default function BookingActions({ id, current }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const update = async (status: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/admin/bookings/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setError(data.error || 'Could not update booking. Please retry.')
        return
      }
      router.refresh()
    } catch {
      setError('Network error. Booking status was not changed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 6 }}>
        {current !== 'confirmed' && (
          <button onClick={() => update('confirmed')} disabled={loading} style={btn('#065f46', '#d1fae5')}>Confirm</button>
        )}
        {current !== 'cancelled' && (
          <button onClick={() => update('cancelled')} disabled={loading} style={btn('#991b1b', '#fee2e2')}>Cancel</button>
        )}
      </div>
      {error && <p role="alert" style={{ color: '#b91c1c', fontSize: 12, marginTop: 6 }}>{error}</p>}
    </div>
  )
}

const btn = (color: string, bg: string): React.CSSProperties => ({
  fontSize: 11, padding: '4px 10px', borderRadius: 999, border: 'none', cursor: 'pointer',
  fontWeight: 600, background: bg, color
})
