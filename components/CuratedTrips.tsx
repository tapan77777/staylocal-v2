'use client'
import { useEffect, useRef, useState } from 'react'
import Reveal from './Reveal'
import { brand, waLink } from '@/lib/config'

type ItineraryStop = { day: string; title: string; desc: string }

type CuratedTrip = {
  key: string
  title: string
  location: string
  duration: string
  priceFrom: number
  badge: string
  image: string
  description: string
  itinerary: ItineraryStop[]
  inclusions: string[]
  exclusions: string[]
}

const CURATED: CuratedTrip[] = [
  {
    key: 'rishikesh',
    title: 'Rishikesh Escape',
    location: 'Uttarakhand',
    duration: '3 days · 2 nights',
    priceFrom: 6999,
    badge: 'Yoga & River',
    image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1200&q=72',
    description:
      'A gentle long weekend by the Ganga — sunrise yoga, a half-day of white-water rafting, cafés on the Laxman Jhula side, and an evening of Ganga aarti. Family-friendly and easy to pair with a weekend.',
    itinerary: [
      { day: 'Day 1', title: 'Arrive & settle in', desc: 'Transfer from Dehradun / Haridwar. Riverside walk, early dinner, Ganga aarti at Parmarth Niketan.' },
      { day: 'Day 2', title: 'River day', desc: 'White-water rafting Shivpuri → Ram Jhula. Afternoon rest, café hop, optional sunset yoga.' },
      { day: 'Day 3', title: 'Slow morning & return', desc: 'Beatles Ashram walk or a guided meditation session, breakfast, transfer out by noon.' },
    ],
    inclusions: ['Boutique riverside stay (twin sharing)', 'Daily breakfast + one dinner', 'Rafting with certified guide', 'Airport/station transfers', 'On-trip coordinator'],
    exclusions: ['Flights/trains to Dehradun or Haridwar', 'Lunches & personal expenses', 'Spa, additional activities'],
  },
  {
    key: 'mussoorie-landour',
    title: 'Mussoorie & Landour',
    location: 'Uttarakhand',
    duration: '4 days · 3 nights',
    priceFrom: 8999,
    badge: 'Hill-station classic',
    image: 'https://images.unsplash.com/photo-1500835556837-99ac94a94552?auto=format&fit=crop&w=1200&q=72',
    description:
      'A slow upper-hills escape split between buzzy Mussoorie and quiet Landour — char dukaan mornings, Camel\u2019s Back walks, a day trip to Dhanaulti, and bookshop afternoons.',
    itinerary: [
      { day: 'Day 1', title: 'Arrive Mussoorie', desc: 'Drive up from Dehradun, settle in on Mall Road. Sunset at Gun Hill, dinner at a heritage café.' },
      { day: 'Day 2', title: 'Landour day', desc: 'Shift to Landour, breakfast at Char Dukaan, bookshops, Lal Tibba viewpoint, slow evening.' },
      { day: 'Day 3', title: 'Dhanaulti excursion', desc: 'Day trip to Eco Park & Surkanda Devi. Return for a riverside dinner.' },
      { day: 'Day 4', title: 'Return', desc: 'Breakfast, short Camel\u2019s Back walk, transfer down to Dehradun.' },
    ],
    inclusions: ['Hand-picked heritage stay', 'Daily breakfast', 'Private car for all transfers & day trips', 'On-trip coordinator'],
    exclusions: ['Flights/trains to Dehradun', 'Lunches & dinners', 'Monument entry fees'],
  },
  {
    key: 'munnar-alleppey',
    title: 'Munnar & Alleppey',
    location: 'Kerala',
    duration: '5 days · 4 nights',
    priceFrom: 12999,
    badge: 'Hills to houseboat',
    image: 'https://images.unsplash.com/photo-1527525443983-6e60c75fff46?auto=format&fit=crop&w=1200&q=72',
    description:
      'Tea gardens and a houseboat on the backwaters — Kerala\u2019s greatest hits paced for actual rest. We stay in boutique estates and finish with two slow Alleppey nights.',
    itinerary: [
      { day: 'Day 1', title: 'Kochi to Munnar', desc: 'Scenic drive up through the Western Ghats. Easy evening at a tea estate stay.' },
      { day: 'Day 2', title: 'Munnar — tea & trails', desc: 'Tea Museum, a guided plantation walk, Eravikulam viewpoint, café lunch.' },
      { day: 'Day 3', title: 'Munnar → Alleppey', desc: 'Scenic drive to the backwaters. Board a private houseboat by late afternoon.' },
      { day: 'Day 4', title: 'Backwater day', desc: 'Village walks, long lunch, a canoe ride through narrower canals.' },
      { day: 'Day 5', title: 'Return', desc: 'Breakfast on the boat, drive back to Kochi airport.' },
    ],
    inclusions: ['Boutique stays throughout', 'Private houseboat (1 night)', 'All breakfasts + houseboat meals', 'Private car with driver', 'Guided tea walk'],
    exclusions: ['Flights to Kochi', 'Most lunches & dinners', 'Alcoholic beverages'],
  },
  {
    key: 'jibhi',
    title: 'Jibhi Mountain Retreat',
    location: 'Himachal Pradesh',
    duration: '4 days · 3 nights',
    priceFrom: 9999,
    badge: 'Pine valleys & cafés',
    image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1200&q=72',
    description:
      'Jibhi, Tirthan and Shoja without the Instagram crowd — wooden-balcony homestays, a Serolsar lake day, a riverside picnic and a slow drive to Jalori Pass.',
    itinerary: [
      { day: 'Day 1', title: 'Delhi/Chandigarh to Jibhi', desc: 'Transfer up to the Tirthan valley. Settle in, evening by the river.' },
      { day: 'Day 2', title: 'Chehni Kothi & waterfalls', desc: 'Short hike to Chehni Kothi tower, afternoon at a riverside café, slow dinner.' },
      { day: 'Day 3', title: 'Jalori Pass & Serolsar lake', desc: 'Early drive to Jalori. Walk through oak forest to Serolsar. Picnic lunch, return by evening.' },
      { day: 'Day 4', title: 'Return', desc: 'Breakfast on the deck, drive back to Chandigarh.' },
    ],
    inclusions: ['Wooden-cottage homestay', 'Daily breakfast + one dinner', 'Private vehicle for day trips', 'Local guide for hikes'],
    exclusions: ['Flights/trains to Delhi or Chandigarh', 'Lunches & personal expenses', 'Adventure activity fees'],
  },
  {
    key: 'darjeeling',
    title: 'Darjeeling Hills',
    location: 'West Bengal',
    duration: '4 days · 3 nights',
    priceFrom: 10999,
    badge: 'Toy train & tea',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=72',
    description:
      'A nostalgic hill-station week with a Himalayan payoff — Tiger Hill at dawn, a joy ride on the toy train, a tea garden lunch, and a short detour to quiet Lamahatta.',
    itinerary: [
      { day: 'Day 1', title: 'Bagdogra to Darjeeling', desc: 'Scenic drive up. Evening walk on the Mall, dinner at Glenary\u2019s.' },
      { day: 'Day 2', title: 'Tiger Hill sunrise', desc: 'Early sunrise, Ghoom Monastery, toy train ride, Happy Valley tea estate.' },
      { day: 'Day 3', title: 'Lamahatta & Tinchuley', desc: 'Day trip to Lamahatta pine forest and Tinchuley viewpoint. Evening free.' },
      { day: 'Day 4', title: 'Return', desc: 'Last breakfast, transfer back to Bagdogra airport.' },
    ],
    inclusions: ['Heritage colonial stay', 'Daily breakfast', 'Toy train joy-ride tickets', 'Private car with driver', 'Guided Tiger Hill morning'],
    exclusions: ['Flights to Bagdogra', 'Most meals', 'Monument entry fees'],
  },
  {
    key: 'andaman',
    title: 'Andaman Island Escape',
    location: 'Andaman & Nicobar',
    duration: '5 days · 4 nights',
    priceFrom: 16999,
    badge: 'Reef & white sand',
    image: 'https://images.unsplash.com/photo-1586500036706-41963de24d8b?auto=format&fit=crop&w=1200&q=72',
    description:
      'Port Blair, Havelock and Neil — the slow version. Snorkel at a reef, read on Radhanagar at sunset, and kayak the Neil mangroves before heading home.',
    itinerary: [
      { day: 'Day 1', title: 'Arrive Port Blair', desc: 'Transfer in, Cellular Jail light-&-sound show in the evening.' },
      { day: 'Day 2', title: 'Ferry to Havelock', desc: 'Morning ferry. Afternoon on Radhanagar Beach, sunset there.' },
      { day: 'Day 3', title: 'Elephant Beach & reef', desc: 'Snorkelling at Elephant Beach. Easy afternoon, Kalapathar for sunrise.' },
      { day: 'Day 4', title: 'Neil Island', desc: 'Short ferry across. Natural Bridge, Laxmanpur sunset, kayak through mangroves.' },
      { day: 'Day 5', title: 'Return', desc: 'Return ferry to Port Blair, transfer to airport.' },
    ],
    inclusions: ['Beachfront stays on Havelock & Neil', 'All inter-island ferries (standard class)', 'Daily breakfast', 'Snorkelling at Elephant Beach', 'All airport & jetty transfers'],
    exclusions: ['Flights to Port Blair', 'Most lunches & dinners', 'Scuba diving (optional add-on)'],
  },
  {
    key: 'rajasthan',
    title: 'Rajasthan Heritage',
    location: 'Jaipur, Rajasthan',
    duration: '4 days · 3 nights',
    priceFrom: 8999,
    badge: 'Forts & palaces',
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=72',
    description:
      'A pink-city long weekend — Amer Fort mornings, Hawa Mahal, a bazaar walk through the old city, and one quiet half-day at Nahargarh overlooking Jaipur.',
    itinerary: [
      { day: 'Day 1', title: 'Arrive Jaipur', desc: 'Settle in, Chokhi Dhani or Bapu Bazar walk, dinner at a heritage haveli.' },
      { day: 'Day 2', title: 'Amer & old city', desc: 'Amer Fort morning, Hawa Mahal, Jantar Mantar, local lunch, pink-city dinner.' },
      { day: 'Day 3', title: 'Nahargarh & craft walk', desc: 'Nahargarh viewpoint, Albert Hall museum, afternoon haveli block-print workshop.' },
      { day: 'Day 4', title: 'Return', desc: 'Last breakfast, bazaar stop for souvenirs, transfer to Jaipur airport.' },
    ],
    inclusions: ['Heritage haveli stay', 'Daily breakfast', 'Private AC car with driver', 'Amer & Nahargarh entries', 'Local walking guide'],
    exclusions: ['Flights in/out', 'Most lunches & dinners', 'Camera fees at monuments'],
  },
  {
    key: 'himachal',
    title: 'Himachal Family Escape',
    location: 'Shoja · Manali · Solang',
    duration: '5 days · 4 nights',
    priceFrom: 13999,
    badge: 'Cedars & snow views',
    image: 'https://images.unsplash.com/photo-1587922546307-776227941871?auto=format&fit=crop&w=1200&q=72',
    description:
      'A quieter Himachal loop — start in sleepy Shoja, cross the Jalori Pass, then slow days in old Manali with one adventure morning at Solang.',
    itinerary: [
      { day: 'Day 1', title: 'Chandigarh to Shoja', desc: 'Transfer up through the Tirthan valley. Settle in at a cedar-forest lodge.' },
      { day: 'Day 2', title: 'Jalori Pass walk', desc: 'Oak-forest walk to Serolsar lake. Picnic lunch, slow evening.' },
      { day: 'Day 3', title: 'Shoja to Manali', desc: 'Drive via Mandi. Settle in old Manali, café evening.' },
      { day: 'Day 4', title: 'Manali & Solang', desc: 'Hadimba temple, Vashisht hot springs, Solang ropeway morning, café hop and farewell dinner.' },
      { day: 'Day 5', title: 'Return', desc: 'Breakfast, transfer down to Chandigarh (or fly out from Bhuntar).' },
    ],
    inclusions: ['Boutique stays throughout', 'Daily breakfast', 'Private vehicle with driver', 'Solang ropeway tickets', 'Local guide for Jalori walk'],
    exclusions: ['Flights/trains', 'Lunches & dinners', 'Paragliding & snow activities'],
  },
]

