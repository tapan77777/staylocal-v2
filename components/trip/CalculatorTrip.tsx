'use client'
import { useState } from 'react'
import BookingModal from '@/components/BookingModal'

interface TripData {
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
  galleryArr: string[]
  highlightsArr: string[]
  includedArr: string[]
  notIncludedArr: string[]
  faqsArr: { q: string; a: string }[]
  pricingArr: number[][]
  itineraryArr: { day: string; title: string; desc: string }[][]
  tierDetailsArr: { name: string; vehicle: string; meals: string; feats: string[] }[]
  durLabelsArr: string[]
  durSubLabelsArr: string[]
  route: string
}

interface Props {
  trip: TripData
}

const INCLUSIONS = [
  'Stay included',
  'Breakfast included',
  'Sightseeing included',
  'Local transfers',
]

export default function CalculatorTrip({ trip }: Props) {
  const [durIdx, setDurIdx] = useState(0)
  const [people, setPeople] = useState(2)
  const [tierIdx, setTierIdx] = useState(0)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [showModal, setShowModal] = useState(false)

  const basePrice = trip.pricingArr[durIdx]?.[tierIdx] ?? trip.price
  const discount = people >= 6 ? 0.1 : people >= 4 ? 0.05 : 0
  const total = Math.round(basePrice * people * (1 - discount))

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '0 0 60px' }}>

      {/* Hero — full-bleed inside max-width container */}
      <div style={{ position: 'relative', height: 320, overflow: 'hidden', margin: '0 20px 0', borderRadius: 20, marginTop: 24 }}>
        {trip.image ? (
          <img src={trip.image} alt={trip.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#a8c5b8,#6fa08a)' }} />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 55%)' }} />
        <div style={{ position: 'absolute', bottom: 24, left: 24, color: '#fff' }}>
          <span style={{ fontSize: 12, background: 'var(--green)', padding: '3px 10px', borderRadius: 999, marginBottom: 8, display: 'inline-block' }}>
            {trip.category}
          </span>
          <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: 30, fontWeight: 700, marginBottom: 4 }}>
            {trip.title}
          </h1>
          {/* Change 3 — location + route below title */}
          <p style={{ fontSize: 14, opacity: 0.85 }}>📍 {trip.location}</p>
          {trip.route && (
            <p className="text-sm text-white/70 mt-1">{trip.route}</p>
          )}
        </div>
      </div>

      {/* Change 1 — Inclusion pills bar */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar px-4 py-3 bg-white border-b border-[#EAE8E4]" style={{ marginBottom: 20 }}>
        {INCLUSIONS.map((item) => (
          <div key={item} className="flex items-center gap-1.5 bg-[#E8F5F0] border border-[#1D9E75]/20 rounded-full px-3 py-1.5 flex-shrink-0">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <circle cx="6" cy="6" r="5.5" fill="#1D9E75"/>
              <path d="M3.5 6l1.5 1.5 3-3" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-[11px] text-[#0d6b50] font-medium whitespace-nowrap">{item}</span>
          </div>
        ))}
      </div>

      {/* Package Calculator */}
      <section style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 20, padding: '28px 24px', marginBottom: 28, margin: '0 20px 28px' }}>
        <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Build your package</h2>

        {/* Change 2 — Thrillophilia-style duration cards */}
        {trip.durLabelsArr.length > 0 && (
          <div className="px-0 mb-4">
            <p className="text-xs text-[#888] uppercase tracking-wider mb-3">Choose duration</p>
            <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1">
              {trip.durLabelsArr.map((label, i) => (
                <button
                  key={i}
                  onClick={() => setDurIdx(i)}
                  className={`flex-shrink-0 w-[110px] rounded-2xl border overflow-hidden text-left transition-all ${
                    durIdx === i
                      ? 'border-[#1D9E75] bg-[#E8F5F0]'
                      : 'border-[#EAE8E4] bg-white'
                  }`}
                >
                  <div className="h-[70px] overflow-hidden">
                    <img
                      src={trip.galleryArr[0] || trip.image}
                      alt={label}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-2">
                    <p className={`text-sm font-medium ${durIdx === i ? 'text-[#1D9E75]' : 'text-[#1a1a1a]'}`}>
                      {label}
                    </p>
                    <p className="text-[10px] text-[#AAA] mt-0.5">
                      {trip.durSubLabelsArr?.[i] || ''}
                    </p>
                    <p className={`text-[11px] font-medium mt-1 ${durIdx === i ? 'text-[#1D9E75]' : 'text-[#1a1a1a]'}`}>
                      from ₹{trip.pricingArr[i]?.[0]?.toLocaleString('en-IN')}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* People selector */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>PEOPLE</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button onClick={() => setPeople(p => Math.max(1, p - 1))} style={circBtn}>−</button>
            <span style={{ fontSize: 22, fontWeight: 700, minWidth: 32, textAlign: 'center' }}>{people}</span>
            <button onClick={() => setPeople(p => Math.min(8, p + 1))} style={circBtn}>+</button>
            {discount > 0 && (
              <span style={{ fontSize: 12, color: 'var(--green)', fontWeight: 600 }}>
                🎉 {(discount * 100).toFixed(0)}% group discount
              </span>
            )}
          </div>
        </div>

        {/* Tier cards */}
        {trip.tierDetailsArr.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>PACKAGE TYPE</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              {trip.tierDetailsArr.map((tier, i) => {
                const tierPrice = trip.pricingArr[durIdx]?.[i] ?? 0
                return (
                  <div key={i} onClick={() => setTierIdx(i)} style={{
                    border: `2px solid ${i === tierIdx ? 'var(--green)' : 'var(--border)'}`,
                    borderRadius: 14, padding: '16px 14px', cursor: 'pointer',
                    background: i === tierIdx ? 'var(--green-light)' : '#fff'
                  }}>
                    <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{tier.name}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8 }}>{tier.vehicle}</p>
                    {tier.feats.map(f => (
                      <p key={f} style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 2 }}>✓ {f}</p>
                    ))}
                    <p style={{ fontWeight: 700, fontSize: 15, marginTop: 10, color: 'var(--green)' }}>
                      ₹{tierPrice.toLocaleString('en-IN')}/person
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Summary + CTA */}
        <div style={{ background: 'var(--bg-muted)', borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Total for {people} {people === 1 ? 'person' : 'people'}</p>
            <p style={{ fontSize: 26, fontWeight: 700 }}>₹{total.toLocaleString('en-IN')}</p>
            {discount > 0 && (
              <p style={{ fontSize: 11, color: 'var(--green)' }}>
                Saving ₹{Math.round(basePrice * people * discount).toLocaleString('en-IN')}
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <a
              href={`https://wa.me/919999999999?text=${encodeURIComponent(`Hi! I'm interested in ${trip.title}`)}`}
              target="_blank" rel="noopener noreferrer"
              style={{ background: '#25D366', color: '#fff', padding: '11px 20px', borderRadius: 999, textDecoration: 'none', fontWeight: 600, fontSize: 14 }}
            >
              WhatsApp
            </a>
            <button
              onClick={() => setShowModal(true)}
              style={{ background: '#1a1a1a', color: '#fff', padding: '11px 20px', borderRadius: 999, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}
            >
              Book Now
            </button>
          </div>
        </div>
      </section>

      <div style={{ padding: '0 20px' }}>
        {/* Highlights */}
        {trip.highlightsArr.length > 0 && (
          <section style={{ marginBottom: 28 }}>
            <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: 20, fontWeight: 700, marginBottom: 14 }}>Highlights</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {trip.highlightsArr.map((h, i) => (
                <span key={i} style={{ background: 'var(--green-light)', color: 'var(--green)', padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: 500 }}>
                  ✦ {h}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Itinerary */}
        {trip.itineraryArr[durIdx]?.length > 0 && (
          <section style={{ marginBottom: 28 }}>
            <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: 20, fontWeight: 700, marginBottom: 14 }}>Itinerary</h2>
            {trip.itineraryArr[durIdx].map((day, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, marginBottom: 16 }}>
                <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--green-light)', color: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
                    {i + 1}
                  </div>
                  {i < (trip.itineraryArr[durIdx].length - 1) && (
                    <div style={{ width: 1, flex: 1, background: 'var(--border)', marginTop: 4 }} />
                  )}
                </div>
                <div style={{ paddingBottom: 16 }}>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>{day.day}</p>
                  <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{day.title}</p>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{day.desc}</p>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Included / Not included */}
        <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, padding: '20px' }}>
            <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>✓ Included</h3>
            {trip.includedArr.map((item, i) => (
              <p key={i} style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>• {item}</p>
            ))}
          </div>
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, padding: '20px' }}>
            <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>✕ Not included</h3>
            {trip.notIncludedArr.map((item, i) => (
              <p key={i} style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>• {item}</p>
            ))}
          </div>
        </section>

        {/* Gallery */}
        {trip.galleryArr.length > 0 && (
          <section style={{ marginBottom: 28 }}>
            <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: 20, fontWeight: 700, marginBottom: 14 }}>Gallery</h2>
            <div className="hide-scrollbar" style={{ display: 'flex', gap: 12, overflowX: 'auto' }}>
              {trip.galleryArr.map((img, i) => (
                <img key={i} src={img} alt="" style={{ height: 200, width: 300, objectFit: 'cover', borderRadius: 14, flexShrink: 0 }} />
              ))}
            </div>
          </section>
        )}

        {/* FAQ */}
        {trip.faqsArr.length > 0 && (
          <section style={{ marginBottom: 28 }}>
            <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: 20, fontWeight: 700, marginBottom: 14 }}>FAQs</h2>
            {trip.faqsArr.map((faq, i) => (
              <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 12, marginBottom: 8, overflow: 'hidden' }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{ width: '100%', background: '#fff', border: 'none', padding: '14px 18px', textAlign: 'left', cursor: 'pointer', fontWeight: 600, fontSize: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  {faq.q}
                  <span style={{ fontSize: 18, color: 'var(--green)' }}>{openFaq === i ? '−' : '+'}</span>
                </button>
                {openFaq === i && (
                  <div style={{ padding: '0 18px 14px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </section>
        )}
      </div>

      {showModal && (
        <BookingModal tripSlug={trip.slug} tripTitle={trip.title} onClose={() => setShowModal(false)} />
      )}
    </main>
  )
}

const circBtn: React.CSSProperties = {
  width: 36, height: 36, borderRadius: '50%', border: '1.5px solid var(--border)',
  background: '#fff', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
}
