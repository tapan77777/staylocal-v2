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

  const update = async (status: string) => {
    setLoading(true)
    await fetch(`/api/admin/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    })
    setLoading(false)
    router.refresh()
  }

  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {current !== 'confirmed' && (
        <button onClick={() => update('confirmed')} disabled={loading} style={btn('#065f46', '#d1fae5')}>Confirm</button>
      )}
      {current !== 'cancelled' && (
        <button onClick={() => update('cancelled')} disabled={loading} style={btn('#991b1b', '#fee2e2')}>Cancel</button>
      )}
    </div>
  )
}

const btn = (color: string, bg: string): React.CSSProperties => ({
  fontSize: 11, padding: '4px 10px', borderRadius: 999, border: 'none', cursor: 'pointer',
  fontWeight: 600, background: bg, color
})