function formatInr(n: number) {
  return `₹${n.toLocaleString('en-IN')}`
}

function buildWaMessage(t: CuratedTrip) {
  return [
    `Hi StayLocal! I'd love a curated trip to *${t.title}*.`,
    `Duration: ${t.duration}`,
    `Indicative price per person: from ${formatInr(t.priceFrom)} (flights excluded, final price confirmed after enquiry).`,
    `Could you share a tailored itinerary and quote?`,
  ].join('\n')
}

export default function CuratedTrips() {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const pausedRef = useRef(false)
  const visibleRef = useRef(true)
  const [open, setOpen] = useState<CuratedTrip | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const el = scrollRef.current
    if (!el) return

    const mql = window.matchMedia('(prefers-reduced-motion: no-preference)')
    if (!mql.matches) return

    const io = new IntersectionObserver(
      entries => { visibleRef.current = entries[0]?.isIntersecting ?? false },
      { threshold: 0.2 },
    )
    io.observe(el)

    const timer = window.setInterval(() => {
      if (pausedRef.current || !visibleRef.current || document.hidden || open) return
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 10
      if (atEnd) {
        el.scrollTo({ left: 0, behavior: 'smooth' })
      } else {
        const card = el.querySelector<HTMLElement>('[data-curated-card]')
        const step = card ? card.offsetWidth + 14 : Math.round(el.clientWidth * 0.5)
        el.scrollBy({ left: step, behavior: 'smooth' })
      }
    }, 5200)

    return () => {
      io.disconnect()
      window.clearInterval(timer)
    }
  }, [open])

  return (
    <section
      id="curated"
      style={{
        padding: 'clamp(32px, 6vh, 56px) 0',
        background: 'linear-gradient(180deg, var(--bg) 0%, #fbfaf7 100%)',
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0 20px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <Reveal>
          <div style={{ maxWidth: 680 }}>
            <p className="eyebrow" style={{ marginBottom: 8 }}>Curated for you</p>
            <h2 className="section-title">Hand-picked trips, ready to go.</h2>
            <p
              style={{
                color: 'var(--text-secondary)',
                fontSize: 'clamp(14px, 1.3vw, 16px)',
                marginTop: 8,
                lineHeight: 1.6,
                maxWidth: 560,
              }}
            >
              Eight small-group ideas we love right now. Prices are indicative, per person,
              twin sharing — excluding flights, and confirmed after we understand your dates
              and preferences.
            </p>
          </div>
        </Reveal>
      </div>

      <div
        ref={scrollRef}
        className="hscroll hide-scrollbar curated-row"
        onMouseEnter={() => { pausedRef.current = true }}
        onMouseLeave={() => { pausedRef.current = false }}
        onFocusCapture={() => { pausedRef.current = true }}
        onBlurCapture={() => { pausedRef.current = false }}
        onTouchStart={() => { pausedRef.current = true }}
        onTouchEnd={() => { pausedRef.current = false }}
        aria-label="Curated trips carousel"
      >
        {CURATED.map((t, i) => (
          <Reveal key={t.key} delay={i * 60} style={{ flexShrink: 0 }}>
            <button
              type="button"
              data-curated-card
              onClick={() => setOpen(t)}
              className="lift"
              aria-label={`Open ${t.title} details`}
              style={{
                position: 'relative',
                display: 'block',
                width: '82vw',
                maxWidth: 320,
                height: 420,
                borderRadius: 20,
                overflow: 'hidden',
                border: 'none',
                padding: 0,
                background: '#0b1510',
                color: '#fff',
                textAlign: 'left',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-md)',
                fontFamily: 'inherit',
              }}
            >
              <img
                src={t.image}
                alt=""
                className="card-img"
                style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.92 }}
              />
              <div
                aria-hidden
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(180deg, rgba(0,0,0,0.0) 28%, rgba(0,0,0,0.78) 100%)',
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  top: 14,
                  left: 14,
                  fontSize: 11,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  background: 'rgba(255,255,255,0.92)',
                  color: '#1a1a1a',
                  padding: '5px 10px',
                  borderRadius: 999,
                  fontWeight: 700,
                }}
              >
                {t.badge}
              </span>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  padding: 18,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  gap: 6,
                }}
              >
                <p style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.78)' }}>
                  {t.location}
                </p>
                <h3 style={{ fontFamily: 'var(--font-playfair)', fontSize: 24, fontWeight: 700, lineHeight: 1.1 }}>
                  {t.title}
                </h3>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.86)' }}>{t.duration}</p>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 8, gap: 8 }}>
                  <span style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>From</span>
                    <span style={{ fontFamily: 'var(--font-playfair)', fontSize: 20, fontWeight: 700, color: '#fff' }}>
                      {formatInr(t.priceFrom)}
                    </span>
                    <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.6)' }}>per person · indicative</span>
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#9FE4C4' }}>View →</span>
                </div>
              </div>
            </button>
          </Reveal>
        ))}
      </div>

      <style>{`
        .curated-row { padding: 4px 20px 16px; }
        @media (min-width: 720px) {
          .curated-row > * { }
          .curated-row [data-curated-card] { width: 300px !important; }
        }
        @media (min-width: 1024px) {
          .curated-row {
            max-width: 1200px;
            margin: 0 auto;
          }
          .curated-row [data-curated-card] { width: 282px !important; }
        }
      `}</style>

      {open && <CuratedModal trip={open} onClose={() => setOpen(null)} />}
    </section>
  )
}

