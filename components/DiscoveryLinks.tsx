import Link from 'next/link'

// Visible server-rendered navigation independent of the optional welcome dialog.
export default function DiscoveryLinks() {
  return (
    <nav aria-label="Explore journeys" style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 10, padding: '24px 20px 12px' }}>
      {[['/treks', 'Explore Treks'], ['/tours', 'Explore Tours'], ['/trips', 'All trips']].map(([href, label]) => (
        <Link key={href} href={href} style={{ color: 'var(--green-dark)', background: 'var(--green-light)', border: '1px solid var(--border)', borderRadius: 999, padding: '12px 20px', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>{label} <span aria-hidden="true">↗</span></Link>
      ))}
    </nav>
  )
}
