'use client'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

interface DestinationOption {
  key: string
  label: string
}

interface Props {
  destinations: DestinationOption[]
}

const TRAVELLERS = [
  { key: 'couple', label: 'Couple', icon: '💑' },
  { key: 'family', label: 'Family', icon: '👨‍👩‍👧' },
  { key: 'friends', label: 'Friends', icon: '🧑‍🤝‍🧑' },
  { key: 'solo', label: 'Solo', icon: '🧘' },
]

const DURATIONS = [
  { key: '', label: 'Any length' },
  { key: 'short', label: 'Weekend (≤ 3 days)' },
  { key: 'mid', label: '4–6 days' },
  { key: 'long', label: '7+ days' },
]

const BUDGETS = [
  { key: '', label: 'Any budget' },
  { key: '0-10000', label: 'Under ₹10k' },
  { key: '10000-25000', label: '₹10k–25k' },
  { key: '25000-50000', label: '₹25k–50k' },
  { key: '50000-', label: '₹50k+' },
]

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function PlannerSheet({ destinations }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [destination, setDestination] = useState('')
  const [travellers, setTravellers] = useState('')
  const [duration, setDuration] = useState('')
  const [budget, setBudget] = useState('')
  const [month, setMonth] = useState('')

  const triggerRef = useRef<HTMLElement | null>(null)
  const firstFieldRef = useRef<HTMLSelectElement | null>(null)
  const sheetRef = useRef<HTMLDivElement | null>(null)

  const close = useCallback(() => {
    setOpen(false)
  }, [])

  useEffect(() => {
    const onOpen = (e: Event) => {
      const ev = e as CustomEvent<{ travellers?: string }>
      triggerRef.current = (document.activeElement as HTMLElement) ?? null
      if (ev.detail?.travellers) setTravellers(ev.detail.travellers)
      setOpen(true)
    }
    window.addEventListener('planner:open', onOpen as EventListener)
    return () => window.removeEventListener('planner:open', onOpen as EventListener)
  }, [])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    const t = setTimeout(() => firstFieldRef.current?.focus(), 50)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
      clearTimeout(t)
      triggerRef.current?.focus?.()
    }
  }, [open, close])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (destination) params.set('q', destination)
    if (duration) params.set('duration', duration)
    if (budget) params.set('price', budget)
    const qs = params.toString()
    close()
    router.push(qs ? `/trips?${qs}` : '/trips')
  }

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="planner-sheet-title"
      onClick={close}
      className="backdrop-enter"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(10,20,15,0.55)',
        backdropFilter: 'blur(2px)',
        WebkitBackdropFilter: 'blur(2px)',
        zIndex: 100,
        display: 'flex',
      }}
    >
      <div
        ref={sheetRef}
        onClick={e => e.stopPropagation()}
        className="sheet-enter planner-sheet"
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'start',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 6,
          }}
        >
          <div>
            <p className="eyebrow" style={{ marginBottom: 6 }}>Start planning</p>
            <h3
              id="planner-sheet-title"
              style={{
                fontFamily: 'var(--font-playfair)',
                fontSize: 'clamp(20px, 2.4vw, 24px)',
                fontWeight: 700,
                lineHeight: 1.15,
              }}
            >
              Tell us a little — we&apos;ll show you trips that fit.
            </h3>
          </div>
          <button
            onClick={close}
            aria-label="Close planner"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 24,
              lineHeight: 1,
              color: 'var(--text-secondary)',
              padding: 4,
            }}
          >
            ✕
          </button>
        </div>

        <p
          style={{
            fontSize: 12,
            color: 'var(--text-secondary)',
            marginBottom: 16,
          }}
        >
          Every field is optional. Skip anything you&apos;re unsure about.
        </p>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Destination">
            <select
              ref={firstFieldRef}
              value={destination}
              onChange={e => setDestination(e.target.value)}
              style={inp}
              aria-label="Destination"
            >
              <option value="">Anywhere in India</option>
              {destinations.map(d => (
                <option key={d.key} value={d.key}>{d.label}</option>
              ))}
            </select>
          </Field>

          <Field label="Travellers">
            <div role="radiogroup" aria-label="Travellers" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {TRAVELLERS.map(t => {
                const active = travellers === t.key
                return (
                  <button
                    type="button"
                    key={t.key}
                    role="radio"
                    aria-checked={active}
                    onClick={() => setTravellers(active ? '' : t.key)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '9px 12px',
                      borderRadius: 999,
                      border: `1.5px solid ${active ? 'var(--green)' : 'var(--border)'}`,
                      background: active ? 'var(--green-light)' : '#fff',
                      color: active ? 'var(--green-dark)' : '#1a1a1a',
                      fontSize: 13,
                      fontWeight: active ? 700 : 500,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    <span aria-hidden>{t.icon}</span>
                    {t.label}
                  </button>
                )
              })}
            </div>
          </Field>

          <div className="planner-row-two">
            <Field label="Trip length">
              <select value={duration} onChange={e => setDuration(e.target.value)} style={inp} aria-label="Trip length">
                {DURATIONS.map(d => <option key={d.key} value={d.key}>{d.label}</option>)}
              </select>
            </Field>
            <Field label="Budget per person">
              <select value={budget} onChange={e => setBudget(e.target.value)} style={inp} aria-label="Budget per person">
                {BUDGETS.map(b => <option key={b.key} value={b.key}>{b.label}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Travel month (optional)">
            <select value={month} onChange={e => setMonth(e.target.value)} style={inp} aria-label="Travel month">
              <option value="">Flexible</option>
              {MONTHS.map(m => <option key={m}>{m}</option>)}
            </select>
          </Field>

          <button
            type="submit"
            style={{
              background: 'var(--green)',
              color: '#fff',
              border: 'none',
              borderRadius: 14,
              padding: '14px 20px',
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              marginTop: 4,
              boxShadow: '0 10px 24px -10px rgba(29,158,117,0.6)',
              fontFamily: 'inherit',
            }}
          >
            Find trips →
          </button>
          <p
            style={{
              fontSize: 11,
              color: 'var(--text-muted)',
              textAlign: 'center',
              lineHeight: 1.5,
            }}
          >
            Nothing is locked in. You can still change everything on the next step.
          </p>
        </form>
      </div>

      <style>{`
        .planner-sheet {
          background: #fff;
          width: 100%;
          margin-top: auto;
          padding: 20px 20px 28px;
          border-radius: 20px 20px 0 0;
          box-shadow: 0 -24px 48px -16px rgba(10,20,15,0.3);
          max-height: 92vh;
          overflow-y: auto;
        }
        .planner-row-two {
          display: grid;
          grid-template-columns: 1fr;
          gap: 14px;
        }
        @media (min-width: 720px) {
          .planner-sheet {
            margin: auto;
            max-width: 560px;
            border-radius: 20px;
            padding: 28px 28px 32px;
            box-shadow: 0 30px 60px -20px rgba(10,20,15,0.35);
          }
          .planner-row-two {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--text-secondary)',
        }}
      >
        {label}
      </span>
      {children}
    </label>
  )
}

const inp: React.CSSProperties = {
  padding: '12px 14px',
  borderRadius: 12,
  border: '1.5px solid var(--border)',
  fontSize: 14,
  outline: 'none',
  width: '100%',
  background: '#fff',
  color: '#1a1a1a',
  fontFamily: 'inherit',
  appearance: 'none',
}