function CuratedModal({ trip, onClose }: { trip: CuratedTrip; onClose: () => void }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const waMsg = buildWaMessage(trip)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="curated-modal-title"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(10, 20, 15, 0.62)',
        backdropFilter: 'blur(4px)',
        zIndex: 90,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(0px, 2vh, 32px)',
        animation: 'curatedFade 220ms ease-out',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 'clamp(0px, 2vw, 24px)',
          maxWidth: 820,
          width: '100%',
          maxHeight: '96vh',
          overflow: 'auto',
          position: 'relative',
          boxShadow: '0 30px 70px rgba(0,0,0,0.35)',
          animation: 'curatedRise 260ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            width: 36,
            height: 36,
            borderRadius: 999,
            border: 'none',
            background: 'rgba(255,255,255,0.95)',
            color: '#1a1a1a',
            cursor: 'pointer',
            fontSize: 18,
            lineHeight: 1,
            boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
            zIndex: 2,
          }}
        >
          ×
        </button>

        <div style={{ position: 'relative', width: '100%', height: 'clamp(220px, 38vh, 320px)' }}>
          <img src={trip.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.05) 40%, rgba(0,0,0,0.72) 100%)' }} />
          <div style={{ position: 'absolute', inset: 0, padding: 'clamp(16px, 3vw, 28px)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', color: '#fff', gap: 6 }}>
            <p style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.82)' }}>{trip.location}</p>
            <h2 id="curated-modal-title" style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(26px, 4vw, 34px)', fontWeight: 700, lineHeight: 1.08 }}>
              {trip.title}
            </h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)' }}>{trip.duration} · {trip.badge}</p>
          </div>
        </div>

        <div style={{ padding: 'clamp(20px, 3vw, 32px)', display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div
            style={{
              display: 'flex',
              gap: 16,
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--bg-muted, #f6f5f0)',
              border: '1px solid var(--border, #e8e6df)',
              borderRadius: 14,
              padding: '14px 18px',
            }}
          >
            <div>
              <p style={{ fontSize: 10.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>Indicative price</p>
              <p style={{ fontFamily: 'var(--font-playfair)', fontSize: 26, fontWeight: 700, color: '#1a1a1a', marginTop: 2 }}>
                from {formatInr(trip.priceFrom)}
                <span style={{ fontFamily: 'inherit', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginLeft: 6 }}>/ person</span>
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-muted, #8a877f)', marginTop: 4 }}>
                Indicative price per person · Flights excluded · Final price confirmed after enquiry
              </p>
            </div>
            <a
              href={waLink(waMsg)}
              target="_blank"
              rel="noopener"
              className="lift"
              style={{
                background: 'var(--green)',
                color: '#fff',
                padding: '12px 22px',
                borderRadius: 999,
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: 14,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                border: 'none',
                boxShadow: '0 6px 16px rgba(45,120,80,0.28)',
              }}
            >
              Get a curated trip →
            </a>
          </div>

          <p style={{ fontSize: 15, lineHeight: 1.65, color: '#2a2a2a' }}>{trip.description}</p>

          <section>
            <h3 style={subHead}>Sample itinerary</h3>
            <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {trip.itinerary.map(stop => (
                <li
                  key={stop.day}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '72px 1fr',
                    gap: 14,
                    padding: '10px 0',
                    borderTop: '1px solid var(--border-light, #efede6)',
                  }}
                >
                  <span style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--green)', fontWeight: 700, paddingTop: 2 }}>
                    {stop.day}
                  </span>
                  <span>
                    <p style={{ fontWeight: 700, fontSize: 14, color: '#1a1a1a' }}>{stop.title}</p>
                    <p style={{ fontSize: 13.5, lineHeight: 1.55, color: 'var(--text-secondary)', marginTop: 2 }}>{stop.desc}</p>
                  </span>
                </li>
              ))}
            </ol>
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
            <div>
              <h3 style={subHead}>What&apos;s included</h3>
              <ul style={bulletList}>
                {trip.inclusions.map(i => (
                  <li key={i} style={bulletItem}>
                    <span style={{ color: 'var(--green)', fontWeight: 700, marginRight: 8 }}>✓</span>
                    {i}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 style={subHead}>Not included</h3>
              <ul style={bulletList}>
                {trip.exclusions.map(i => (
                  <li key={i} style={bulletItem}>
                    <span style={{ color: '#b55454', fontWeight: 700, marginRight: 8 }}>×</span>
                    {i}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <p style={{ fontSize: 12, color: 'var(--text-muted, #8a877f)', lineHeight: 1.6, borderTop: '1px solid var(--border-light, #efede6)', paddingTop: 14 }}>
            Itinerary & pricing above are indicative. Your final quote is confirmed after
            we understand your dates, group size and preferences. Reach us anytime at{' '}
            <a href={waLink(waMsg)} target="_blank" rel="noopener" style={{ color: 'var(--green)', fontWeight: 600 }}>
              WhatsApp {brand.whatsapp.display}
            </a>.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes curatedFade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes curatedRise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @media (prefers-reduced-motion: reduce) {
          [role="dialog"] { animation: none !important; }
          [role="dialog"] > div { animation: none !important; }
        }
      `}</style>
    </div>
  )
}

const subHead: React.CSSProperties = {
  fontFamily: 'var(--font-playfair)',
  fontSize: 18,
  fontWeight: 700,
  color: '#1a1a1a',
  marginBottom: 10,
}

const bulletList: React.CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
}

const bulletItem: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  fontSize: 13.5,
  lineHeight: 1.55,
  color: '#2a2a2a',
}
