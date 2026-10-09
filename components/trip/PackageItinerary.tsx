'use client'
import { useState } from 'react'

export interface Day {
  day: string
  title: string
  desc: string
}

interface Props {
  packageLabel: string
  days: Day[]
  inclusions: string[]
  exclusions: string[]
  accommodation: string
  notes: string
}

export default function PackageItinerary({ packageLabel, days, inclusions, exclusions, accommodation, notes }: Props) {
  const [openDay, setOpenDay] = useState<number | null>(0)

  if (days.length === 0 && inclusions.length === 0 && exclusions.length === 0 && !accommodation) {
    return null
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {days.length > 0 && (
        <section>
          <h2 style={sectionTitle}>Itinerary — {packageLabel}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {days.map((d, i) => {
              const open = openDay === i
              return (
                <div
                  key={i}
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 14,
                    background: '#fff',
                    overflow: 'hidden',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setOpenDay(open ? null : i)}
                    aria-expanded={open}
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      padding: '14px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: 'inherit',
                    }}
                  >
                    <span
                      style={{
                        flex: '0 0 auto',
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: open ? 'var(--green)' : 'var(--green-light)',
                        color: open ? '#fff' : 'var(--green)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {i + 1}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        {d.day}
                      </p>
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', lineHeight: 1.3 }}>{d.title}</p>
                    </div>
                    <span style={{ fontSize: 18, color: 'var(--green)' }}>{open ? '−' : '+'}</span>
                  </button>
                  {open && (
                    <div style={{ padding: '0 16px 16px 60px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      {d.desc}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {accommodation && (
        <section style={card}>
          <h3 style={h3}>Accommodation</h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{accommodation}</p>
        </section>
      )}

      {(inclusions.length > 0 || exclusions.length > 0) && (
        <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 12 }}>
          {inclusions.length > 0 && (
            <div style={card}>
              <h3 style={h3}>✓ Included</h3>
              {inclusions.map((item, i) => (
                <p key={i} style={bullet}>• {item}</p>
              ))}
            </div>
          )}
          {exclusions.length > 0 && (
            <div style={card}>
              <h3 style={h3}>✕ Not included</h3>
              {exclusions.map((item, i) => (
                <p key={i} style={bullet}>• {item}</p>
              ))}
            </div>
          )}
        </section>
      )}

      {notes && (
        <section style={{ ...card, background: 'var(--green-light)', borderColor: 'rgba(29,158,117,0.3)' }}>
          <h3 style={h3}>Important notes</h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{notes}</p>
        </section>
      )}
    </div>
  )
}

const sectionTitle: React.CSSProperties = { fontFamily: 'var(--font-playfair)', fontSize: 20, fontWeight: 700, marginBottom: 14 }
const card: React.CSSProperties = { background: '#fff', border: '1px solid var(--border)', borderRadius: 16, padding: '18px 20px' }
const h3: React.CSSProperties = { fontWeight: 700, fontSize: 14, marginBottom: 10 }
const bullet: React.CSSProperties = { fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6, lineHeight: 1.5 }
