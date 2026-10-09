'use client'
import Reveal from './Reveal'

function openPlanner(travellers: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('planner:open', { detail: { travellers } }))
  }
}

const STYLES = [
  {
    key: 'couple',
    label: 'Couples',
    blurb: 'Quieter mornings, better views, thoughtful stays.',
    image: 'https://images.unsplash.com/photo-1500835556837-99ac94a94552?auto=format&fit=crop&w=900&q=70',
  },
  {
    key: 'family',
    label: 'Families',
    blurb: 'Comfort first, flexible days, something for every age.',
    image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=900&q=70',
  },
  {
    key: 'friends',
    label: 'Friends',
    blurb: 'Treks, campfires, playlists, late dinners.',
    image: 'https://images.unsplash.com/photo-1527525443983-6e60c75fff46?auto=format&fit=crop&w=900&q=70',
  },
  {
    key: 'solo',
    label: 'Solo travellers',
    blurb: 'Small groups, meet-your-pace plans, safe stays.',
    image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=900&q=70',
  },
]

export default function TravelByStyle() {
  return (
    <section
      id="travel-by-style"
      style={{
        padding: 'clamp(56px, 9vh, 96px) 20px',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Reveal>
          <div style={{ marginBottom: 28, maxWidth: 680 }}>
            <p className="eyebrow" style={{ marginBottom: 10 }}>Travel by style</p>
            <h2 className="section-title">However you&apos;re travelling.</h2>
            <p
              style={{
                color: 'var(--text-secondary)',
                fontSize: 'clamp(14px, 1.4vw, 16px)',
                lineHeight: 1.6,
                marginTop: 10,
              }}
            >
              Pick who&apos;s coming along and we&apos;ll pre-fill the planner. You can still change
              everything on the next step — nothing is locked in.
            </p>
          </div>
        </Reveal>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 14,
          }}
        >
          {STYLES.map((s, i) => (
            <Reveal key={s.key} delay={i * 70}>
              <button
                type="button"
                onClick={() => openPlanner(s.key)}
                aria-label={`Plan a ${s.label.toLowerCase()} trip`}
                className="group lift"
                style={{
                  display: 'block',
                  position: 'relative',
                  width: '100%',
                  height: 260,
                  borderRadius: 20,
                  overflow: 'hidden',
                  color: '#fff',
                  textDecoration: 'none',
                  background: '#0b1510',
                  boxShadow: 'var(--shadow-md)',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  textAlign: 'left',
                }}
              >
                <img
                  src={s.image}
                  alt=""
                  className="card-img"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    opacity: 0.9,
                  }}
                />
                <div
                  aria-hidden
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background:
                      'linear-gradient(180deg, rgba(0,0,0,0.05) 25%, rgba(0,0,0,0.75) 100%)',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    padding: 20,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    gap: 4,
                  }}
                >
                  <h3
                    style={{
                      fontFamily: 'var(--font-playfair)',
                      fontSize: 22,
                      fontWeight: 700,
                      lineHeight: 1.1,
                    }}
                  >
                    {s.label}
                  </h3>
                  <p
                    style={{
                      fontSize: 13,
                      color: 'rgba(255,255,255,0.85)',
                      lineHeight: 1.5,
                      marginBottom: 6,
                    }}
                  >
                    {s.blurb}
                  </p>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#9FE4C4',
                    }}
                  >
                    Start here →
                  </span>
                </div>
              </button>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
