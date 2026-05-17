'use client'
import { useState } from 'react'

// ─── types ────────────────────────────────────────────────────────────────────

interface Hotel { portblair: string; havelock: string; neil: string }
interface Tier {
  name: string; subtitle: string; popular: boolean
  bufferPrice: number[]; price: number[]; promoPrice: number[]; discount: number[]
  hotels: Hotel; ferry: string; meals: string; features: string[]
}
interface Duration { label: string; sub: string; image: string }
interface Pricing {
  durations: Duration[]; tiers: Tier[]
  promoCodes: string[]; promoDiscount: number
}
interface ItDay { day: string; title: string; desc: string }
interface TripRaw {
  slug: string; title: string; subtitle: string; location: string
  category: string; duration: string; price: number
  image: string; gallery: string; route: string
  highlights: string; included: string; notIncluded: string
  faqs: string; pricing: string
}

// ─── itinerary data ────────────────────────────────────────────────────────────

const BASE_DAYS: ItDay[] = [
  { day: 'Day 1', title: 'Port Blair — Arrive', desc: "Airport pickup, hotel check-in. Visit Cellular Jail, evening Light & Sound show. Corbyn's Cove beach walk." },
  { day: 'Day 2', title: 'Havelock Island', desc: "Morning private ferry to Havelock. Check-in, afternoon at Radhanagar Beach — one of Asia's finest. Kalapathar sunset." },
  { day: 'Day 3', title: 'Elephant Beach', desc: 'Snorkeling at Elephant Beach (complimentary). Glass boat ride over coral. Free afternoon at leisure.' },
  { day: 'Day 4', title: 'Port Blair — Depart', desc: 'Ferry back to Port Blair, last-minute shopping at Aberdeen Bazaar. Airport drop.' },
]
const NEIL_DAYS: ItDay[] = [
  { day: 'Day 4', title: 'Neil Island', desc: 'Ferry to Neil Island — the quietest and most beautiful. Bharatpur beach, Laxmanpur sunset, Natural Bridge.' },
  { day: 'Day 5', title: 'Port Blair — Depart', desc: 'Morning ferry back to Port Blair. Airport drop.' },
]
const CHID_DAYS: ItDay[] = [
  { day: 'Day 5', title: 'Chidiyatapu', desc: 'Drive to Chidiyatapu — bird sanctuary and Munda Pahar beach. Famous for the most beautiful sunsets in Andaman.' },
  { day: 'Day 6', title: 'Departure', desc: 'Breakfast, hotel check-out, airport drop.' },
]
const BARA_DAYS: ItDay[] = [
  { day: 'Day 6', title: 'Baratang Caves', desc: 'Early start — mangrove boat ride to Baratang. Limestone caves and mud volcanoes. Return to Port Blair.' },
  { day: 'Day 7', title: 'Departure', desc: 'Breakfast, hotel check-out, airport drop.' },
]
const NORTH_DAYS: ItDay[] = [
  { day: 'Day 7', title: 'North Andaman', desc: 'Drive north to Ross & Smith Islands (twin islands connected by sandbar), Kalipur beach, Saddle Peak forest.' },
  { day: 'Day 8', title: 'Departure', desc: 'Breakfast, hotel check-out, airport drop.' },
]
const ITINERARIES: ItDay[][] = [
  BASE_DAYS,
  [...BASE_DAYS.slice(0, 3), ...NEIL_DAYS],
  [...BASE_DAYS.slice(0, 3), ...NEIL_DAYS.slice(0, 1), ...CHID_DAYS],
  [...BASE_DAYS.slice(0, 3), ...NEIL_DAYS.slice(0, 1), ...CHID_DAYS.slice(0, 1), ...BARA_DAYS],
  [...BASE_DAYS.slice(0, 3), ...NEIL_DAYS.slice(0, 1), ...CHID_DAYS.slice(0, 1), ...BARA_DAYS.slice(0, 1), ...NORTH_DAYS],
]

const INCLUSIONS = ['Airport transfers', 'Private ferries', 'Breakfast daily', 'All sightseeing', 'Entry tickets', 'Ground support']

