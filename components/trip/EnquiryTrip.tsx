'use client'
import { useState } from 'react'

interface TripData {
  id: number
  slug: string
  title: string
  subtitle: string
  location: string
  category: string
  duration: string
  price: number
  image: string
  galleryArr: string[]
  highlightsArr: string[]
  includedArr: string[]
  notIncludedArr: string[]
  faqsArr: { q: string; a: string }[]
  durLabelsArr: string[]
  pricingArr: number[][]
}

interface Props {
  trip: TripData
}

const TRUST = ['Handpicked stays', 'Small groups', 'Local guides', 'No hidden fees']

export default function EnquiryTrip({ trip }: Props) {
  const [durIdx, setDurIdx] = useState(0)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const price = trip.pricingArr[0]?.[0] ?? trip.price

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '0 20px 60px' }}>
      {/* Hero */}
      <div style={{ position: 'relative', height: 320, borderRadius: 20, overflow: 'hidden', marginTop: 24, marginBottom: 32 }}>
        {trip.image ? (
          <img src={trip.image} alt={trip.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#a8c5b8,#6fa08a)' }} />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)' }} />
        <div style={{ position: 'absolute', bottom: 24, left: 24, color: '#fff' }}>
          <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: 30, fontWeight: 700, marginBottom: 4 }}>{trip.title}</h1>
          <p style={{ fontSize: 14, opacity: 0.85 }}>📍 {trip.location}</p>
        </div>
      </div>

      {/* Trust badges */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 28 }}>
        {TRUST.map(item => (
          <div key={item} style={{ background: 'var(--green-light)', borderRadius: 12, padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--green)' }}>
            ✓ {item}
          </div>
        ))}
      </div>

      {/* Included */}
      {trip.includedArr.length > 0 && (
        <section style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, padding: '20px 24px', marginBottom: 28 }}>
          <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: 20, fontWeight: 700, marginBottom: 14 }}>What&apos;s included</h2>
          {trip.includedArr.map((item, i) => (
            <p key={i} style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>✓ {item}</p>
          ))}
        </section>
      )}

      {/* Duration picker */}
      {trip.durLabelsArr.length > 0 && (
        <section style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, padding: '20px 24px', marginBottom: 28 }}>
          <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: 20, fontWeight: 700, marginBottom: 14 }}>Choose duration</h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            {trip.durLabelsArr.map((label, i) => (
              <button key={i} onClick={() => setDurIdx(i)} style={{ padding: '8px 18px', borderRadius: 999, border: `1.5px solid ${i === durIdx ? 'var(--green)' : 'var(--border)'}`, background: i === durIdx ? 'var(--green-light)' : '#fff', color: i === durIdx ? 'var(--green)' : '#1a1a1a', fontWeight: i === durIdx ? 700 : 400, fontSize: 13, cursor: 'pointer' }}>{label}</button>
            ))}
          </div>
          <p style={{ fontSize: 15, fontWeight: 700 }}>Starting from ₹{(trip.pricingArr[0]?.[durIdx] ?? price).toLocaleString('en-IN')}/person</p>
        </section>
      )}

      {/* WhatsApp CTA */}
      <div style={{ background: 'var(--green)', borderRadius: 20, padding: '28px 24px', textAlign: 'center', color: '#fff', marginBottom: 28 }}>
        <h3 style={{ fontFamily: 'var(--font-playfair)', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Interested? Let&apos;s talk!</h3>
        <p style={{ fontSize: 14, opacity: 0.85, marginBottom: 20 }}>WhatsApp us for availability, pricing and customisation</p>
        <a href={`https://wa.me/919999999999?text=${encodeURIComponent(`Hi! I'm interested in ${trip.title}`)}`} target="_blank" rel="noopener noreferrer" style={{ background: '#fff', color: 'var(--green)', padding: '12px 28px', borderRadius: 999, textDecoration: 'none', fontWeight: 700, fontSize: 15 }}>
          WhatsApp now →
        </a>
      </div>

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
        <section>
          <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: 20, fontWeight: 700, marginBottom: 14 }}>FAQs</h2>
          {trip.faqsArr.map((faq, i) => (
            <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 12, marginBottom: 8 }}>
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ width: '100%', background: '#fff', border: 'none', padding: '14px 18px', textAlign: 'left', cursor: 'pointer', fontWeight: 600, fontSize: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: 12 }}>
                {faq.q}
                <span style={{ fontSize: 18, color: 'var(--green)' }}>{openFaq === i ? '−' : '+'}</span>
              </button>
              {openFaq === i && (
                <div style={{ padding: '0 18px 14px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{faq.a}</div>
              )}
            </div>
          ))}
        </section>
      )}
    </main>
  )
}
