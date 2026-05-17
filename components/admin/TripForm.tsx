'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

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
  status: string
  image: string
  gallery: string
  route: string
  highlights: string
  included: string
  notIncluded: string
  faqs: string
  type: string
  pricing: string
  itinerary: string
  tierDetails: string
  durLabels: string
}

interface Props {
  trip?: Trip
}

export default function TripForm({ trip }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    slug: trip?.slug ?? '',
    title: trip?.title ?? '',
    subtitle: trip?.subtitle ?? '',
    location: trip?.location ?? '',
    category: trip?.category ?? 'Mountains',
    duration: trip?.duration ?? '',
    difficulty: trip?.difficulty ?? 'Easy',
    price: trip?.price ?? 0,
    status: trip?.status ?? 'draft',
    image: trip?.image ?? '',
    gallery: trip?.gallery ?? '[]',
    route: trip?.route ?? '',
    highlights: trip?.highlights ?? '[]',
    included: trip?.included ?? '[]',
    notIncluded: trip?.notIncluded ?? '[]',
    faqs: trip?.faqs ?? '[]',
    type: trip?.type ?? 'calculator',
    pricing: trip?.pricing ?? '[]',
    itinerary: trip?.itinerary ?? '[]',
    tierDetails: trip?.tierDetails ?? '[]',
    durLabels: trip?.durLabels ?? '[]',
  })

  const set = (k: string, v: string | number) => setForm(f => ({ ...f, [k]: v }))

  const save = async (status: string) => {
    setLoading(true)
    try {
      const url = trip ? `/api/admin/trips/${trip.id}` : '/api/admin/trips'
      const method = trip ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, price: Number(form.price), status })
      })
      if (res.ok) router.push('/admin/trips')
      else alert('Failed to save')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Basic info */}
      <div style={card}>
        <h2 style={cardTitle}>Basic Info</h2>
        <div style={grid2}>
          <label style={lbl}>Title<input style={inp} value={form.title} onChange={e => set('title', e.target.value)} /></label>
          <label style={lbl}>Slug (URL)<input style={inp} value={form.slug} onChange={e => set('slug', e.target.value)} /></label>
          <label style={lbl}>Location<input style={inp} value={form.location} onChange={e => set('location', e.target.value)} /></label>
          <label style={lbl}>Category
            <select style={inp} value={form.category} onChange={e => set('category', e.target.value)}>
              {['Mountains','Islands','Wildlife','Trek','Beach','Other'].map(c => <option key={c}>{c}</option>)}
            </select>
          </label>
          <label style={lbl}>Duration (e.g. 9D · 8N)<input style={inp} value={form.duration} onChange={e => set('duration', e.target.value)} /></label>
          <label style={lbl}>Difficulty
            <select style={inp} value={form.difficulty} onChange={e => set('difficulty', e.target.value)}>
              {['Easy','Moderate','Hard'].map(d => <option key={d}>{d}</option>)}
            </select>
          </label>
          <label style={lbl}>Base Price (₹)<input style={inp} type="number" value={form.price} onChange={e => set('price', e.target.value)} /></label>
          <label style={lbl}>Route<input style={inp} value={form.route} onChange={e => set('route', e.target.value)} /></label>
          <label style={{ ...lbl, gridColumn: '1 / -1' }}>Subtitle<input style={inp} value={form.subtitle} onChange={e => set('subtitle', e.target.value)} /></label>
        </div>
      </div>

      {/* Type */}
      <div style={card}>
        <h2 style={cardTitle}>Trip Type</h2>
        <div style={{ display: 'flex', gap: 12 }}>
          {['calculator','enquiry'].map(t => (
            <button key={t} onClick={() => set('type', t)} style={{ padding: '8px 20px', borderRadius: 999, border: `1.5px solid ${form.type === t ? 'var(--green)' : 'var(--border)'}`, background: form.type === t ? 'var(--green-light)' : '#fff', color: form.type === t ? 'var(--green)' : '#1a1a1a', fontWeight: form.type === t ? 700 : 400, fontSize: 13, cursor: 'pointer', textTransform: 'capitalize' }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Images */}
      <div style={card}>
        <h2 style={cardTitle}>Images</h2>
        <label style={lbl}>Hero Image URL<input style={inp} value={form.image} onChange={e => set('image', e.target.value)} /></label>
        <label style={lbl}>Gallery URLs (JSON array)<textarea style={{ ...inp, height: 80, resize: 'vertical' }} value={form.gallery} onChange={e => set('gallery', e.target.value)} /></label>
      </div>

      {/* Content */}
      <div style={card}>
        <h2 style={cardTitle}>Content</h2>
        <label style={lbl}>Highlights (JSON array of strings)<textarea style={{ ...inp, height: 80 }} value={form.highlights} onChange={e => set('highlights', e.target.value)} /></label>
        <label style={lbl}>Included (JSON array)<textarea style={{ ...inp, height: 80 }} value={form.included} onChange={e => set('included', e.target.value)} /></label>
        <label style={lbl}>Not Included (JSON array)<textarea style={{ ...inp, height: 80 }} value={form.notIncluded} onChange={e => set('notIncluded', e.target.value)} /></label>
        <label style={lbl}>FAQs (JSON array of {'{q,a}'})<textarea style={{ ...inp, height: 100 }} value={form.faqs} onChange={e => set('faqs', e.target.value)} /></label>
      </div>

      {/* Calculator fields */}
      {form.type === 'calculator' && (
        <div style={card}>
          <h2 style={cardTitle}>Calculator Pricing</h2>
          <label style={lbl}>Duration Labels (JSON array, e.g. ["3D/2N","4D/3N"])<textarea style={{ ...inp, height: 60 }} value={form.durLabels} onChange={e => set('durLabels', e.target.value)} /></label>
          <label style={lbl}>Pricing (JSON 2D array [durIdx][tierIdx])<textarea style={{ ...inp, height: 80 }} value={form.pricing} onChange={e => set('pricing', e.target.value)} /></label>
          <label style={lbl}>Tier Details (JSON array of {'{name,vehicle,meals,feats}'})<textarea style={{ ...inp, height: 120 }} value={form.tierDetails} onChange={e => set('tierDetails', e.target.value)} /></label>
          <label style={lbl}>Itinerary (JSON 3D array [durIdx][dayIdx]{'{day,title,desc}'})<textarea style={{ ...inp, height: 140 }} value={form.itinerary} onChange={e => set('itinerary', e.target.value)} /></label>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={() => save('draft')} disabled={loading} style={{ background: 'var(--bg-muted)', color: '#1a1a1a', border: '1px solid var(--border)', borderRadius: 999, padding: '12px 24px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
          Save as Draft
        </button>
        <button onClick={() => save('published')} disabled={loading} style={{ background: 'var(--green)', color: '#fff', border: 'none', borderRadius: 999, padding: '12px 24px', fontWeight: 600, fontSize: 14, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Saving...' : 'Publish'}
        </button>
      </div>
    </div>
  )
}

const card: React.CSSProperties = { background: '#fff', border: '1px solid var(--border)', borderRadius: 16, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }
const cardTitle: React.CSSProperties = { fontWeight: 700, fontSize: 16, marginBottom: 4 }
const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }
const lbl: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }
const inp: React.CSSProperties = { padding: '10px 14px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 13, outline: 'none', fontFamily: 'inherit', width: '100%' }
