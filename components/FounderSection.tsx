import Link from 'next/link'
import Reveal from './Reveal'

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
    <section
      style={{
        background: '#fff',
        padding: 'clamp(56px, 9vh, 96px) 0',
        borderTop: '1px solid var(--border-light)',
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: '0 20px',
        }}
      >
        <div
          className="founder-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr)',
            gap: 32,
            alignItems: 'start',
          }}
        >
          <Reveal>
            <div>
              <p className="eyebrow" style={{ marginBottom: 10 }}>From the founder</p>
              <h2
                className="section-title"
                style={{ marginBottom: 14 }}
              >
                Places I&apos;ve actually been.
              </h2>
              <p
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: 'clamp(14px, 1.4vw, 16px)',
                  lineHeight: 1.65,
                  marginBottom: 18,
                  maxWidth: 480,
                }}
              >
                Every trip here is somewhere I&apos;ve travelled, eaten, taken the local bus, or
                slept in the guesthouse I now recommend. If I haven&apos;t been, we don&apos;t sell it.
              </p>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 14,
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 14,
                  padding: '12px 16px',
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: 'var(--green)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: 18,
                    fontWeight: 700,
                    flexShrink: 0,
                    fontFamily: 'var(--font-playfair)',
                  }}
                >
                  T
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 14 }}>Tapan Naik</p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    Founder · StayLocal
                  </p>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div
              className="hide-scrollbar"
              style={{
                display: 'flex',
                gap: 12,
                overflowX: 'auto',
                paddingBottom: 4,
              }}
            >
              {experiences.length === 0 && (
                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                  Experiences list coming soon.
                </p>
              )}
              {experiences.map(exp => (
                <Link
                  key={exp.id}
                  href={`/trip/${exp.slug}`}
                  className="lift"
                  style={{
                    textDecoration: 'none',
                    color: 'inherit',
                    flexShrink: 0,
                    width: 200,
                    background: 'var(--bg)',
                    borderRadius: 16,
                    padding: '20px 18px',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div style={{ fontSize: 28, marginBottom: 12 }}>
                    {categoryEmoji(exp.category)}
                  </div>
                  <p
                    style={{
                      fontFamily: 'var(--font-playfair)',
                      fontSize: 15,
                      fontWeight: 700,
                      marginBottom: 4,
                      lineHeight: 1.25,
                    }}
                  >
                    {exp.title}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 10 }}>
                    {exp.location}
                  </p>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      background: 'var(--green-light)',
                      color: 'var(--green)',
                      padding: '3px 8px',
                      borderRadius: 999,
                    }}
                  >
                    Been there ✓
                  </span>
                </Link>
              ))}
            </div>
          </Reveal>
        </div>
      </div>

      <style>{`
        @media (min-width: 820px) {
          .founder-grid { grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr) !important; gap: 48px !important; }
        }
      `}</style>
    </section>
  )
}
