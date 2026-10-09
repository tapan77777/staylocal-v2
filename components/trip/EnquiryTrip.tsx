'use client'
import { useMemo, useState } from 'react'
import BookingModal from '@/components/BookingModal'
import PackagePicker, { type Package } from '@/components/trip/PackagePicker'
import PackageItinerary from '@/components/trip/PackageItinerary'
import { calculatePackageTotal, clampPeople, formatInr } from '@/lib/pricing'
import { waLink } from '@/lib/config'

interface TripPackage {
  id: number
  slug: string
  label: string
  days: number
  nights: number
  priceAdult: number
  priceBasis: string
  priceOnRequest: boolean
  image: string
  accommodation: string
  notes: string
  itinerary: string
  inclusions: string
  exclusions: string
  status: string
}

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
  packages: TripPackage[]
}

interface Props {
  trip: TripData
}

const TRUST = ['Handpicked stays', 'Any group size', 'Local guides', 'No hidden fees']

function parseJson<T>(s: string, fallback: T): T {
  try {
    const v = JSON.parse(s)
    return v ?? fallback
  } catch {
    return fallback
  }
}

export default function EnquiryTrip({ trip }: Props) {
  if (trip.packages && trip.packages.length > 0) {
    return <PackagedView trip={trip} />
  }
  return <LegacyView trip={trip} />
}

/* ---------- Packages-driven view ---------- */

function PackagedView({ trip }: Props) {
  const pickerPackages: Package[] = trip.packages.map(p => ({
    id: p.id,
    slug: p.slug,
    label: p.label,
    days: p.days,
    nights: p.nights,
    priceAdult: p.priceAdult,
    priceBasis: p.priceBasis,
    priceOnRequest: p.priceOnRequest,
    image: p.image,
    accommodation: p.accommodation,
    notes: p.notes,
  }))

  const [selectedId, setSelectedId] = useState<number>(trip.packages[0].id)
  const [people, setPeople] = useState(2)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [showModal, setShowModal] = useState(false)

  const selected = useMemo(
    () => trip.packages.find(p => p.id === selectedId) ?? trip.packages[0],
    [selectedId, trip.packages],
  )

  const total = selected.priceOnRequest ? null : calculatePackageTotal(selected.priceAdult, people)
  const days = parseJson<{ day: string; title: string; desc: string }[]>(selected.itinerary, [])
  const inclusions = parseJson<string[]>(selected.inclusions, [])
  const exclusions = parseJson<string[]>(selected.exclusions, [])

  const waMsg = selected.priceOnRequest || total === null
    ? `Hi StayLocal! I'm interested in *${trip.title}* — ${selected.label} for ${people} ${people === 1 ? 'traveller' : 'travellers'}. Could you share a confirmed quote?`
    : `Hi StayLocal! I'm interested in *${trip.title}* — ${selected.label} for ${people} ${people === 1 ? 'traveller' : 'travellers'}. Estimated ${formatInr(total)} (I know the final quote is confirmed before booking).`

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '0 20px 120px' }}>
      <Hero trip={trip} />

      <section
        style={{
          background: '#fff',
          border: '1px solid var(--border)',
          borderRadius: 20,
          padding: '24px 20px',
          marginBottom: 28,
        }}
      >
        <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: 22, fontWeight: 700, marginBottom: 16 }}>
          Choose your package
        </h2>
        <PackagePicker
          packages={pickerPackages}
          selectedId={selected.id}
          people={people}
          onSelect={setSelectedId}
          onPeopleChange={n => setPeople(clampPeople(n))}
          heroImage={trip.image}
        />

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 20 }}>
          <a
            href={waLink(waMsg)}
            target="_blank"
            rel="noopener noreferrer"
            style={{ background: '#25D366', color: '#fff', padding: '12px 20px', borderRadius: 999, textDecoration: 'none', fontWeight: 600, fontSize: 14, flex: '1 1 140px', textAlign: 'center' }}
          >
            WhatsApp
          </a>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            style={{ background: 'var(--green)', color: '#fff', padding: '12px 20px', borderRadius: 999, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14, flex: '1 1 140px' }}
          >
            Send enquiry
          </button>
        </div>
      </section>

      {/* Trust badges */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10, marginBottom: 28 }}>
        {TRUST.map(item => (
          <div key={item} style={{ background: 'var(--green-light)', borderRadius: 12, padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--green)' }}>
            ✓ {item}
          </div>
        ))}
      </div>

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

      <PackageItinerary
        packageLabel={selected.label}
        days={days}
        inclusions={inclusions}
        exclusions={exclusions}
        accommodation={selected.accommodation}
        notes={selected.notes}
      />

      {/* Enquiry CTA block */}
      <div style={{ background: 'var(--green)', borderRadius: 20, padding: '28px 24px', textAlign: 'center', color: '#fff', margin: '28px 0' }}>
        <h3 style={{ fontFamily: 'var(--font-playfair)', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Interested? Let&apos;s talk.</h3>
        <p style={{ fontSize: 14, opacity: 0.9, marginBottom: 20 }}>
          Share your dates and group size — we&apos;ll send a tailored quote with full inclusions. The price shown is an estimate.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowModal(true)}
            style={{ background: '#fff', color: 'var(--green)', padding: '12px 24px', borderRadius: 999, border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
          >
            Send enquiry
          </button>
          <a
            href={waLink(waMsg)}
            target="_blank"
            rel="noopener noreferrer"
            style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', padding: '12px 24px', borderRadius: 999, textDecoration: 'none', fontWeight: 700, fontSize: 14, border: '1.5px solid rgba(255,255,255,0.4)' }}
          >
            WhatsApp instead
          </a>
        </div>
      </div>

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

      {trip.faqsArr.length > 0 && (
        <section>
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
                <div style={{ padding: '0 18px 14px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{faq.a}</div>
              )}
            </div>
          ))}
        </section>
      )}

      <StickyCta
        totalLabel={selected.priceOnRequest || total === null ? 'Price on request' : formatInr(total)}
        onEnquire={() => setShowModal(true)}
        waMsg={waMsg}
      />

      {showModal && (
        <BookingModal
          tripSlug={trip.slug}
          tripTitle={trip.title}
          packageId={selected.id}
          packageLabel={selected.label}
          estimatedPrice={total}
          priceOnRequest={selected.priceOnRequest}
          initialPeople={people}
          onClose={() => setShowModal(false)}
        />
      )}
    </main>
  )
}

