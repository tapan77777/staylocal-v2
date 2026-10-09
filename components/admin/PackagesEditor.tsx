'use client'
import { useCallback } from 'react'

export interface PackageDraft {
  id?: number
  slug: string
  label: string
  days: number
  nights: number
  priceAdult: number
  priceBasis: string
  priceOnRequest: boolean
  image: string
  sortOrder: number
  status: string
  itinerary: string
  accommodation: string
  inclusions: string
  exclusions: string
  notes: string
}

interface Props {
  packages: PackageDraft[]
  onChange: (next: PackageDraft[]) => void
}

function emptyPackage(sortOrder: number): PackageDraft {
  return {
    slug: '',
    label: '',
    days: 3,
    nights: 2,
    priceAdult: 0,
    priceBasis: 'per adult, twin sharing',
    priceOnRequest: false,
    image: '',
    sortOrder,
    status: 'draft',
    itinerary: '[]',
    accommodation: '',
    inclusions: '[]',
    exclusions: '[]',
    notes: '',
  }
}

function parseDays(json: string): { day: string; title: string; desc: string }[] {
  try {
    const parsed = JSON.parse(json)
    if (!Array.isArray(parsed)) return []
    return parsed
      .map((d, i) => ({
        day: String(d?.day ?? `Day ${i + 1}`),
        title: String(d?.title ?? ''),
        desc: String(d?.desc ?? ''),
      }))
  } catch {
    return []
  }
}

function parseList(json: string): string[] {
  try {
    const parsed = JSON.parse(json)
    return Array.isArray(parsed) ? parsed.map(String) : []
  } catch {
    return []
  }
}

