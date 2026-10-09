'use client'
import { useState } from 'react'
import Link from 'next/link'
import { brand, waLink } from '@/lib/config'

interface Trip {
  slug: string
  title: string
}

interface Props {
  trips: Trip[]
}

export default function EnquiryForm({ trips }: Props) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', people: 2, tripSlug: '', month: '' })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (k: string, v: string | number) => setForm(f => ({ ...f, [k]: v }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.success) {
        setError(data.error || 'Could not submit enquiry. Please try again or WhatsApp us.')
        return
      }
      setSubmitted(true)
    } catch {
      setError('Network error — please WhatsApp us if this keeps failing.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    const waMsg = form.tripSlug
      ? `Hi StayLocal! I just enquired about ${trips.find(t => t.slug === form.tripSlug)?.title || 'a trip'}. My name is ${form.name}.`
      : `Hi StayLocal! I just submitted an enquiry. My name is ${form.name}.`
    return (
      <section id="enquiry" style={sectionStyle}>
        <div
          style={{
            maxWidth: 540,
            margin: '0 auto',
            background: '#fff',
            borderRadius: 24,
            padding: '44px 32px',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-md)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 999,
              background: 'var(--green-light)',
              color: 'var(--green)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
              fontSize: 26,
              fontWeight: 700,
            }}
          >
            ✓
          </div>
          <h3 style={{ fontFamily: 'var(--font-playfair)', fontSize: 26, marginBottom: 8 }}>
            Enquiry received
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
            A real person from our team will reply {brand.responseTime} on WhatsApp with availability,
            final quote, and next steps. This is an enquiry — nothing is booked yet.
          </p>
          <a
            href={waLink(waMsg)}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              background: 'var(--green)',
              color: '#fff',
              padding: '13px 24px',
              borderRadius: 999,
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: 14,
              boxShadow: '0 10px 24px -10px rgba(29,158,117,0.6)',
            }}
          >
            Message us on WhatsApp
          </a>
        </div>
      </section>
    )
  }

  return (
    <section id="enquiry" style={sectionStyle}>
      <div
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          display: 'grid',
          gap: 36,
          gridTemplateColumns: 'minmax(0, 1fr)',
          alignItems: 'start',
        }}
        className="enquiry-grid"
      >
        <div style={{ maxWidth: 460 }}>
          <p className="eyebrow" style={{ marginBottom: 10 }}>Final call</p>
          <h2 className="section-title">Ready to plan a trip?</h2>
          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: 'clamp(14px, 1.4vw, 16px)',
              lineHeight: 1.65,
              marginTop: 12,
            }}
          >
            No spam, no account, no commitment. A real person replies {brand.responseTime} on
            WhatsApp — usually with questions, options, and an honest quote.
          </p>

          <ul
            style={{
              marginTop: 20,
              padding: 0,
              listStyle: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            {[
              'Takes under a minute',
              'Written confirmation before anything is booked',
              'Transparent pricing — inclusions, exclusions, and taxes',
            ].map(line => (
              <li key={line} style={{ fontSize: 14, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 999,
                    background: 'var(--green-light)',
                    color: 'var(--green)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  ✓
                </span>
                {line}
              </li>
            ))}
          </ul>
        </div>

        <form
          onSubmit={submit}
          style={{
            background: '#fff',
            borderRadius: 24,
            padding: '28px 24px',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-md)',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          <label style={labelStyle}>
            Full name
            <input
              required
              placeholder="e.g. Priya Sharma"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              style={inputStyle}
            />
          </label>
          <label style={labelStyle}>
            Phone / WhatsApp number
            <input
              required
              inputMode="tel"
              placeholder="e.g. 98765 43210"
              value={form.phone}
              onChange={e => set('phone', e.target.value)}
              style={inputStyle}
            />
          </label>
          <label style={labelStyle}>
            Email <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional)</span>
            <input
              type="email"
              placeholder="For written confirmation"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              style={inputStyle}
            />
          </label>
          <label style={labelStyle}>
            Which trip?
            <select
              required
              value={form.tripSlug}
              onChange={e => set('tripSlug', e.target.value)}
              style={inputStyle}
            >
              <option value="">Choose a trip</option>
              {trips.map(t => (
                <option key={t.slug} value={t.slug}>{t.title}</option>
              ))}
            </select>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label style={labelStyle}>
              Travellers
              <input
                type="number"
                min={1}
                max={50}
                value={form.people}
                onChange={e => set('people', Math.max(1, parseInt(e.target.value) || 1))}
                style={inputStyle}
              />
            </label>
            <label style={labelStyle}>
              Travel month
              <select value={form.month} onChange={e => set('month', e.target.value)} style={inputStyle}>
                <option value="">Not sure yet</option>
                {['January','February','March','April','May','June','July','August','September','October','November','December'].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </label>
          </div>

          {error && (
            <p style={{ fontSize: 13, color: '#b91c1c', background: '#fef2f2', padding: '10px 12px', borderRadius: 10 }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              background: 'var(--green)',
              color: '#fff',
              border: 'none',
              borderRadius: 999,
              padding: '14px',
              fontSize: 15,
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              boxShadow: '0 10px 24px -10px rgba(29,158,117,0.6)',
              fontFamily: 'inherit',
            }}
          >
            {loading ? 'Sending…' : 'Submit enquiry →'}
          </button>
          <a
            href={waLink('Hi StayLocal! I would like to plan a trip.')}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              border: '1.5px solid var(--green)',
              color: 'var(--green)',
              borderRadius: 999,
              padding: '12px',
              fontSize: 14,
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Or WhatsApp us directly
          </a>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5 }}>
            By submitting you agree to our{' '}
            <Link href="/privacy" style={{ color: 'var(--text-secondary)' }}>Privacy Policy</Link>. We only
            use your details to respond to this enquiry.
          </p>
        </form>
      </div>

      <style>{`
        @media (min-width: 820px) {
          .enquiry-grid { grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr) !important; gap: 56px !important; }
        }
      `}</style>
    </section>
  )
}

const sectionStyle: React.CSSProperties = {
  background: 'linear-gradient(180deg, var(--bg) 0%, #F3EEE3 100%)',
  padding: 'clamp(56px, 9vh, 96px) 20px',
}

const inputStyle: React.CSSProperties = {
  padding: '12px 14px',
  borderRadius: 12,
  border: '1.5px solid var(--border)',
  fontSize: 14,
  outline: 'none',
  fontFamily: 'inherit',
  width: '100%',
  background: '#fff',
  color: '#1a1a1a',
}

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--text-secondary)',
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
}
