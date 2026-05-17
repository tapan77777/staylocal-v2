import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function AdminUsers() {
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } })

  return (
    <>
      <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: 26, fontWeight: 700, marginBottom: 24 }}>Users</h1>
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-muted)' }}>
              {['Name','Email','Role','Joined'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderTop: '1px solid var(--border-light)' }}>
                <td style={td}>{u.name}</td>
                <td style={td}>{u.email}</td>
                <td style={td}>
                  <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 999, background: u.role === 'admin' ? '#dbeafe' : '#f3f4f6', color: u.role === 'admin' ? '#1d4ed8' : '#6b7280' }}>
                    {u.role}
                  </span>
                </td>
                <td style={td}>{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

const td: React.CSSProperties = { padding: '12px 16px', fontSize: 13 }