export default function PackagesEditor({ packages, onChange }: Props) {
  const update = useCallback(
    (idx: number, patch: Partial<PackageDraft>) => {
      const next = packages.map((p, i) => (i === idx ? { ...p, ...patch } : p))
      onChange(next)
    },
    [packages, onChange]
  )

  const remove = (idx: number) => {
    const p = packages[idx]
    if (!confirm(`Delete package "${p.label || p.slug || 'Untitled'}"? This cannot be undone.`)) return
    onChange(packages.filter((_, i) => i !== idx))
  }

  const move = (idx: number, dir: -1 | 1) => {
    const to = idx + dir
    if (to < 0 || to >= packages.length) return
    const next = [...packages]
    ;[next[idx], next[to]] = [next[to], next[idx]]
    onChange(next.map((p, i) => ({ ...p, sortOrder: i })))
  }

  const add = () => {
    onChange([...packages, emptyPackage(packages.length)])
  }

  const setDays = (idx: number, days: { day: string; title: string; desc: string }[]) => {
    update(idx, { itinerary: JSON.stringify(days) })
  }

  const setList = (idx: number, key: 'inclusions' | 'exclusions', list: string[]) => {
    update(idx, { [key]: JSON.stringify(list) } as Partial<PackageDraft>)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {packages.length === 0 && (
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          No packages yet. Add at least one duration option so customers can select and enquire.
        </p>
      )}

      {packages.map((pkg, idx) => {
        const days = parseDays(pkg.itinerary)
        const inclusions = parseList(pkg.inclusions)
        const exclusions = parseList(pkg.exclusions)
        return (
          <div
            key={pkg.id ?? `new-${idx}`}
            style={{
              border: '1px solid var(--border)',
              background: '#fff',
              borderRadius: 14,
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: 15, fontWeight: 700 }}>
                Package {idx + 1}
                {pkg.id ? <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>#{pkg.id}</span> : null}
              </h3>
              <div style={{ display: 'flex', gap: 6 }}>
                <button type="button" onClick={() => move(idx, -1)} disabled={idx === 0} style={iconBtn}>↑</button>
                <button type="button" onClick={() => move(idx, 1)} disabled={idx === packages.length - 1} style={iconBtn}>↓</button>
                <button type="button" onClick={() => remove(idx)} style={{ ...iconBtn, color: '#b91c1c', borderColor: '#fecaca' }}>Remove</button>
              </div>
            </div>

            <div style={grid2}>
              <label style={lbl}>Label (e.g. &ldquo;3D/2N Standard&rdquo;)
                <input style={inp} value={pkg.label} onChange={e => update(idx, { label: e.target.value })} />
              </label>
              <label style={lbl}>Slug (lowercase, no spaces)
                <input style={inp} value={pkg.slug} onChange={e => update(idx, { slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })} />
              </label>
              <label style={lbl}>Days
                <input type="number" min={1} style={inp} value={pkg.days} onChange={e => update(idx, { days: Math.max(1, parseInt(e.target.value) || 1) })} />
              </label>
              <label style={lbl}>Nights
                <input type="number" min={0} style={inp} value={pkg.nights} onChange={e => update(idx, { nights: Math.max(0, parseInt(e.target.value) || 0) })} />
              </label>
              <label style={lbl}>Price per adult (₹)
                <input
                  type="number"
                  min={0}
                  style={{ ...inp, opacity: pkg.priceOnRequest ? 0.5 : 1 }}
                  value={pkg.priceAdult}
                  onChange={e => update(idx, { priceAdult: Math.max(0, parseInt(e.target.value) || 0) })}
                  disabled={pkg.priceOnRequest}
                />
                {pkg.priceOnRequest && (
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                    Ignored while &ldquo;Price on request&rdquo; is enabled.
                  </span>
                )}
              </label>
              <label style={lbl}>Price basis
                <input style={inp} value={pkg.priceBasis} onChange={e => update(idx, { priceBasis: e.target.value })} />
              </label>
              <label style={{ ...lbl, gridColumn: '1 / -1', flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={pkg.priceOnRequest}
                  onChange={e => update(idx, { priceOnRequest: e.target.checked })}
                  style={{ marginTop: 2 }}
                />
                <span>
                  <strong>Price on request (enquiry-only)</strong>
                  <span style={{ display: 'block', fontWeight: 400, color: 'var(--text-muted)', marginTop: 2 }}>
                    Use when supplier cost and selling price are not yet verified. Public page shows &ldquo;Price on request&rdquo; and the enquiry omits any estimated total.
                  </span>
                </span>
              </label>
              <label style={lbl}>Image URL
                <input style={inp} value={pkg.image} onChange={e => update(idx, { image: e.target.value })} />
              </label>
              <label style={lbl}>Status
                <select
                  style={inp}
                  value={pkg.status}
                  onChange={e => {
                    const next = e.target.value
                    if (pkg.status !== 'published' && next === 'published') {
                      const priceOk = Number(pkg.priceAdult) > 0 || pkg.priceOnRequest
                      const msg = pkg.priceOnRequest
                        ? 'Publish this package as price-on-request? Customers will see "Price on request" and the enquiry will not include an estimated total. If this trip has legacy pricing, the public page will switch to the package picker.'
                        : priceOk
                          ? 'Publish this package? Once saved, it becomes public immediately. If this trip has legacy pricing, the public page will switch to the package picker.'
                          : 'Cannot publish: price per adult is ₹0 or empty. Set a non-zero price or enable "Price on request" first.'
                      if (!priceOk) { alert(msg); return }
                      if (!confirm(msg)) return
                    }
                    update(idx, { status: next })
                  }}
                >
                  <option value="draft">Draft (hidden)</option>
                  <option value="published">Published (public)</option>
                </select>
                {pkg.status === 'draft' && (
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                    Verify pricing with the supplier before publishing.
                  </span>
                )}
              </label>
              <label style={{ ...lbl, gridColumn: '1 / -1' }}>Accommodation details
                <input style={inp} placeholder="e.g. 3-star hotel, Darjeeling town" value={pkg.accommodation} onChange={e => update(idx, { accommodation: e.target.value })} />
              </label>
              <label style={{ ...lbl, gridColumn: '1 / -1' }}>Notes (seasonal supplements, pricing caveats)
                <textarea style={{ ...inp, height: 60, resize: 'vertical' }} value={pkg.notes} onChange={e => update(idx, { notes: e.target.value })} />
              </label>
            </div>

            <ItineraryEditor days={days} onChange={d => setDays(idx, d)} />

            <ListEditor label="Inclusions" items={inclusions} onChange={l => setList(idx, 'inclusions', l)} />
            <ListEditor label="Exclusions / Optional" items={exclusions} onChange={l => setList(idx, 'exclusions', l)} />
          </div>
        )
      })}

      <button
        type="button"
        onClick={add}
        style={{
          background: 'var(--green-light)',
          color: 'var(--green)',
          border: '1.5px dashed var(--green)',
          borderRadius: 12,
          padding: '12px 20px',
          fontWeight: 600,
          fontSize: 13,
          cursor: 'pointer',
        }}
      >
        + Add duration package
      </button>
    </div>
  )
}

function ItineraryEditor({ days, onChange }: { days: { day: string; title: string; desc: string }[]; onChange: (d: { day: string; title: string; desc: string }[]) => void }) {
  const update = (i: number, patch: Partial<{ day: string; title: string; desc: string }>) => {
    onChange(days.map((d, idx) => (idx === i ? { ...d, ...patch } : d)))
  }
  const add = () => onChange([...days, { day: `Day ${days.length + 1}`, title: '', desc: '' }])
  const remove = (i: number) => onChange(days.filter((_, idx) => idx !== i))
  const move = (i: number, dir: -1 | 1) => {
    const to = i + dir
    if (to < 0 || to >= days.length) return
    const next = [...days]
    ;[next[i], next[to]] = [next[to], next[i]]
    onChange(next)
  }

  return (
    <div style={{ border: '1px solid var(--border-light)', borderRadius: 10, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Itinerary (day by day)</p>
        <button type="button" onClick={add} style={smallBtn}>+ Add day</button>
      </div>
      {days.length === 0 && <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>No days yet.</p>}
      {days.map((d, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '90px 1fr 36px 36px 36px', gap: 8, alignItems: 'start' }}>
          <input style={inp} placeholder="Day 1" value={d.day} onChange={e => update(i, { day: e.target.value })} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <input style={inp} placeholder="Title (e.g. Arrival & local sightseeing)" value={d.title} onChange={e => update(i, { title: e.target.value })} />
            <textarea style={{ ...inp, height: 50, resize: 'vertical' }} placeholder="Description" value={d.desc} onChange={e => update(i, { desc: e.target.value })} />
          </div>
          <button type="button" onClick={() => move(i, -1)} disabled={i === 0} style={iconBtn}>↑</button>
          <button type="button" onClick={() => move(i, 1)} disabled={i === days.length - 1} style={iconBtn}>↓</button>
          <button type="button" onClick={() => remove(i)} style={{ ...iconBtn, color: '#b91c1c' }}>✕</button>
        </div>
      ))}
    </div>
  )
}

function ListEditor({ label, items, onChange }: { label: string; items: string[]; onChange: (next: string[]) => void }) {
  const update = (i: number, v: string) => onChange(items.map((x, idx) => (idx === i ? v : x)))
  const add = () => onChange([...items, ''])
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i))
  return (
    <div style={{ border: '1px solid var(--border-light)', borderRadius: 10, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>{label}</p>
        <button type="button" onClick={add} style={smallBtn}>+ Add</button>
      </div>
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', gap: 6 }}>
          <input style={{ ...inp, flex: 1 }} value={item} onChange={e => update(i, e.target.value)} />
          <button type="button" onClick={() => remove(i)} style={{ ...iconBtn, color: '#b91c1c' }}>✕</button>
        </div>
      ))}
    </div>
  )
}

const inp: React.CSSProperties = { padding: '9px 12px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: 13, outline: 'none', fontFamily: 'inherit', width: '100%' }
const lbl: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }
const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }
const iconBtn: React.CSSProperties = { background: '#fff', border: '1.5px solid var(--border)', borderRadius: 8, padding: '6px 10px', fontSize: 12, cursor: 'pointer', fontWeight: 600 }
const smallBtn: React.CSSProperties = { background: 'var(--green)', color: '#fff', border: 'none', borderRadius: 999, padding: '4px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }
