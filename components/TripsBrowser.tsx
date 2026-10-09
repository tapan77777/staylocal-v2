'use client'
import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import TripCard from './TripCard'

interface Trip {
  id: number
  slug: string
  title: string
  subtitle: string
  location: string
  category: string
  duration: string
  difficulty: string
  price: number
  image: string
  gallery: string
  route: string
  status: string
}

interface Filters {
  q: string
  category: string
  duration: string
  price: string
  sort: string
}

interface Props {
  trips: Trip[]
  categories: string[]
  initial: Filters
}

const DURATION_BUCKETS = [
  { key: '', label: 'Any' },
  { key: 'short', label: 'Up to 3 days' },
  { key: 'mid', label: '4–6 days' },
  { key: 'long', label: '7+ days' },
]

const PRICE_BUCKETS = [
  { key: '', label: 'Any' },
  { key: '0-10000', label: 'Under ₹10k' },
  { key: '10000-25000', label: '₹10k–25k' },
  { key: '25000-50000', label: '₹25k–50k' },
  { key: '50000-', label: '₹50k+' },
]

function durationDays(d: string): number {
  const m = d.match(/(\d+)\s*D/i)
  if (m) return parseInt(m[1], 10)
  const n = d.match(/(\d+)/)
  return n ? parseInt(n[1], 10) : 0
}

function matchesDuration(trip: Trip, bucket: string): boolean {
  if (!bucket) return true
  const d = durationDays(trip.duration)
  if (bucket === 'short') return d > 0 && d <= 3
  if (bucket === 'mid') return d >= 4 && d <= 6
  if (bucket === 'long') return d >= 7
  return true
}

function matchesPrice(trip: Trip, bucket: string): boolean {
  if (!bucket) return true
  const [lo, hi] = bucket.split('-')
  const low = lo ? parseInt(lo, 10) : 0
  const high = hi ? parseInt(hi, 10) : Infinity
  return trip.price >= low && trip.price <= high
}

