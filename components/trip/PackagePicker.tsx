'use client'
import { calculatePackageTotal, formatInr } from '@/lib/pricing'

export interface Package {
  id: number
  slug: string
  label: string
  days: number
  nights: number
  priceAdult: number
  priceBasis: string
  priceOnRequest: boolean
  image: string
  accommodation: string
  notes: string
}

interface Props {
  packages: Package[]
  selectedId: number
  people: number
  onSelect: (id: number) => void
  onPeopleChange: (next: number) => void
  heroImage: string
  minPeople?: number
  maxPeople?: number
}

export default function PackagePicker({
  packages,
  selectedId,
  people,
  onSelect,
  onPeopleChange,
  heroImage,
  minPeople = 1,
  maxPeople = 50,
}: Props) {
  const selected = packages.find(p => p.id === selectedId) ?? packages[0]
  if (!selected) return null
  const total = selected.priceOnRequest ? null : calculatePackageTotal(selected.priceAdult, people)

  return (
    <div>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
        Choose a package
      </p>

      <div className="hide-scrollbar" style={scrollRow}>
        {packages.map(p => {
          const active = p.id === selected.id
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelect(p.id)}
              aria-pressed={active}
              style={{
                flex: '0 0 70vw',
                maxWidth: 260,
                scrollSnapAlign: 'start',
                border: `2px solid ${active ? 'var(--green)' : 'var(--border)'}`,
                background: active ? 'var(--green-light)' : '#fff',
                borderRadius: 16,
                padding: 0,
                overflow: 'hidden',
                textAlign: 'left',
                cursor: 'pointer',
                boxShadow: active ? '0 10px 24px -14px rgba(29,158,117,0.5)' : 'none',
                transition: 'border-color 120ms, background 120ms',
                fontFamily: 'inherit',
              }}
            >
              <div style={{ height: 110, overflow: 'hidden', position: 'relative' }}>
                <img
                  src={p.image || heroImage}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
                <span style={durationBadge}>{p.days}D / {p.nights}N</span>
              </div>
              <div style={{ padding: '12px 14px' }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: active ? 'var(--green)' : '#1a1a1a', lineHeight: 1.25, marginBottom: 2 }}>
                  {p.label}
                </p>
                {p.accommodation && (
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, lineHeight: 1.3 }}>
                    {p.accommodation}
                  </p>
                )}
                {p.priceOnRequest ? (
                  <>
                    <p style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>price</p>
                    <p style={{ fontSize: 15, fontWeight: 700, color: active ? 'var(--green)' : '#1a1a1a' }}>
                      On request
                    </p>
                    <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>Shared on enquiry</p>
                  </>
                ) : (
                  <>
                    <p style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>from</p>
                    <p style={{ fontSize: 16, fontWeight: 700, color: active ? 'var(--green)' : '#1a1a1a' }}>
                      {formatInr(p.priceAdult)}
                    </p>
                    <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{p.priceBasis}</p>
                  </>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* People selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 20 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>TRAVELLERS</p>
        <button
          type="button"
          onClick={() => onPeopleChange(Math.max(minPeople, people - 1))}
          disabled={people <= minPeople}
          style={circBtn}
          aria-label="Decrease travellers"
        >
          −
        </button>
        <span style={{ fontSize: 22, fontWeight: 700, minWidth: 36, textAlign: 'center' }}>{people}</span>
        <button
          type="button"
          onClick={() => onPeopleChange(Math.min(maxPeople, people + 1))}
          disabled={people >= maxPeople}
          style={circBtn}
          aria-label="Increase travellers"
        >
          +
        </button>
      </div>

      {/* Summary */}
      <div
        style={{
          marginTop: 18,
          background: 'var(--bg-muted)',
          borderRadius: 14,
          padding: '16px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        {selected.priceOnRequest || total === null ? (
          <>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              {selected.label} for {people} {people === 1 ? 'traveller' : 'travellers'}
            </p>
            <p style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a' }}>Price on request</p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Supplier pricing is still being finalised. Share your dates and group size — we&apos;ll send a confirmed quote back by WhatsApp.
            </p>
          </>
        ) : (
          <>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              Estimated total for {people} {people === 1 ? 'traveller' : 'travellers'} on {selected.label}
            </p>
            <p style={{ fontSize: 26, fontWeight: 700, color: '#1a1a1a' }}>{formatInr(total)}</p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              This is an estimate — final quote (incl. taxes, dates, room-sharing) is confirmed on enquiry before any booking.
            </p>
          </>
        )}
        {selected.notes && (
          <p style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 4 }}>
            Note: {selected.notes}
          </p>
        )}
      </div>
    </div>
  )
}

const scrollRow: React.CSSProperties = {
  display: 'flex',
  gap: 12,
  overflowX: 'auto',
  overflowY: 'hidden',
  scrollSnapType: 'x mandatory',
  padding: '4px 2px 12px',
  WebkitOverflowScrolling: 'touch',
}

const circBtn: React.CSSProperties = {
  width: 38,
  height: 38,
  borderRadius: '50%',
  border: '1.5px solid var(--border)',
  background: '#fff',
  fontSize: 20,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: 'inherit',
}

const durationBadge: React.CSSProperties = {
  position: 'absolute',
  top: 10,
  left: 10,
  background: 'rgba(0,0,0,0.65)',
  color: '#fff',
  padding: '4px 10px',
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 600,
}
