import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminTrips() {
  const trips = await prisma.trip.findMany({ orderBy: { createdAt: 'desc' } })

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: 26, fontWeight: 700 }}>Trips</h1>
        <Link href="/admin/trips/new" style={{ background: 'var(--green)', color: '#fff', padding: '10px 20px', borderRadius: 999, textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
          + Add New Trip
        </Link>
      </div>
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-muted)' }}>
                {['Image','Title','Category','Price','Status','Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trips.map(trip => (
                <tr key={trip.id} style={{ borderTop: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '12px 16px' }}>
                    {trip.image ? (
                      <img src={trip.image} alt="" style={{ width: 60, height: 40, objectFit: 'cover', borderRadius: 8 }} />
                    ) : (
                      <div style={{ width: 60, height: 40, background: 'var(--bg-muted)', borderRadius: 8 }} />
                    )}
                  </td>
                  <td style={td}>
                    <p style={{ fontWeight: 600 }}>{trip.title}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{trip.location}</p>
                  </td>
                  <td style={td}>{trip.category}</td>
                  <td style={td}>₹{trip.price.toLocaleString('en-IN')}</td>
                  <td style={td}>
                    <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 999, background: trip.status === 'published' ? '#d1fae5' : '#f3f4f6', color: trip.status === 'published' ? '#065f46' : '#6b7280' }}>
                      {trip.status}
                    </span>
                  </td>
                  <td style={td}>
                    <Link href={`/admin/trips/${trip.id}/edit`} style={{ fontSize: 13, color: 'var(--green)', textDecoration: 'none', fontWeight: 600 }}>Edit</Link>
                    {' · '}
                    <Link href={`/trip/${trip.slug}`} target="_blank" style={{ fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none' }}>View</Link>
                  </td>
                </tr>
              ))}
              {trips.length === 0 && (
                <tr><td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>No trips yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

const td: React.CSSProperties = { padding: '12px 16px', fontSize: 13, color: '#1a1a1a' }