// ─── helpers ──────────────────────────────────────────────────────────────────

function getGroupDiscount(p: number): number {
  if (p === 1) return -0.15
  if (p <= 3) return 0
  if (p <= 5) return 0.05
  if (p <= 7) return 0.10
  return 0.15
}
function fmtINR(n: number) { return '₹' + n.toLocaleString('en-IN') }

// ─── icons ────────────────────────────────────────────────────────────────────

const CheckSVG = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0 }}>
    <circle cx="6.5" cy="6.5" r="6.5" fill="#1D9E75" />
    <path d="M3.5 6.5l2 2 3.5-3.5" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const ChevL = () => (
  <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
    <path d="M5.5 1.5L2.5 4.5l3 3" stroke="#1a1a1a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const ChevR = () => (
  <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
    <path d="M3.5 1.5l3 3-3 3" stroke="#1a1a1a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const WASvg = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="#1D9E75">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
)

// ─── main component ────────────────────────────────────────────────────────────

export default function AndamanPage({ trip }: { trip: TripRaw }) {
  const pricing: Pricing = JSON.parse(trip.pricing)
  const gallery: string[] = JSON.parse(trip.gallery)
  const faqs: { q: string; a: string }[] = JSON.parse(trip.faqs)
  const highlights: string[] = JSON.parse(trip.highlights)
  const included: string[] = JSON.parse(trip.included)
  const notIncluded: string[] = JSON.parse(trip.notIncluded)
  const { durations, tiers, promoCodes, promoDiscount } = pricing

  const [durIdx, setDurIdx] = useState(1)
  const [tierIdx, setTierIdx] = useState(1)
  const [people, setPeople] = useState(2)
  const [promoCode, setPromoCode] = useState('')
  const [promoApplied, setPromoApplied] = useState(false)
  const [promoError, setPromoError] = useState('')
  const [galleryIdx, setGalleryIdx] = useState(0)
  const [faqOpen, setFaqOpen] = useState<number | null>(null)
  const [itOpen, setItOpen] = useState<number | null>(0)

  const currentTier = tiers[tierIdx]
  // listPrice = regular price before promo (used as display base)
  const listPrice = currentTier.price[durIdx]
  // basePrice = price actually used for calculation (with promo if applied)
  const basePrice = promoApplied ? currentTier.promoPrice[durIdx] : listPrice
  const bufferPrice = currentTier.bufferPrice[durIdx]
  const discountPct = currentTier.discount[durIdx]
  const groupDiscount = getGroupDiscount(people)
  const finalPerPerson = Math.round(basePrice * (1 - groupDiscount))
  const finalTotal = finalPerPerson * people

  function applyPromo() {
    const code = promoCode.trim().toUpperCase()
    if (promoCodes.includes(code)) { setPromoApplied(true); setPromoError('') }
    else { setPromoError('Invalid promo code. Please check and try again.'); setPromoApplied(false) }
  }

  // CHANGE 5 — updated WA message
  const waMsg = encodeURIComponent(
    `Hi StayLocal! I want to book Andaman Islands.\nDuration: ${durations[durIdx].label}\nPackage: ${currentTier.name}\nPeople: ${people}\nTotal: ${fmtINR(finalTotal)}\nPromo: ${promoApplied ? promoCode.toUpperCase() : 'None'}`
  )

  const itinerary = ITINERARIES[durIdx] ?? ITINERARIES[0]

  // ── CHANGE 1+2+3: calculator sections (rendered once, placed via CSS grid) ──

  const calculatorBlock = (
    <div className="px-4 py-4 lg:px-0 lg:py-0 space-y-4">

      {/* Duration selector (unchanged from before) */}
      <div>
        <p className="text-[11px] font-bold text-[#888] uppercase tracking-widest mb-3">Choose duration</p>
        <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1">
          {durations.map((d, i) => {
            const active = i === durIdx
            return (
              <button key={i} onClick={() => setDurIdx(i)}
                className={`flex-shrink-0 w-[110px] rounded-2xl border-2 overflow-hidden text-left cursor-pointer p-0 transition-all ${active ? 'border-[#1D9E75] bg-[#E8F5F0]' : 'border-[#EAE8E4] bg-white'}`}>
                <div className="h-[68px] overflow-hidden relative">
                  <img src={d.image} alt={d.label} className="w-full h-full object-cover" />
                  {active && (
                    <div className="absolute top-1.5 right-1.5 w-[18px] h-[18px] rounded-full bg-[#1D9E75] flex items-center justify-center">
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <p className={`text-[13px] font-bold mb-0.5 ${active ? 'text-[#0d6b50]' : 'text-[#1a1a1a]'}`}>{d.label}</p>
                  <p className="text-[10px] text-[#AAA] leading-tight min-h-[24px]">{d.sub}</p>
                  <p className={`text-[11px] font-semibold mt-1 ${active ? 'text-[#1D9E75]' : 'text-[#1a1a1a]'}`}>
                    from {fmtINR(tiers[0].price[i])}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* CHANGE 1 — Tier horizontal scroll */}
      <div>
        <p className="text-[11px] font-bold text-[#888] uppercase tracking-widest mb-3">Choose your experience</p>
        <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1">
          {tiers.map((tier, i) => {
            const active = i === tierIdx
            const displayPrice = promoApplied ? tier.promoPrice[durIdx] : tier.price[durIdx]
            return (
              <button key={i} onClick={() => setTierIdx(i)}
                className={`flex-shrink-0 w-[200px] rounded-2xl border-2 p-4 cursor-pointer text-left transition-all ${active ? 'border-[#1D9E75] bg-[#E8F5F0]' : 'border-[#EAE8E4] bg-white'}`}>
                {/* Name + badges */}
                <div className="flex items-start justify-between gap-1 mb-1">
                  <span style={{ fontFamily: 'var(--font-playfair)' }} className="text-[16px] font-bold text-[#1a1a1a] leading-tight">{tier.name}</span>
                  <span className="bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5">{tier.discount[durIdx]}%</span>
                </div>
                {tier.popular && (
                  <span className="inline-block bg-[#1D9E75] text-white text-[9px] font-bold px-2 py-0.5 rounded-full mb-1.5">MOST POPULAR</span>
                )}
                <p className="text-[11px] text-[#888] mb-2 leading-tight">{tier.subtitle}</p>
                {/* Price */}
                <p className="text-[12px] text-[#CCC] line-through leading-none">{fmtINR(tier.bufferPrice[durIdx])}</p>
                <div className="flex items-baseline gap-1 mb-2">
                  <span style={{ fontFamily: 'var(--font-playfair)' }} className={`text-[22px] font-bold ${active ? 'text-[#1D9E75]' : 'text-[#1a1a1a]'}`}>{fmtINR(displayPrice)}</span>
                  <span className="text-[11px] text-[#AAA]">/person</span>
                </div>
                {/* Meals badge */}
                <span className="inline-block bg-[#FFF8E7] text-[#92400e] text-[10px] font-medium px-2.5 py-1 rounded-full mb-3">🍳 {tier.meals}</span>
                {/* First 3 features */}
                <div className="space-y-1.5">
                  {tier.features.slice(0, 3).map(f => (
                    <div key={f} className="flex items-center gap-1.5">
                      <CheckSVG size={11} />
                      <span className="text-[11px] text-[#444]">{f}</span>
                    </div>
                  ))}
                  {tier.features.length > 3 && (
                    <p className="text-[10px] text-[#1D9E75] font-medium">+{tier.features.length - 3} more</p>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* CHANGE 2 — Selected tier expanded detail */}
      <div className="bg-white border-2 border-[#1D9E75] rounded-2xl p-4">
        <p className="text-[10px] font-bold text-[#1D9E75] uppercase tracking-wider mb-3">Your selected package</p>
        {/* Hotels */}
        <div className="bg-[#F5F3F0] rounded-xl p-3 mb-3">
          <p className="text-[10px] font-bold text-[#888] uppercase tracking-wider mb-2">Your stays</p>
          {([['Port Blair', currentTier.hotels.portblair], ['Havelock', currentTier.hotels.havelock], ['Neil Island', currentTier.hotels.neil]] as [string, string][]).map(([loc, hotel]) => (
            <div key={loc} className="flex gap-2 mb-1.5">
              <span className="text-[10px] text-[#1D9E75] font-bold w-[70px] shrink-0">{loc}</span>
              <span className="text-[10px] text-[#666] leading-tight">{hotel}</span>
            </div>
          ))}
        </div>
        {/* All features */}
        <div className="space-y-1.5 mb-3">
          {currentTier.features.map(f => (
            <div key={f} className="flex items-center gap-2">
              <CheckSVG size={12} />
              <span className="text-[12px] text-[#1a1a1a]">{f}</span>
            </div>
          ))}
        </div>
        {/* Ferry + meals */}
        <div className="flex gap-2 flex-wrap">
          <span className="bg-[#E8F5F0] text-[#0d6b50] text-[10px] font-medium px-2.5 py-1 rounded-full">🚢 {currentTier.ferry}</span>
          <span className="bg-[#FFF8E7] text-[#92400e] text-[10px] font-medium px-2.5 py-1 rounded-full">🍳 {currentTier.meals}</span>
        </div>
      </div>

      {/* CHANGE 3 — People + Promo + Total in one card */}
      <div className="bg-white border border-[#EAE8E4] rounded-2xl p-5">

        {/* People */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-sm font-medium text-[#1a1a1a]">Number of people</p>
            <p className="text-xs text-[#AAA] mt-0.5">
              {groupDiscount > 0
                ? `${Math.round(groupDiscount * 100)}% group discount applied`
                : groupDiscount < 0
                ? '+15% solo surcharge'
                : 'Group discount for 4+ people'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setPeople(p => Math.max(1, p - 1))}
              className="w-9 h-9 rounded-full border border-[#EAE8E4] text-lg flex items-center justify-center bg-white cursor-pointer">−</button>
            <span className="text-xl font-medium w-6 text-center">{people}</span>
            <button onClick={() => setPeople(p => Math.min(12, p + 1))}
              className="w-9 h-9 rounded-full border border-[#EAE8E4] text-lg flex items-center justify-center bg-white cursor-pointer">+</button>
          </div>
        </div>

        <div className="border-t border-[#F0EDE8] mb-5" />

        {/* Promo code */}
        <div className="mb-5">
          <p className="text-sm font-medium text-[#1a1a1a] mb-2">Have a promo code?</p>
          <div className="flex gap-2">
            <input
              value={promoCode}
              onChange={e => setPromoCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && applyPromo()}
              placeholder="Enter code"
              className="flex-1 border border-[#EAE8E4] rounded-xl px-4 py-2.5 text-sm uppercase tracking-wider outline-none focus:border-[#1D9E75]"
            />
            <button onClick={applyPromo}
              className="bg-[#1D9E75] text-white px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer border-none">
              Apply
            </button>
          </div>
          {promoApplied && (
            <div className="mt-2 bg-[#E8F5F0] border border-[#1D9E75]/30 rounded-xl px-3 py-2 text-xs text-[#0d6b50] font-medium">
              ✓ Promo applied — ₹2,000 off per person
            </div>
          )}
          {promoError && (
            <div className="mt-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs text-red-600">
              {promoError}
            </div>
          )}
        </div>

        <div className="border-t border-[#F0EDE8] mb-4" />

        {/* Price breakdown */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm text-[#888]">
            <span>{durations[durIdx].label} · {currentTier.name}</span>
            <span>{fmtINR(listPrice)} × {people}</span>
          </div>
          {promoApplied && (
            <div className="flex justify-between text-sm text-[#1D9E75]">
              <span>Promo discount</span>
              <span>−{fmtINR(promoDiscount * people)}</span>
            </div>
          )}
          {groupDiscount > 0 && (
            <div className="flex justify-between text-sm text-[#1D9E75]">
              <span>Group discount ({Math.round(groupDiscount * 100)}% off)</span>
              <span>−{fmtINR(Math.round(basePrice * groupDiscount * people))}</span>
            </div>
          )}
          {groupDiscount < 0 && (
            <div className="flex justify-between text-sm text-red-500">
              <span>Solo surcharge (+15%)</span>
              <span>+{fmtINR(Math.round(basePrice * Math.abs(groupDiscount) * people))}</span>
            </div>
          )}
        </div>

        {/* Total */}
        <div className="bg-[#F8F6F3] rounded-xl p-4 flex justify-between items-center">
          <div>
            <p className="text-[10px] text-[#AAA] uppercase tracking-wider">Total estimate</p>
            <p className="text-xs text-[#888] mt-0.5">{fmtINR(finalPerPerson)} per person</p>
          </div>
          <p style={{ fontFamily: 'var(--font-playfair)' }} className="text-3xl font-medium text-[#1a1a1a]">
            {fmtINR(finalTotal)}
          </p>
        </div>
      </div>

      {/* WhatsApp CTA */}
      <div className="bg-[#1D9E75] rounded-2xl p-5">
        <p style={{ fontFamily: 'var(--font-playfair)' }} className="text-[20px] font-bold text-white mb-1.5">Ready to book? Chat with us</p>
        <p className="text-[12px] text-white/75 mb-4 leading-relaxed">
          We&apos;ll confirm availability and send booking details within 2 hours
        </p>
        <div className="flex flex-col gap-2.5">
          <a href={`https://wa.me/919999999999?text=${waMsg}`} target="_blank" rel="noopener noreferrer"
            className="bg-white text-[#1D9E75] py-3 rounded-full font-bold text-[15px] text-center flex items-center justify-center gap-2 no-underline">
            <WASvg />
            WhatsApp us now
          </a>
          <EnquirySubmit trip={trip} durLabel={durations[durIdx].label} tierName={currentTier.name} people={people} total={finalTotal} />
        </div>
      </div>
    </div>
  )

  // ── RENDER ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* CHANGE 4 — 3-block CSS Grid: stacks on mobile, 2-col on desktop */}
      <div className="max-w-6xl mx-auto lg:grid lg:grid-cols-[1fr_440px] lg:gap-8 lg:px-8 lg:py-8 lg:items-start">

        {/* ── BLOCK 1: Hero + Pills + Trust (col-1 row-1 on desktop) ── */}
        <div className="lg:col-start-1 lg:row-start-1">

          {/* Hero */}
          <div className="relative overflow-hidden lg:rounded-2xl" style={{ height: 280 }}>
            {gallery[galleryIdx] && (
              <img src={gallery[galleryIdx]} alt={trip.title} className="w-full h-full object-cover block" />
            )}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 55%)' }} />
            {gallery.length > 1 && (
              <>
                <button onClick={() => setGalleryIdx(i => (i - 1 + gallery.length) % gallery.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/85 border-none cursor-pointer flex items-center justify-center"
                  style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }}><ChevL /></button>
                <button onClick={() => setGalleryIdx(i => (i + 1) % gallery.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/85 border-none cursor-pointer flex items-center justify-center"
                  style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }}><ChevR /></button>
              </>
            )}
            <div className="absolute bottom-14 left-0 right-0 flex justify-center gap-1.5">
              {gallery.map((_, i) => (
                <div key={i} onClick={() => setGalleryIdx(i)} style={{ width: i === galleryIdx ? 16 : 5, height: 5, borderRadius: 999, background: i === galleryIdx ? '#fff' : 'rgba(255,255,255,0.45)', cursor: 'pointer', transition: 'width 0.2s' }} />
              ))}
            </div>
            <div className="absolute bottom-5 left-5 text-white">
              <span className="text-[10px] bg-[#1D9E75] px-2.5 py-0.5 rounded-full font-semibold mb-1.5 inline-block">{trip.category}</span>
              <h1 style={{ fontFamily: 'var(--font-playfair)' }} className="text-[26px] font-bold leading-tight mb-1">{trip.title}</h1>
              <p className="text-[13px] opacity-85">📍 {trip.location}</p>
              <p className="text-[12px] opacity-60 mt-0.5">{trip.route}</p>
            </div>
          </div>

          {/* Inclusion pills */}
          <div className="flex gap-2 overflow-x-auto hide-scrollbar px-4 py-3 bg-white border-b border-[#EAE8E4]">
            {INCLUSIONS.map(item => (
              <div key={item} className="flex items-center gap-1.5 bg-[#E8F5F0] border border-[#1D9E75]/20 rounded-full px-3 py-1.5 flex-shrink-0">
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <circle cx="5.5" cy="5.5" r="5.5" fill="#1D9E75" />
                  <path d="M3 5.5l1.5 1.5 3-3" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-[10px] text-[#0d6b50] font-medium whitespace-nowrap">{item}</span>
              </div>
            ))}
          </div>

          {/* Trust strip */}
          <div className="grid grid-cols-3 bg-white border-b border-[#EAE8E4]">
            {([['50+', 'Happy groups'], ['9+', 'Years experience'], ['Private', 'AC ferries']] as [string, string][]).map(([big, small], i) => (
              <div key={i} className={`py-3.5 text-center ${i < 2 ? 'border-r border-[#EAE8E4]' : ''}`}>
                <p style={{ fontFamily: 'var(--font-playfair)' }} className="text-[18px] font-bold text-[#1a1a1a]">{big}</p>
                <p className="text-[10px] text-[#888] mt-0.5">{small}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── BLOCK 2: Calculator (col-2 row-1+2 sticky on desktop; after trust on mobile) ── */}
        <div className="lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:sticky lg:top-8 lg:self-start">
          {calculatorBlock}
        </div>

        {/* ── BLOCK 3: Content sections (col-1 row-2 on desktop; after calculator on mobile) ── */}
        <div className="lg:col-start-1 lg:row-start-2">
          <div className="px-4 pt-4 pb-8 lg:px-0 space-y-6">

            {/* Hotels */}
            <div>
              <p style={{ fontFamily: 'var(--font-playfair)' }} className="text-[18px] font-bold mb-3">Your handpicked stays</p>
              <div className="flex gap-2.5 overflow-x-auto hide-scrollbar">
                {([
                  { loc: 'Port Blair', hotel: currentTier.hotels.portblair, bg: '#1a3a2a' },
                  { loc: 'Havelock Island', hotel: currentTier.hotels.havelock, bg: '#0d3d4a' },
                  { loc: 'Neil Island', hotel: currentTier.hotels.neil, bg: '#2a1a3a' },
                ] as { loc: string; hotel: string; bg: string }[]).map(({ loc, hotel, bg }) => (
                  <div key={loc} className="flex-shrink-0 w-[160px] rounded-2xl overflow-hidden" style={{ background: bg }}>
                    <div className="p-4 min-h-[100px]">
                      <p className="text-[10px] text-white/60 font-bold uppercase tracking-wider mb-1.5">{loc}</p>
                      <p className="text-[12px] text-white font-semibold leading-snug">{hotel}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Highlights */}
            {highlights.length > 0 && (
              <div>
                <p style={{ fontFamily: 'var(--font-playfair)' }} className="text-[18px] font-bold mb-3">Why this trip?</p>
                <div className="flex flex-wrap gap-2">
                  {highlights.map((h, i) => (
                    <span key={i} className="bg-[#E8F5F0] text-[#1D9E75] px-3 py-1.5 rounded-full text-[12px] font-medium">✦ {h}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Included / Not included */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white border border-[#EAE8E4] rounded-2xl p-4">
                <p className="text-[13px] font-bold text-[#1D9E75] mb-2.5">✓ Included</p>
                {included.map((item, i) => <p key={i} className="text-[11px] text-[#666] mb-1.5">• {item}</p>)}
              </div>
              <div className="bg-white border border-[#EAE8E4] rounded-2xl p-4">
                <p className="text-[13px] font-bold text-[#888] mb-2.5">✕ Not included</p>
                {notIncluded.map((item, i) => <p key={i} className="text-[11px] text-[#666] mb-1.5">• {item}</p>)}
              </div>
            </div>

            {/* Itinerary */}
            <div>
              <p style={{ fontFamily: 'var(--font-playfair)' }} className="text-[18px] font-bold mb-3">Day by day</p>
              {itinerary.map((d, i) => (
                <div key={i} className="border border-[#EAE8E4] rounded-xl mb-2 overflow-hidden">
                  <button onClick={() => setItOpen(itOpen === i ? null : i)}
                    className={`w-full border-none px-4 py-3 text-left cursor-pointer flex justify-between items-center ${itOpen === i ? 'bg-gray-50' : 'bg-white'}`}>
                    <div className="flex items-center gap-3">
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: itOpen === i ? '#1D9E75' : '#E8F5F0', color: itOpen === i ? '#fff' : '#1D9E75', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                        {i + 1}
                      </div>
                      <div>
                        <p className="text-[10px] text-[#BBB] mb-0.5">{d.day}</p>
                        <p className="text-[13px] font-semibold text-[#1a1a1a]">{d.title}</p>
                      </div>
                    </div>
                    <span className="text-[18px] text-[#1D9E75] leading-none flex-shrink-0">{itOpen === i ? '−' : '+'}</span>
                  </button>
                  {itOpen === i && (
                    <div className="px-4 pb-3 text-[13px] text-[#666] leading-relaxed" style={{ paddingLeft: 56 }}>{d.desc}</div>
                  )}
                </div>
              ))}
            </div>

            {/* Gallery */}
            <div>
              <p style={{ fontFamily: 'var(--font-playfair)' }} className="text-[18px] font-bold mb-3">Glimpses of Andaman</p>
              <div className="flex gap-2.5 overflow-x-auto hide-scrollbar">
                {gallery.map((img, i) => (
                  <img key={i} src={img} alt="" className="flex-shrink-0 rounded-xl object-cover" style={{ width: 200, height: 140 }} />
                ))}
              </div>
            </div>

            {/* FAQ */}
            <div>
              <p style={{ fontFamily: 'var(--font-playfair)' }} className="text-[18px] font-bold mb-3">Common questions</p>
              {faqs.map((faq, i) => (
                <div key={i} className="border border-[#EAE8E4] rounded-xl mb-2 overflow-hidden">
                  <button onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                    className="w-full bg-white border-none px-4 py-3.5 text-left cursor-pointer flex justify-between items-center text-[13px] font-semibold text-[#1a1a1a]">
                    {faq.q}
                    <span className="text-[18px] text-[#1D9E75] flex-shrink-0 ml-2">{faqOpen === i ? '−' : '+'}</span>
                  </button>
                  {faqOpen === i && (
                    <div className="px-4 pb-3.5 text-[13px] text-[#666] leading-relaxed">{faq.a}</div>
                  )}
                </div>
              ))}
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}

// ─── enquiry submit ────────────────────────────────────────────────────────────

function EnquirySubmit({ trip, durLabel, tierName, people, total }: { trip: TripRaw; durLabel: string; tierName: string; people: number; total: number }) {
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  async function submit() {
    setLoading(true)
    await fetch('/api/bookings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Enquiry', phone: 'via form', tripSlug: trip.slug, people, message: `${durLabel} · ${tierName} · Total ${fmtINR(total)}` })
    })
    setLoading(false); setSent(true)
  }
  if (sent) return <div className="border border-white/50 text-white rounded-full py-3 text-center text-[14px] font-semibold">✓ Enquiry sent!</div>
  return (
    <button onClick={submit} disabled={loading}
      className="bg-transparent border border-white/50 text-white rounded-full py-3 text-[14px] font-semibold cursor-pointer w-full"
      style={{ opacity: loading ? 0.7 : 1 }}>
      {loading ? 'Sending...' : 'Submit enquiry'}
    </button>
  )
}
