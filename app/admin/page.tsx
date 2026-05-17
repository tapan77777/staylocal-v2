import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const [totalTrips, publishedTrips, totalBookings, pendingBookings, recentBookings] = await Promise.all([
    prisma.trip.count(),
    prisma.trip.count({ where: { status: 'published' } }),
    prisma.booking.count(),
    prisma.booking.count({ where: { status: 'pending' } }),
    prisma.booking.findMany({ orderBy: { createdAt: 'desc' }, take: 10 }),
  ])

  const stats = [
    { label: 'Total Trips', value: totalTrips, color: '#1a1a1a' },
    { label: 'Published', value: publishedTrips, color: 'var(--green)' },
    { label: 'Total Bookings', value: totalBookings, color: '#1a1a1a' },
    { label: 'Pending', value: pendingBookings, color: '#d97706' },
  ]

  return (
    <>
      <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: 26, fontWeight: 700, marginBottom: 24 }}>Dashboard</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 36 }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, padding: '20px 20px' }}>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>{s.label}</p>
            <p style={{ fontSize: 32, fontWeight: 700, color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontWeight: 700, fontSize: 16 }}>Recent Bookings</h2>
          <Link href="/admin/bookings" style={{ fontSize: 13, color: 'var(--green)', textDecoration: 'none' }}>View all →</Link>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-muted)' }}>
                {['Name','Phone','Trip','People','Month','Status','Date'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentBookings.map(b => (
                <tr key={b.id} style={{ borderTop: '1px solid var(--border-light)' }}>
                  <td style={td}>{b.name}</td>
                  <td style={td}>{b.phone}</td>
                  <td style={td}>{b.tripSlug}</td>
                  <td style={td}>{b.people}</td>
                  <td style={td}>{b.month}</td>
                  <td style={td}>
                    <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 999, background: b.status === 'confirmed' ? '#d1fae5' : b.status === 'cancelled' ? '#fee2e2' : '#fef3c7', color: b.status === 'confirmed' ? '#065f46' : b.status === 'cancelled' ? '#991b1b' : '#92400e' }}>
                      {b.status}
                    </span>
                  </td>
                  <td style={td}>{new Date(b.createdAt).toLocaleDateString('en-IN')}</td>
                </tr>
              ))}
              {recentBookings.length === 0 && (
                <tr><td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>No bookings yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

const td: React.CSSProperties = { padding: '12px 16px', fontSize: 13, color: '#1a1a1a' }
