'use client'
import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SessionProvider } from 'next-auth/react'

const NAV = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/trips', label: 'Trips' },
  { href: '/admin/experiences', label: 'Experiences' },
  { href: '/admin/bookings', label: 'Bookings' },
  { href: '/admin/users', label: 'Users' },
]

function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { data: session } = useSession()

  if (pathname === '/admin/login') return <>{children}</>

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{ width: 220, background: '#0d3d2e', flexShrink: 0, display: 'flex', flexDirection: 'column', padding: '24px 0' }}>
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontFamily: 'var(--font-playfair)', fontSize: 20, fontWeight: 700, color: '#fff' }}>
            Stay<span style={{ color: '#6ee7b7' }}>Local</span>
          </div>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>Admin Panel</p>
        </div>
        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {NAV.map(item => {
            const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
            return (
              <Link key={item.href} href={item.href} style={{
                padding: '10px 14px', borderRadius: 10, textDecoration: 'none',
                fontSize: 14, fontWeight: active ? 600 : 400,
                background: active ? '#059669' : 'transparent',
                color: active ? '#fff' : 'rgba(255,255,255,0.6)',
                transition: 'background 0.15s'
              }}>
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>{session?.user?.name}</p>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 12 }}>{session?.user?.email}</p>
          <button onClick={() => signOut({ callbackUrl: '/admin/login' })} style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', background: 'none', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', width: '100%' }}>
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header style={{ background: '#fff', borderBottom: '1px solid var(--border)', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12 }}>
          <Link href="/" target="_blank" style={{ fontSize: 13, color: 'var(--green)', textDecoration: 'none', fontWeight: 600 }}>
            View Site →
          </Link>
        </header>
        <main style={{ flex: 1, padding: '28px 24px', background: 'var(--bg)' }}>
          {children}
        </main>
      </div>
    </div>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AdminShell>{children}</AdminShell>
    </SessionProvider>
  )
}
