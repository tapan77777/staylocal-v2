'use client'
import { useState } from 'react'
import type { TrekRecord } from '@/lib/treks/schema'
import { departureIsEnquirable } from '@/lib/treks/schema'
import { calculatePackageTotal, formatInr } from '@/lib/pricing'
import { waLink } from '@/lib/config'
import s from './Treks.module.css'
export default function TrekEnquiryForm({ trek, initialDeparture = '', preview = false }: { trek: TrekRecord; initialDeparture?: string; preview?: boolean }) {
  const available = trek.departures.filter(departureIsEnquirable)
  const [departureId, setDepartureId] = useState(available.some(d => d.id === initialDeparture) ? initialDeparture : '')
  const [peopleText, setPeopleText] = useState('2')
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [done, setDone] = useState(false)
  const departure = available.find(d => d.id === departureId)
  const price = departure?.priceAdult ?? trek.basePrice ?? trek.startingPrice
  const people = Number(peopleText)
  const validPeople = Number.isInteger(people) && people >= 1 && people <= Math.min(50, departure?.capacity ?? 50)
  const total = price !== null && validPeople ? calculatePackageTotal(price, people) : null
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (preview || !validPeople) return
    const fields = new FormData(event.currentTarget)
    setBusy(true); setError('')
    try {
      const response = await fetch('/api/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: fields.get('name'), phone: fields.get('phone'), email: fields.get('email'), message: fields.get('message'), people, tripSlug: trek.slug, packageId: trek.packageId, ...(departureId ? { trekDepartureId: departureId } : {}) }) })
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.error || 'Your enquiry could not be saved.')
      setDone(true)
    } catch (e) { setError(e instanceof Error ? e.message : 'Please try again or WhatsApp us.') }
    finally { setBusy(false) }
  }
  if (trek.content.enquiryOnly) return <section id="trek-enquiry" className={s.enquiryBox} aria-labelledby="trek-enquiry-heading"><h2 id="trek-enquiry-heading">Enquire for dates &amp; pricing</h2><p className={s.caption}>Contact StayLocal to discuss dates, arrangements and pricing. No departure or price is confirmed by this page.</p>{preview || trek.content.fixture ? <button type="button" className={s.primary} disabled>Enquiries disabled in preview</button> : <a className={s.primary} href={waLink(`Hi StayLocal! I'd like to enquire about dates and pricing for ${trek.title}.`)} target="_blank" rel="noopener noreferrer">Enquire on WhatsApp ↗</a>}</section>
  return <section id="trek-enquiry" className={s.enquiryBox} aria-labelledby="trek-enquiry-heading"><p className={s.eyebrow}>{trek.content.fixture ? 'Local fixture test' : 'A real person, a clear plan'}</p><h2 id="trek-enquiry-heading">{done ? 'Enquiry received.' : 'Let’s talk about your trek.'}</h2>
    {done ? <div role="status"><p className={s.prose}>We’ll confirm the date, arrangements and final quote before anything is booked.</p><a className={s.textLink} href={waLink(`Hi StayLocal! I have enquired about ${trek.title}.`)} target="_blank" rel="noopener noreferrer">Continue on WhatsApp ↗</a></div> : <form onSubmit={submit}>
      <p className={s.price}>{price === null ? 'Price on request' : formatInr(price)} <small>{price === null ? '' : '/ person'}</small></p>
      <label>Departure<select name="departure" value={departureId} onChange={e => setDepartureId(e.target.value)}><option value="">Discuss custom dates</option>{available.map(d => <option key={d.id} value={d.id}>{d.startDate} → {d.endDate} · Confirmed</option>)}</select></label>
      <label>Travellers<input name="people" type="number" inputMode="numeric" min={1} max={Math.min(50, departure?.capacity ?? 50)} value={peopleText} onChange={e => setPeopleText(e.target.value)} required /></label>
      <p className={s.estimate} aria-live="polite"><span>Group estimate</span><strong>{total === null ? 'Confirm with us' : formatInr(total)}</strong></p>
      <p className={s.caption}>An enquiry, not a booking. Dates, taxes, transport and final arrangements are confirmed personally. No seats are reserved by this form.</p>
      <label>Your name<input name="name" autoComplete="name" minLength={2} maxLength={120} required /></label><label>Phone / WhatsApp<input name="phone" type="tel" autoComplete="tel" required /></label><label>Email (optional)<input name="email" type="email" autoComplete="email" /></label><label>Anything we should know?<textarea name="message" rows={3} maxLength={2000} placeholder="Preferred dates, experience, or questions…" /></label>
      {error && <p role="alert" className={s.error}>{error}</p>}<button type="submit" className={s.primary} disabled={busy || preview || !validPeople}>{preview ? 'Enquiries disabled in preview' : busy ? 'Sending…' : trek.content.fixture ? 'Send test enquiry' : 'Send enquiry'}</button>
      {!preview && <a className={s.whatsapp} href={waLink(`Hi StayLocal! I'd like to discuss ${trek.title}.`)} target="_blank" rel="noopener noreferrer">Or talk to us on WhatsApp ↗</a>}
      <p className={s.caption}>By submitting you agree to our <a href="/privacy">Privacy Policy</a>.</p>
    </form>}
  </section>
}