export default function TripsBrowser({ trips, categories, initial }: Props) {
  const [filters, setFilters] = useState<Filters>(initial)
  const router = useRouter()
  const pathname = usePathname()
  const [, startTransition] = useTransition()
  const [sheetOpen, setSheetOpen] = useState(false)

  // Keep URL in sync, debounced-ish via effect.
  useEffect(() => {
    const params = new URLSearchParams()
    if (filters.q) params.set('q', filters.q)
    if (filters.category) params.set('category', filters.category)
    if (filters.duration) params.set('duration', filters.duration)
    if (filters.price) params.set('price', filters.price)
    if (filters.sort && filters.sort !== 'newest') params.set('sort', filters.sort)
    const qs = params.toString()
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    })
  }, [filters, pathname, router])

  const filtered = useMemo(() => {
    const q = filters.q.trim().toLowerCase()
    let out = trips.filter(t => {
      if (filters.category && t.category !== filters.category) return false
      if (!matchesDuration(t, filters.duration)) return false
      if (!matchesPrice(t, filters.price)) return false
      if (q) {
        const hay = `${t.title} ${t.location} ${t.category} ${t.route}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
    if (filters.sort === 'price_asc') out = [...out].sort((a, b) => a.price - b.price)
    else if (filters.sort === 'price_desc') out = [...out].sort((a, b) => b.price - a.price)
    else if (filters.sort === 'duration_asc') out = [...out].sort((a, b) => durationDays(a.duration) - durationDays(b.duration))
    return out
  }, [trips, filters])

  const set = (k: keyof Filters, v: string) => setFilters(f => ({ ...f, [k]: v }))
  const reset = () => setFilters({ q: '', category: '', duration: '', price: '', sort: 'newest' })
  const activeFilterCount =
    (filters.category ? 1 : 0) + (filters.duration ? 1 : 0) + (filters.price ? 1 : 0) + (filters.q ? 1 : 0)

  const filterControls = (
    <>
      <FilterGroup label="Destination / keyword">
        <input
          placeholder="e.g. Himachal, Andaman, beach"
          value={filters.q}
          onChange={e => set('q', e.target.value)}
          style={inp}
        />
      </FilterGroup>

      <FilterGroup label="Category">
        <ChipRow
          value={filters.category}
          options={[{ key: '', label: 'All' }, ...categories.map(c => ({ key: c, label: c }))]}
          onChange={v => set('category', v)}
        />
      </FilterGroup>

      <FilterGroup label="Duration">
        <ChipRow value={filters.duration} options={DURATION_BUCKETS} onChange={v => set('duration', v)} />
      </FilterGroup>

      <FilterGroup label="Budget (per person, starting from)">
        <ChipRow value={filters.price} options={PRICE_BUCKETS} onChange={v => set('price', v)} />
      </FilterGroup>

      <FilterGroup label="Sort by">
        <select value={filters.sort} onChange={e => set('sort', e.target.value)} style={inp}>
          <option value="newest">Newest first</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
          <option value="duration_asc">Duration: short to long</option>
        </select>
      </FilterGroup>
    </>
  )

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr)', gap: 20 }}>
      {/* Mobile summary bar */}
      <div
        className="md:hidden"
        style={{
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          background: '#fff',
          border: '1px solid var(--border)',
          borderRadius: 12,
        }}
      >
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          {filtered.length} {filtered.length === 1 ? 'trip' : 'trips'}
        </p>
        <button
          onClick={() => setSheetOpen(true)}
          style={{
            background: 'var(--green)',
            color: '#fff',
            border: 'none',
            padding: '8px 16px',
            borderRadius: 999,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Filters{activeFilterCount ? ` · ${activeFilterCount}` : ''}
        </button>
      </div>

      <div
        className="grid-shell"
        style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr)', gap: 20 }}
      >
        <div className="layout" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr)', gap: 20 }}>
          {/* Desktop sidebar */}
          <aside
            className="hidden md:block"
            style={{
              background: '#fff',
              border: '1px solid var(--border)',
              borderRadius: 16,
              padding: '20px 20px 12px',
              alignSelf: 'start',
              position: 'sticky',
              top: 84,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <p style={{ fontWeight: 700, fontSize: 14 }}>Filters</p>
              {activeFilterCount > 0 && (
                <button
                  onClick={reset}
                  style={{ background: 'none', border: 'none', color: 'var(--green)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                >
                  Clear all
                </button>
              )}
            </div>
            {filterControls}
          </aside>

          <section>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
              Showing {filtered.length} of {trips.length} {trips.length === 1 ? 'trip' : 'trips'}
              {activeFilterCount > 0 && (
                <button
                  onClick={reset}
                  style={{ marginLeft: 10, background: 'none', border: 'none', color: 'var(--green)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                >
                  Clear filters
                </button>
              )}
            </p>

            {filtered.length === 0 ? (
              <div
                style={{
                  background: '#fff',
                  border: '1px dashed var(--border)',
                  borderRadius: 16,
                  padding: '40px 24px',
                  textAlign: 'center',
                }}
              >
                <p style={{ fontWeight: 600, marginBottom: 6 }}>No trips match these filters.</p>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                  Try clearing filters, or WhatsApp us — we often plan custom trips too.
                </p>
                <button
                  onClick={reset}
                  style={{
                    background: 'var(--green)',
                    color: '#fff',
                    border: 'none',
                    padding: '10px 18px',
                    borderRadius: 999,
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                  gap: 14,
                }}
              >
                {filtered.map(t => (
                  <TripCard key={t.id} trip={t} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Mobile filter sheet */}
      {sheetOpen && (
        <div
          onClick={() => setSheetOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 70,
            display: 'flex',
            alignItems: 'flex-end',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff',
              width: '100%',
              borderRadius: '20px 20px 0 0',
              padding: '20px 20px 28px',
              maxHeight: '85vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <p style={{ fontWeight: 700, fontSize: 16 }}>Filters</p>
              <button
                onClick={() => setSheetOpen(false)}
                aria-label="Close"
                style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            {filterControls}
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button
                onClick={reset}
                style={{
                  flex: 1,
                  background: '#fff',
                  color: '#1a1a1a',
                  border: '1.5px solid var(--border)',
                  padding: '12px',
                  borderRadius: 999,
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                Clear
              </button>
              <button
                onClick={() => setSheetOpen(false)}
                style={{
                  flex: 2,
                  background: 'var(--green)',
                  color: '#fff',
                  border: 'none',
                  padding: '12px',
                  borderRadius: 999,
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                Show {filtered.length} {filtered.length === 1 ? 'trip' : 'trips'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (min-width: 768px) {
          .layout { grid-template-columns: 260px minmax(0, 1fr) !important; }
        }
      `}</style>
    </div>
  )
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <p
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--text-secondary)',
          marginBottom: 8,
        }}
      >
        {label}
      </p>
      {children}
    </div>
  )
}

function ChipRow({ value, options, onChange }: { value: string; options: { key: string; label: string }[]; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {options.map(o => {
        const active = value === o.key
        return (
          <button
            key={o.key || 'all'}
            onClick={() => onChange(o.key)}
            style={{
              padding: '6px 12px',
              borderRadius: 999,
              border: `1.5px solid ${active ? 'var(--green)' : 'var(--border)'}`,
              background: active ? 'var(--green-light)' : '#fff',
              color: active ? 'var(--green)' : '#1a1a1a',
              fontSize: 12,
              fontWeight: active ? 700 : 500,
              cursor: 'pointer',
            }}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

const inp: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: 10,
  border: '1.5px solid var(--border)',
  fontSize: 13,
  outline: 'none',
  width: '100%',
  background: '#fff',
  color: '#1a1a1a',
  fontFamily: 'inherit',
}
