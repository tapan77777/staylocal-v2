'use client'
import { useState } from 'react'

interface Trip {
  slug: string
  title: string
}

interface Props {
  trips: Trip[]
}

export default function EnquiryForm({ trips }: Props) {
  const [form, setForm] = useState({ name: '', phone: '', people: 2, tripSlug: '', month: '' })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const set = (k: string, v: string | number) => setForm(f => ({ ...f, [k]: v }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      setSubmitted(true)
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <section id="enquiry" style={{ background: 'var(--bg)', padding: '56px 20px', textAlign: 'center' }}>
        <div style={{ maxWidth: 500, margin: '0 auto', background: '#fff', borderRadius: 20, padding: '40px 32px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🎉</div>
          <h3 style={{ fontFamily: 'var(--font-playfair)', fontSize: 24, marginBottom: 8 }}>Got it!</h3>
          <p style={{ color: 'var(--text-secondary)' }}>We&apos;ll reply within 2 hours on WhatsApp.</p>
        </div>
      </section>
    )
  }

  return (
    <section id="enquiry" style={{ background: 'var(--bg)', padding: '56px 20px' }}>
      <div style={{ maxWidth: 500, margin: '0 auto' }}>
        <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: 28, fontWeight: 700, marginBottom: 8, textAlign: 'center' }}>
          Plan your trip
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 14, marginBottom: 28 }}>
          No spam · Real reply within 2 hours
        </p>
        <form onSubmit={submit} style={{ background: '#fff', borderRadius: 20, padding: '28px 24px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <input
            required
            placeholder="Full name"
            value={form.name}
            onChange={e => set('name', e.target.value)}
            style={inputStyle}
          />
          <input
            required
            placeholder="Phone number"
            value={form.phone}
            onChange={e => set('phone', e.target.value)}
            style={inputStyle}
          />
          <input
            type="number"
            min={1}
            placeholder="Number of people"
            value={form.people}
            onChange={e => set('people', parseInt(e.target.value))}
            style={inputStyle}
          />
          <select value={form.tripSlug} onChange={e => set('tripSlug', e.target.value)} style={inputStyle}>
            <option value="">Which trip?</option>
            {trips.map(t => <option key={t.slug} value={t.slug}>{t.title}</option>)}
          </select>
          <select value={form.month} onChange={e => set('month', e.target.value)} style={inputStyle}>
            <option value="">Travel month?</option>
            {['January','February','March','April','May','June','July','August','September','October','November','December'].map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <button
            type="submit"
            disabled={loading}
            style={{ background: 'var(--green)', color: '#fff', border: 'none', borderRadius: 999, padding: '14px', fontSize: 15, fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Sending...' : 'Submit enquiry →'}
          </button>
          <a
            href="https://wa.me/919178628894"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, border: '1.5px solid var(--green)', color: 'var(--green)', borderRadius: 999, padding: '12px', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
            Or WhatsApp us directly
          </a>
        </form>
      </div>
    </section>
  )
}

const inputStyle: React.CSSProperties = {
  padding: '12px 16px',
  borderRadius: 12,
  border: '1.5px solid var(--border)',
  fontSize: 14,
  outline: 'none',
  fontFamily: 'inherit',
  width: '100%',
  background: '#fff',
  color: '#1a1a1a'
}
