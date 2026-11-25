import Link from 'next/link'
import type { TrekRecord } from '@/lib/treks/schema'
import { routeIsVerified } from '@/lib/treks/schema'
import { formatInr } from '@/lib/pricing'
import TrekPhoto from './TrekPhoto'
import s from './Treks.module.css'

export default function TrekCard({ trek }: { trek: TrekRecord }) {
  const c = trek.content

  // Difficulty color classes (using inline style — avoids adding extra CSS)
  const difficultyColor: Record<string, string> = {
    Easy: '#2d8a4e',
    Moderate: '#c47f1a',
    Difficult: '#c45c1a',
    Challenging: '#b83232',
  }
  const badgeColor = c.difficulty ? (difficultyColor[c.difficulty] ?? '#52654a') : '#52654a'

  return (
    <article className={s.trekCard}>
      {/* Card image */}
      <Link href={`/treks/${trek.slug}`} className={s.cardPhoto} tabIndex={-1} aria-hidden="true">
        <TrekPhoto
          photo={c.hero}
          sizes="(max-width: 600px) 400px, 480px"
          cardImg
        />
      </Link>

      {/* Card copy */}
      <div className={s.cardCopy}>
        {/* Region / destination eyebrow */}
        <p className={s.eyebrow}>
          {trek.destination || c.region}
          {c.fixture ? ' · UI fixture' : ''}
        </p>

        {/* Title */}
        <h2>
          <Link href={`/treks/${trek.slug}`}>{trek.title}</Link>
        </h2>

        {/* Key facts row */}
        <p className={s.cardFacts}>
          {/* Difficulty badge */}
          <span
            style={{
              display: 'inline-block',
              padding: '2px 9px',
              background: `${badgeColor}18`,
              color: badgeColor,
              borderRadius: 999,
              fontWeight: 700,
              fontSize: 10,
              letterSpacing: '0.04em',
              marginRight: 6,
            }}
          >
            {c.difficulty || 'Difficulty pending'}
          </span>
          {c.durationDays} {c.durationDays === 1 ? 'day' : 'days'}
          <span> · </span>
          {(routeIsVerified(c) || c.provisional) && c.maxAltitudeM !== null
            ? `${c.maxAltitudeM.toLocaleString('en-IN')} m${!routeIsVerified(c) ? ' · est.' : ''}`
            : 'Altitude to be confirmed'}
        </p>

        {/* Basecamp */}
        <p className={s.cardFacts}>
          Basecamp · {c.basecamp || 'To be confirmed'}
        </p>

        {/* Summary (hidden on mobile) */}
        <p className={s.cardSummary}>{trek.summary}</p>

        {/* Price + CTA */}
        <div className={s.cardBottom}>
          {c.enquiryOnly || trek.startingPrice === null ? (
            <p>
              <strong>Enquire for pricing</strong>
            </p>
          ) : (
            <p>
              <small>Starting from</small>
              <strong>{formatInr(trek.startingPrice!)}</strong>
              <small>per person</small>
            </p>
          )}
          <Link href={`/treks/${trek.slug}`} className={s.detailsLink}>
            View trek <span aria-hidden>↗</span>
          </Link>
        </div>
      </div>
    </article>
  )
}
