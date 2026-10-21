'use client'
import { useEffect, useState } from 'react'
import BookingModal from '@/components/BookingModal'
import { waLink } from '@/lib/config'
const formatInr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
import { eligibleOffers, parseList, quoteOffer, type UniversalConfig, type UniversalTripData } from '@/lib/universal-trip'
import s from './UniversalTrip.module.css'

type Quote = ReturnType<typeof quoteOffer>
export interface UniversalTripProps { trip: UniversalTripData; config: UniversalConfig; initialQuotes: Record<string, Quote>; preview?: boolean }
export default function UniversalTrip({ trip, config, initialQuotes, preview = false }: UniversalTripProps) {
  const available = eligibleOffers(config, trip.packages)
  const first = available.find(a => a.pkg.slug === config.defaultPackageSlug) ?? available[0]
  const [selection, setSelection] = useState(first?.offer.packageSlug ?? '')
  const [people, setPeople] = useState(Math.min(2, config.maxPeople))
  const [peopleText, setPeopleText] = useState(String(Math.min(2, config.maxPeople)))
  const validPeople = peopleText !== '' && Number.isInteger(Number(peopleText)) && Number(peopleText) >= 1 && Number(peopleText) <= config.maxPeople
  const [quote, setQuote] = useState<Quote | null>(initialQuotes[selection] ?? null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [promoInput, setPromoInput] = useState('')
  const [promoCode, setPromoCode] = useState('')
  const [modal, setModal] = useState(false)
  const current = available.find(a => a.offer.packageSlug === selection) ?? first
  useEffect(() => {
    if (!current) return
    const controller = new AbortController()
    setBusy(true); setError(''); setQuote(null)
    if (preview) {
      try { setQuote(quoteOffer(config, trip.packages, current.pkg.slug, people, promoCode)) } catch (e) { setError((e as Error).message) }
      setBusy(false); return
    }
    void fetch(`/api/trips/${encodeURIComponent(trip.slug)}/quote`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ packageSlug: current.pkg.slug, people, promoCode }), signal: controller.signal })
      .then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Could not refresh estimate.'); return data as Quote })
      .then(data => { if (!controller.signal.aborted) setQuote(data) })
      .catch(e => { if (!controller.signal.aborted) setError(e.message) })
      .finally(() => { if (!controller.signal.aborted) setBusy(false) })
    return () => controller.abort()
  }, [selection, people, promoCode, preview, config, trip.packages, trip.slug])
  if (!current) return <main className={s.page}><div className={s.card}><h1>{trip.title}</h1><p>No published offers are available.</p></div></main>
  const tier = config.tiers.find(t => t.id === current.offer.tierId)
  const duration = config.durations.find(d => d.id === current.offer.durationId)
  const selectedInclusions = parseList<string>(current.pkg.inclusions)
  const selectedExclusions = parseList<string>(current.pkg.exclusions)
  const message = `Hi StayLocal! I'm interested in ${trip.title}.\nPackage: ${current.pkg.label}\nTravellers: ${people}\n${quote?.total != null ? `Estimated total: ${formatInr(quote.total)}` : 'Please send a confirmed quote.'}${promoCode ? `\nPromo: ${promoCode}` : ''}`
  return <main className={`${s.page} ${preview ? s.previewMode : ''}`}>
    {preview && <p className={s.previewLabel}>Local design preview · migration not activated · enquiry actions disabled</p>}
    <div className={s.grid}>
      <div><TripGallery trip={trip} /><div className={s.pills}>{parseList<string>(trip.included).slice(0, 6).map((item, i) => <span key={i} className={s.pill}>✓ {item}</span>)}</div></div>
      <aside className={s.calculator} aria-label="Build your trip">
        <section><p className={s.eyebrow}>Choose duration</p><div className={s.scroll}>{config.durations.filter(d => available.some(a => a.offer.durationId === d.id)).map(d => {
          const options = available.filter(a => a.offer.durationId === d.id)
          const prices = options.map(a => initialQuotes[a.pkg.slug]?.selling).filter((n): n is number => n != null)
          return <button key={d.id} aria-pressed={d.id === duration?.id} className={`${s.duration} ${d.id === duration?.id ? s.selected : ''}`} onClick={() => setSelection((options.find(a => a.offer.tierId === current.offer.tierId) ?? options[0]).pkg.slug)}>
            {(d.image || trip.image) && <img src={d.image || trip.image} alt="" />}<div><strong>{d.label}</strong><small>{d.sub}</small><p>{prices.length ? `from ${formatInr(Math.min(...prices))}` : 'Price on request'}</p></div>
          </button>
        })}</div></section>
        <section><p className={s.eyebrow}>{config.tiers.length ? 'Choose your experience' : 'Your package'}</p><div className={s.scroll}>{available.filter(a => a.offer.durationId === current.offer.durationId).map(({ pkg, offer }) => {
          const t = config.tiers.find(t => t.id === offer.tierId)
          const price = initialQuotes[pkg.slug]
          return <button key={pkg.slug} aria-pressed={pkg.slug === selection} className={`${s.tier} ${pkg.slug === selection ? s.selected : ''}`} onClick={() => setSelection(pkg.slug)}>
            <div className={s.tierHeader}><h3>{t?.name ?? pkg.label}</h3>{price?.discount != null && <span className={s.discount}>{price.discount}% off</span>}</div>
            {t?.popular && <span className={s.badge}>MOST POPULAR</span>}<small>{t?.subtitle}</small>
            {price?.comparisonPrice != null && <del className={s.original}>{formatInr(price.comparisonPrice)}</del>}
            <span className={s.price}>{price?.selling != null ? formatInr(price.selling) : 'Price on request'}</span><small>{pkg.priceOnRequest ? '' : '/ person'}</small>
            {t?.meals && <p className={s.pill}>{t.meals}</p>}<ul className={s.features}>{t?.features.slice(0, 3).map((f, i) => <li key={i}>{f}</li>)}</ul>
          </button>
        })}</div></section>
        <div className={`${s.card} ${s.selectedCard}`}><p className={s.eyebrow}>Your selected package</p>
          {current.offer.stays.length > 0 && <div className={s.stays}><p className={s.eyebrow}>Your stays</p>{current.offer.stays.map((stay, i) => <p key={i}><strong>{stay.location}</strong>{stay.name}</p>)}</div>}
          {current.pkg.accommodation && <p className={s.muted}>{current.pkg.accommodation}</p>}<ul className={s.features}>{tier?.features.map((f, i) => <li key={i}>{f}</li>)}</ul>
          {tier?.transport && <span className={s.pill}>{tier.transport}</span>} {tier?.meals && <span className={s.pill}>{tier.meals}</span>}
        </div>
        <div className={s.card}>
          <label className={s.people}><span>Number of people<br /><small className={s.muted}>Up to {config.maxPeople} travellers</small></span><input aria-label="Number of people" type="number" min={1} max={config.maxPeople} value={peopleText} onBlur={() => setPeopleText(String(people))} onChange={e => { const raw = e.target.value; setPeopleText(raw); const n = Number(raw); if (raw && Number.isInteger(n) && n >= 1 && n <= config.maxPeople) setPeople(n) }} /></label>
          {current.offer.promo && <div className={s.promo}><input aria-label="Promo code" value={promoInput} onChange={e => setPromoInput(e.target.value)} placeholder="Promo code" /><button onClick={() => setPromoCode(promoInput.trim())}>Apply</button></div>}
          <p className={s.muted}>{duration?.label} · {tier?.name ?? current.pkg.label}</p>
          {quote && quote.adjustmentBps !== 0 && <p className={s.muted}>{Math.abs(quote.adjustmentBps) / 100}% {quote.adjustmentBps > 0 ? 'surcharge' : 'group reduction'} applied</p>}
          {quote?.promoApplied && <p className={s.muted}>Promo price applied</p>}
          <div className={s.total} aria-live="polite"><span><small>Total estimate</small><br /><small className={s.muted}>{quote?.perPerson != null ? `${formatInr(quote.perPerson)} per person` : 'Final quote confirmed before booking'}</small></span><strong>{busy ? 'Updating…' : quote?.total != null ? formatInr(quote.total) : 'On request'}</strong></div>
          {error && <p role="alert" className={s.error}>{error}</p>}
        </div>
        <div className={s.cta}><h2 className={s.heading}>Ready to book? Chat with us</h2><p style={{ fontSize: 12 }}>Availability and final quote confirmed before booking.</p>
          {!preview && quote && !busy && validPeople && <a href={waLink(message)} target="_blank" rel="noopener noreferrer">WhatsApp us now</a>}
          <button disabled={preview || busy || !quote || !validPeople} onClick={() => setModal(true)}>Submit enquiry</button>
        </div>
      </aside>
      <TripContent trip={trip} stays={current.offer.stays} itinerary={current.pkg.itinerary} included={selectedInclusions.length ? selectedInclusions : parseList<string>(trip.included)} excluded={selectedExclusions.length ? selectedExclusions : parseList<string>(trip.notIncluded)} notes={current.pkg.notes} />
    </div>
    {!preview && <div className={s.sticky}><span><small>Total estimate</small><br /><strong>{!validPeople ? 'Choose travellers' : busy ? 'Updating…' : quote?.total != null ? formatInr(quote.total) : 'Price on request'}</strong></span><button disabled={busy || !quote || !validPeople} onClick={() => setModal(true)}>Enquire</button></div>}
    {modal && quote && <BookingModal tripSlug={trip.slug} tripTitle={trip.title} packageId={current.pkg.id} packageLabel={current.pkg.label} estimatedPrice={quote.total} initialPeople={people} priceOnRequest={current.pkg.priceOnRequest} universalSelection={{ packageSlug: current.pkg.slug, promoCode }} onClose={() => setModal(false)} />}
  </main>
}
function TripGallery({ trip }: { trip: UniversalTripData }) {
  const images = [...new Set([trip.image, ...parseList<string>(trip.gallery)].filter(Boolean))]
  const [index, setIndex] = useState(0)
  return <div className={s.hero}>{images[index] && <img src={images[index]} alt={trip.title} />}<div className={s.shade} />{images.length > 1 && <><button aria-label="Previous photo" className={`${s.arrow} ${s.previous}`} onClick={() => setIndex((index - 1 + images.length) % images.length)}>‹</button><button aria-label="Next photo" className={`${s.arrow} ${s.next}`} onClick={() => setIndex((index + 1) % images.length)}>›</button></>}<div className={s.heroText}><span className={s.badge}>{trip.category}</span><h1>{trip.title}</h1><p>📍 {trip.location}</p><p>{trip.route}</p></div></div>
}
function TripContent({ trip, stays, itinerary, included, excluded, notes }: { trip: UniversalTripData; stays: UniversalConfig['offers'][number]['stays']; itinerary: string; included: string[]; excluded: string[]; notes: string }) {
  return <div className={s.content}>
    {stays.length > 0 && <section><h2 className={s.heading}>Your handpicked stays</h2><div className={s.scroll}>{stays.map((stay, i) => <article key={i} className={s.stayCard}>{stay.image && <img src={stay.image} alt={stay.name} />}<div><small>{stay.location}</small><strong>{stay.name}</strong></div></article>)}</div></section>}
    {parseList<string>(trip.highlights).length > 0 && <section><h2 className={s.heading}>Why this trip?</h2><div className={s.pills}>{parseList<string>(trip.highlights).map((h, i) => <span key={i} className={s.pill}>✦ {h}</span>)}</div></section>}
    <div className={s.lists}>{[["✓ Included", included], ["Not included", excluded]].map(([title, items], i) => <section className={s.card} key={i}><h2 style={{ color: i ? '#888' : '#1d9e75', fontSize: 13 }}>{title as string}</h2>{(items as string[]).map((text, j) => <p key={j}>• {text}</p>)}</section>)}</div>
    <section><h2 className={s.heading}>Day by day</h2>{parseList<{ day: string; title: string; desc: string }>(itinerary).map((d, i) => <details className={s.accordion} key={i} open={i === 0}><summary>{d.day} · {d.title}</summary><p>{d.desc}</p></details>)}{!parseList(itinerary).length && <p className={s.muted}>The day-wise itinerary has not been supplied.</p>}</section>
    {notes && <p className={s.muted}>{notes}</p>}
    <section><h2 className={s.heading}>Glimpses of {trip.title}</h2><div className={s.scroll}>{parseList<string>(trip.gallery).map((img, i) => <img key={i} className={s.galleryImage} src={img} alt={`${trip.title} view ${i + 1}`} />)}</div></section>
    {parseList<{ q: string; a: string }>(trip.faqs).length > 0 && <section><h2 className={s.heading}>Common questions</h2>{parseList<{ q: string; a: string }>(trip.faqs).map((f, i) => <details className={s.accordion} key={i}><summary>{f.q}</summary><p>{f.a}</p></details>)}</section>}
  </div>
}
