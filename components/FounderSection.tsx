import Link from 'next/link'

interface Experience {
  id: number
  slug: string
  title: string
  location: string
  category: string
  description: string
  visited: boolean
}

interface Props {
  experiences: Experience[]
}

function categoryEmoji(category: string): string {
  switch (category) {
    case 'Mountains': return '⛰️'
    case 'Islands': return '🏝️'
    case 'Hills': return '🌿'
    case 'Wildlife': return '🐘'
    case 'Beach': return '🏖️'
    case 'Trek': return '🥾'
    default: return '🗺️'
  }
}

export default function FounderSection({ experiences }: Props) {
  return (
    <section style={{ background: '#fff', padding: '56px 0' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', paddingLeft: 20, paddingRight: 20 }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--green)', display: 'block', marginBottom: 12 }}>
          From the founder
        </span>
        <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: 28, fontWeight: 700, color: '#1a1a1a', marginBottom: 24 }}>
          Places I&apos;ve been
        </h2>

        {/* Founder card */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 32, background: 'var(--bg-muted)', borderRadius: 14, padding: '16px 20px', maxWidth: 340 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 20, fontWeight: 700, flexShrink: 0 }}>
            T
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: 15 }}>Tapan Naik</p>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Founder · StayLocal</p>
          </div>
        </div>
      </div>

      {/* Horizontal scroll */}
      <div className="hide-scrollbar" style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingLeft: 20, paddingRight: 20, paddingBottom: 4 }}>
        {experiences.length === 0 && (
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No experiences added yet.</p>
        )}
        {experiences.map(exp => (
          <Link key={exp.id} href={`/trip/${exp.slug}`} style={{ textDecoration: 'none', color: 'inherit', flexShrink: 0 }}>
            <div style={{
              width: 180, background: 'var(--bg-muted)',
              borderRadius: 14, padding: '18px 16px', border: '1px solid var(--border-light)',
              cursor: 'pointer',
            }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>{categoryEmoji(exp.category)}</div>
              <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 4, lineHeight: 1.3 }}>{exp.title}</p>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 10 }}>{exp.location}</p>
              <span style={{ fontSize: 10, fontWeight: 700, background: 'var(--green-light)', color: 'var(--green)', padding: '3px 8px', borderRadius: 999 }}>
                Been there ✓
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
