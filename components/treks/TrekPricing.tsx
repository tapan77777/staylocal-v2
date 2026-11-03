import Link from 'next/link'
import { confirmedOptionPrice, departureIsEnquirable, type TrekRecord, type PublicTrekOption } from '@/lib/treks/schema'
import { formatInr } from '@/lib/pricing'
import s from './Treks.module.css'
export function detailOptions(trek: TrekRecord): PublicTrekOption[] {
  return trek.options?.length ? trek.options : trek.content.pricingOptions.map(o => ({ ...o, packageId: 0, departures: trek.departures.filter(d => o.departureKeys.includes(d.key)) }))
}
export default function TrekPricing({ trek, preview }: { trek: TrekRecord; preview: boolean }) {
  const options = detailOptions(trek)
  return <div className={s.optionGrid}>{options.map(option => {
    const price = confirmedOptionPrice(option, trek.content.enquiryOnly)
    return <article key={option.key} className={s.optionCard}><p className={s.eyebrow}>{option.status === 'draft' ? 'Draft option · review required' : 'Your way to the trail'}</p><h3>{option.label}</h3><p className={s.prose}>{option.description}</p><strong className={s.optionPrice}>{price === null ? 'Enquire for pricing' : formatInr(price)}{price !== null && <small> / person</small>}</strong><p className={s.caption}>Pickup {option.pickup || 'to confirm'} · Drop {option.drop || 'to confirm'}</p><details><summary>What this option includes</summary><ul>{option.inclusions.map((v, i) => <li key={i}>{v}</li>)}</ul><p>Not included</p><ul>{option.exclusions.map((v, i) => <li key={i}>{v}</li>)}</ul></details>{!trek.content.enquiryOnly && option.departures.length > 0 ? <ul className={s.optionDates}>{option.departures.map(d => <li key={d.key}><span>{d.startDate} → {d.endDate}</span><small>{d.status} · operator maintained</small>{departureIsEnquirable(d) && !preview && <Link href={`?option=${encodeURIComponent(option.key)}&departure=${encodeURIComponent(d.id || '')}#trek-enquiry`}>Discuss this departure ↗</Link>}</li>)}</ul> : <p className={s.caption}>No confirmed departure is advertised. Ask us about your preferred dates.</p>}<a className={s.textLink} href={preview ? '#trek-enquiry' : `?option=${encodeURIComponent(option.key)}#trek-enquiry`}>{preview ? 'View enquiry preview' : 'Enquire about this option'} ↗</a></article>
  })}</div>
}
