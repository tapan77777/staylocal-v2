import { prisma } from '@/lib/prisma'
import BookingActions from '@/components/admin/BookingActions'

export const dynamic = 'force-dynamic'

export default async function AdminBookings({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams
  const bookings = await prisma.booking.findMany({
    where: status ? { status } : {},
    orderBy: { createdAt: 'desc' }
  })

  const statuses = ['all', 'pending', 'confirmed', 'cancelled']

  return (
    <>
      <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: 26, fontWeight: 700, marginBottom: 20 }}>Bookings</h1>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {statuses.map(s => (
          <a key={s} href={s === 'all' ? '/admin/bookings' : `/admin/bookings?status=${s}`} style={{ padding: '6px 16px', borderRadius: 999, fontSize: 13, fontWeight: (status ?? 'all') === s ? 700 : 400, background: (status ?? 'all') === s ? 'var(--green)' : 'var(--bg-muted)', color: (status ?? 'all') === s ? '#fff' : 'var(--text-secondary)', textDecoration: 'none', textTransform: 'capitalize' }}>
            {s}
          </a>
        ))}
      </div>
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-muted)' }}>
                {['Name','Phone','Email','Trip','People','Month','Status','Date','Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bookings.map(b => (
                <tr key={b.id} style={{ borderTop: '1px solid var(--border-light)' }}>
                  <td style={td}>{b.name}</td>
                  <td style={td}>{b.phone}</td>
                  <td style={td}>{b.email || '—'}</td>
                  <td style={td}>{b.tripSlug}</td>
                  <td style={td}>{b.people}</td>
                  <td style={td}>{b.month || '—'}</td>
                  <td style={td}>
                    <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 999, background: b.status === 'confirmed' ? '#d1fae5' : b.status === 'cancelled' ? '#fee2e2' : '#fef3c7', color: b.status === 'confirmed' ? '#065f46' : b.status === 'cancelled' ? '#991b1b' : '#92400e' }}>
                      {b.status}
                    </span>
                  </td>
                  <td style={td}>{new Date(b.createdAt).toLocaleDateString('en-IN')}</td>
                  <td style={td}><BookingActions id={b.id} current={b.status} /></td>
                </tr>
              ))}
              {bookings.length === 0 && (
                <tr><td colSpan={9} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>No bookings found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

const td: React.CSSProperties = { padding: '12px 16px', fontSize: 13, color: '#1a1a1a', whiteSpace: 'nowrap' }
