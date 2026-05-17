import { prisma } from '@/lib/prisma'
import AddExperience from '@/components/admin/AddExperience'

export const dynamic = 'force-dynamic'

export default async function AdminExperiences() {
  const experiences = await prisma.experience.findMany({ orderBy: { createdAt: 'desc' } })

  return (
    <>
      <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: 26, fontWeight: 700, marginBottom: 24 }}>Experiences</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-muted)' }}>
                {['Title','Location','Category','Status'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {experiences.map(e => (
                <tr key={e.id} style={{ borderTop: '1px solid var(--border-light)' }}>
                  <td style={td}>{e.title}</td>
                  <td style={td}>{e.location}</td>
                  <td style={td}>{e.category}</td>
                  <td style={td}>
                    <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 999, background: e.status === 'published' ? '#d1fae5' : '#f3f4f6', color: e.status === 'published' ? '#065f46' : '#6b7280' }}>
                      {e.status}
                    </span>
                  </td>
                </tr>
              ))}
              {experiences.length === 0 && (
                <tr><td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>No experiences yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <AddExperience />
      </div>
    </>
  )
}

const td: React.CSSProperties = { padding: '12px 16px', fontSize: 13 }
