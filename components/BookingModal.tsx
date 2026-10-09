'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { brand, waLink } from '@/lib/config'
import { formatInr } from '@/lib/pricing'

interface Props {
  tripSlug: string
  tripTitle: string
  onClose: () => void
  packageId?: number | null
  packageLabel?: string
  estimatedPrice?: number | null
  priceOnRequest?: boolean
  initialPeople?: number
}

export default function BookingModal({
  tripSlug,
  tripTitle,
  onClose,
  packageId = null,
  packageLabel = '',
  estimatedPrice = null,
  priceOnRequest = false,
  initialPeople = 2,
}: Props) {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    message: '',
    people: initialPeople,
    month: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const set = (k: string, v: string | number) => setForm(f => ({ ...f, [k]: v }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, tripSlug, packageId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.success) {
        setError(data.error || 'Could not save enquiry. Please try WhatsApp.')
        return
      }
      setDone(true)
      const packageLine = packageLabel ? `\nPackage: ${packageLabel}` : ''
      const priceLine = priceOnRequest
        ? `\nPrice: on request — awaiting your confirmed quote`
        : typeof data.estimatedPrice === 'number'
          ? `\nEstimated: ${formatInr(data.estimatedPrice)} (final quote confirmed before booking)`
          : ''
      const msg = `Hi StayLocal! I just enquired about *${tripTitle}*.${packageLine}\nName: ${form.name}\nPhone: ${form.phone}\nTravellers: ${form.people}${form.month ? `\nMonth: ${form.month}` : ''}${priceLine}${form.message ? `\nNote: ${form.message}` : ''}`
      window.open(waLink(msg), '_blank', 'noopener')
    } catch {
      setError('Network error. Please WhatsApp us.')
    } finally {
      setLoading(false)
    }
  }

  const estimateLine = priceOnRequest && packageLabel
    ? `${packageLabel} • Price on request — we'll send a confirmed quote`
    : typeof estimatedPrice === 'number' && packageLabel
      ? `${packageLabel} • Est. ${formatInr(estimatedPrice)} for ${initialPeople} ${initialPeople === 1 ? 'traveller' : 'travellers'}`
      : packageLabel || null

  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-modal-title"
      className="backdrop-enter"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(10,20,15,0.55)',
        backdropFilter: 'blur(2px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="sheet-enter"
        style={{
          background: '#fff',
          borderRadius: '24px 24px 0 0',
          width: '100%',
          maxWidth: 520,
          padding: '28px 24px 32px',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: '0 -24px 48px -16px rgba(10,20,15,0.3)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
          <div>
            <h3 id="booking-modal-title" style={{ fontFamily: 'var(--font-playfair)', fontSize: 22, fontWeight: 700 }}>
              Enquire about this trip
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{tripTitle}</p>
            {estimateLine && (
              <p style={{ fontSize: 12, color: 'var(--green)', marginTop: 4, fontWeight: 600 }}>{estimateLine}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 24, color: 'var(--text-secondary)', lineHeight: 1 }}
          >
            ✕
          </button>
        </div>

        <p
          style={{
            fontSize: 12,
            color: 'var(--green)',
            background: 'var(--green-light)',
            padding: '8px 12px',
            borderRadius: 10,
            marginTop: 10,
            marginBottom: 18,
          }}
        >
          This creates an enquiry only. Any price shown is an estimate — final quote (including taxes, dates, and room-sharing) is confirmed in writing before booking.
        </p>

        {done ? (
          <div style={{ textAlign: 'center', padding: '16px 0 8px' }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 999,
                background: 'var(--green-light)',
                color: 'var(--green)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
                fontSize: 22,
                fontWeight: 700,
              }}
            >
              ✓
            </div>
            <p style={{ fontWeight: 700, marginBottom: 6 }}>Enquiry received</p>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
              A new tab opened for WhatsApp. If it didn&apos;t, use the button below. We reply {brand.responseTime}.
            </p>
            <a
              href={waLink(`Hi StayLocal! I just enquired about ${tripTitle}${packageLabel ? ` — ${packageLabel}` : ''}.`)}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block',
                background: 'var(--green)',
                color: '#fff',
                padding: '10px 18px',
                borderRadius: 999,
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              Open WhatsApp
            </a>
          </div>
        ) : (
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input required placeholder="Your full name" value={form.name} onChange={e => set('name', e.target.value)} style={inp} />
            <input required inputMode="tel" placeholder="Phone / WhatsApp number" value={form.phone} onChange={e => set('phone', e.target.value)} style={inp} />
            <input type="email" placeholder="Email (optional)" value={form.email} onChange={e => set('email', e.target.value)} style={inp} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <input
                type="number"
                min={1}
                max={50}
                placeholder="Travellers"
                value={form.people}
                onChange={e => set('people', Math.max(1, parseInt(e.target.value) || 1))}
                style={inp}
              />
              <select value={form.month} onChange={e => set('month', e.target.value)} style={inp}>
                <option value="">Travel month?</option>
                {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map(m => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </div>
            <textarea
              placeholder="Anything we should know? (optional)"
              value={form.message}
              onChange={e => set('message', e.target.value)}
              rows={3}
              style={{ ...inp, resize: 'none' }}
            />

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
                padding: '13px',
                fontSize: 15,
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Sending…' : 'Send enquiry →'}
            </button>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5 }}>
              We&apos;ll only use your details to respond. See our{' '}
              <Link href="/privacy" style={{ color: 'var(--text-secondary)' }}>Privacy Policy</Link>.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}

const inp: React.CSSProperties = {
  padding: '12px 14px',
  borderRadius: 10,
  border: '1.5px solid var(--border)',
  fontSize: 14,
  outline: 'none',
  fontFamily: 'inherit',
  width: '100%',
  background: '#fff',
  color: '#1a1a1a',
}
