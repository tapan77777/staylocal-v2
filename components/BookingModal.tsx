'use client'
import { useState, useEffect } from 'react'

interface Props {
  tripSlug: string
  tripTitle: string
  onClose: () => void
}

export default function BookingModal({ tripSlug, tripTitle, onClose }: Props) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '', people: 2, month: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const set = (k: string, v: string | number) => setForm(f => ({ ...f, [k]: v }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, tripSlug })
      })
      const msg = encodeURIComponent(`Hi StayLocal! I want to book *${tripTitle}*.\nName: ${form.name}\nPhone: ${form.phone}\nPeople: ${form.people}\nMonth: ${form.month}\n${form.message}`)
      window.open(`https://wa.me/919178628894?text=${msg}`, '_blank')
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 500, padding: '28px 24px 36px', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontFamily: 'var(--font-playfair)', fontSize: 20, fontWeight: 700 }}>Book this trip</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: 'var(--text-secondary)' }}>✕</button>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>{tripTitle}</p>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input required placeholder="Your name" value={form.name} onChange={e => set('name', e.target.value)} style={inp} />
          <input required placeholder="Phone number" value={form.phone} onChange={e => set('phone', e.target.value)} style={inp} />
          <input type="email" placeholder="Email (optional)" value={form.email} onChange={e => set('email', e.target.value)} style={inp} />
          <input type="number" min={1} placeholder="Number of people" value={form.people} onChange={e => set('people', parseInt(e.target.value))} style={inp} />
          <select value={form.month} onChange={e => set('month', e.target.value)} style={inp}>
            <option value="">Travel month?</option>
            {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map(m => <option key={m}>{m}</option>)}
          </select>
          <textarea placeholder="Any message?" value={form.message} onChange={e => set('message', e.target.value)} rows={3} style={{ ...inp, resize: 'none' }} />
          <button type="submit" disabled={loading} style={{ background: 'var(--green)', color: '#fff', border: 'none', borderRadius: 999, padding: '14px', fontSize: 15, fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Sending...' : 'Book & WhatsApp →'}
          </button>
        </form>
      </div>
    </div>
  )
}

const inp: React.CSSProperties = {
  padding: '12px 16px', borderRadius: 12, border: '1.5px solid var(--border)',
  fontSize: 14, outline: 'none', fontFamily: 'inherit', width: '100%', background: '#fff', color: '#1a1a1a'
}