/* ---------- Hero (shared) ---------- */

function Hero({ trip }: { trip: TripData }) {
  return (
    <div style={{ position: 'relative', height: 320, borderRadius: 20, overflow: 'hidden', marginTop: 24, marginBottom: 20 }}>
      {trip.image ? (
        <img src={trip.image} alt={trip.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#a8c5b8,#6fa08a)' }} />
      )}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)' }} />
      <div style={{ position: 'absolute', bottom: 24, left: 24, right: 24, color: '#fff' }}>
        <span style={{ fontSize: 11, background: 'var(--green)', padding: '3px 10px', borderRadius: 999, display: 'inline-block', marginBottom: 10 }}>
          {trip.category}
        </span>
        <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: 30, fontWeight: 700, marginBottom: 4 }}>{trip.title}</h1>
        <p style={{ fontSize: 14, opacity: 0.85 }}>📍 {trip.location}</p>
      </div>
    </div>
  )
}

/* ---------- Legacy view (unchanged behavior) ---------- */

function LegacyView({ trip }: Props) {
  const [durIdx, setDurIdx] = useState(0)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [showModal, setShowModal] = useState(false)

  const price = trip.pricingArr[0]?.[0] ?? trip.price

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '0 20px 120px' }}>
      <Hero trip={trip} />

      {/* Summary bar — price + CTA */}
      <div
        style={{
          background: '#fff',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: '16px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
          marginBottom: 24,
        }}
      >
        <div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>Starting from</p>
          <p style={{ fontSize: 22, fontWeight: 700 }}>₹{price.toLocaleString('en-IN')}<span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 400 }}> / person</span></p>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Final quote shared on enquiry</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowModal(true)}
            style={{ background: '#1a1a1a', color: '#fff', padding: '11px 20px', borderRadius: 999, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}
          >
            Send enquiry
          </button>
          <a
            href={waLink(`Hi! I'm interested in ${trip.title}`)}
            target="_blank"
            rel="noopener noreferrer"
            style={{ background: 'var(--green)', color: '#fff', padding: '11px 20px', borderRadius: 999, textDecoration: 'none', fontWeight: 600, fontSize: 14 }}
          >
            WhatsApp
          </a>
        </div>
      </div>

      {/* Trust badges */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10, marginBottom: 28 }}>
        {TRUST.map(item => (
          <div key={item} style={{ background: 'var(--green-light)', borderRadius: 12, padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--green)' }}>
            ✓ {item}
          </div>
        ))}
      </div>

      {trip.includedArr.length > 0 && (
        <section style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, padding: '20px 24px', marginBottom: 28 }}>
          <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: 20, fontWeight: 700, marginBottom: 14 }}>What&apos;s included</h2>
          {trip.includedArr.map((item, i) => (
            <p key={i} style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>✓ {item}</p>
          ))}
        </section>
      )}

      {trip.notIncludedArr.length > 0 && (
        <section style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, padding: '20px 24px', marginBottom: 28 }}>
          <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: 20, fontWeight: 700, marginBottom: 14 }}>Not included</h2>
          {trip.notIncludedArr.map((item, i) => (
            <p key={i} style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>✕ {item}</p>
          ))}
        </section>
      )}

      {trip.durLabelsArr.length > 0 && (
        <section style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, padding: '20px 24px', marginBottom: 28 }}>
          <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: 20, fontWeight: 700, marginBottom: 14 }}>Choose duration</h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            {trip.durLabelsArr.map((label, i) => (
              <button
                key={i}
                onClick={() => setDurIdx(i)}
                style={{
                  padding: '8px 18px',
                  borderRadius: 999,
                  border: `1.5px solid ${i === durIdx ? 'var(--green)' : 'var(--border)'}`,
                  background: i === durIdx ? 'var(--green-light)' : '#fff',
                  color: i === durIdx ? 'var(--green)' : '#1a1a1a',
                  fontWeight: i === durIdx ? 700 : 400,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <p style={{ fontSize: 15, fontWeight: 700 }}>
            Starting from ₹{(trip.pricingArr[0]?.[durIdx] ?? price).toLocaleString('en-IN')}/person
          </p>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            Estimate — final quote confirmed on enquiry before booking.
          </p>
        </section>
      )}

      <div style={{ background: 'var(--green)', borderRadius: 20, padding: '28px 24px', textAlign: 'center', color: '#fff', marginBottom: 28 }}>
        <h3 style={{ fontFamily: 'var(--font-playfair)', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Interested? Let&apos;s talk.</h3>
        <p style={{ fontSize: 14, opacity: 0.9, marginBottom: 20 }}>
          Share your dates and group size — we&apos;ll send a tailored quote with full inclusions.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowModal(true)}
            style={{ background: '#fff', color: 'var(--green)', padding: '12px 24px', borderRadius: 999, border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
          >
            Send enquiry
          </button>
          <a
            href={waLink(`Hi! I'm interested in ${trip.title}`)}
            target="_blank"
            rel="noopener noreferrer"
            style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', padding: '12px 24px', borderRadius: 999, textDecoration: 'none', fontWeight: 700, fontSize: 14, border: '1.5px solid rgba(255,255,255,0.4)' }}
          >
            WhatsApp instead
          </a>
        </div>
      </div>

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

      {trip.faqsArr.length > 0 && (
        <section>
          <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: 20, fontWeight: 700, marginBottom: 14 }}>FAQs</h2>
          {trip.faqsArr.map((faq, i) => (
            <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 12, marginBottom: 8 }}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{ width: '100%', background: '#fff', border: 'none', padding: '14px 18px', textAlign: 'left', cursor: 'pointer', fontWeight: 600, fontSize: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: 12 }}
              >
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

      <StickyCta
        totalLabel={`₹${price.toLocaleString('en-IN')}`}
        onEnquire={() => setShowModal(true)}
        waMsg={`Hi! I'm interested in ${trip.title}`}
      />

      {showModal && (
        <BookingModal tripSlug={trip.slug} tripTitle={trip.title} onClose={() => setShowModal(false)} />
      )}
    </main>
  )
}

function StickyCta({ totalLabel, onEnquire, waMsg }: { totalLabel: string; onEnquire: () => void; waMsg: string }) {
  return (
    <div
      className="md:hidden"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: '#fff',
        borderTop: '1px solid var(--border)',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        zIndex: 40,
        boxShadow: '0 -4px 12px rgba(0,0,0,0.06)',
      }}
    >
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Est. total</p>
        <p style={{ fontSize: 17, fontWeight: 700 }}>{totalLabel}</p>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <a
          href={waLink(waMsg)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="WhatsApp"
          style={{ background: '#25D366', color: '#fff', padding: '10px 14px', borderRadius: 999, textDecoration: 'none', fontWeight: 600, fontSize: 13 }}
        >
          WhatsApp
        </a>
        <button
          onClick={onEnquire}
          style={{ background: 'var(--green)', color: '#fff', padding: '10px 18px', borderRadius: 999, border: 'none', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
        >
          Enquire
        </button>
      </div>
    </div>
  )
}
