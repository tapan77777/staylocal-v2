import Link from 'next/link'
import type { TrekRecord } from '@/lib/treks/schema'
import { routeIsVerified } from '@/lib/treks/schema'
import { formatInr } from '@/lib/pricing'
import TrekPhoto from './TrekPhoto'
import s from './Treks.module.css'
export default function TrekCard({ trek }: { trek: TrekRecord }) {
  const c = trek.content
  return <article className={s.trekCard}>
    <Link href={`/treks/${trek.slug}`} className={s.cardPhoto} tabIndex={-1} aria-hidden="true"><TrekPhoto photo={c.hero} sizes="(max-width: 600px) 400px, 480px" /></Link>
    <div className={s.cardCopy}><p className={s.eyebrow}>{trek.destination || c.region}{c.fixture ? ' · UI fixture' : ''}</p><h2><Link href={`/treks/${trek.slug}`}>{trek.title}</Link></h2>
      <p className={s.cardFacts}>{c.difficulty || 'Difficulty pending'} <span>·</span> {c.durationDays} {c.durationDays === 1 ? 'day' : 'days'} <span>·</span> {(routeIsVerified(c) || c.provisional) && c.maxAltitudeM !== null ? `${c.maxAltitudeM.toLocaleString('en-IN')} m${!routeIsVerified(c) ? ' · provisional' : ''}` : 'Altitude to be confirmed'}</p>
      <p className={s.cardFacts}>Basecamp · {c.basecamp || 'To be confirmed'}</p><p className={s.cardSummary}>{trek.summary}</p><div className={s.cardBottom}>{c.enquiryOnly || trek.startingPrice === null ? <p><strong>Enquire for pricing</strong></p> : <p><small>Starting from</small><strong>{formatInr(trek.startingPrice!)}</strong><small>per person</small></p>}<Link href={`/treks/${trek.slug}`} className={s.detailsLink}>View trek <span aria-hidden>↗</span></Link></div>
    </div>
  </article>
}
