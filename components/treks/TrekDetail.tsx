import Link from 'next/link'
import type { CSSProperties, ReactNode } from 'react'
import type { TrekRecord } from '@/lib/treks/schema'
import { departureIsEnquirable, routeIsVerified, todayInIndia } from '@/lib/treks/schema'
import { formatInr } from '@/lib/pricing'
import { trekStructuredData, safeJsonLd } from '@/lib/treks/seo'
import TrekPhoto from './TrekPhoto'
import TrailOverview from './TrailOverview'
import ElevationProfile from './ElevationProfile'
import TrekEnquiryForm from './TrekEnquiryForm'
import TrekCard from './TrekCard'
import RouteIllustration from './RouteIllustration'
import TrekPricing, { detailOptions } from './TrekPricing'
import Crystals from './Crystals'
import TrekGallery from './TrekGallery'
import { TrekMotion, CountUp } from './TrekMotion'
import s from './Treks.module.css'

/** stagger index for CSS (--i), capped so long lists don't wait forever */
const vi = (i: number) => ({ '--i': Math.min(i, 8) }) as CSSProperties

/** SVG icons for stat cells — inline to avoid extra imports */
function IconClock() {
  return (
    <svg className={s.statIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  )
}
function IconMountain() {
  return (
    <svg className={s.statIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m8 3 4 8 5-5 5 15H2L8 3z"/>
    </svg>
  )
}
function IconAltitude() {
  return (
    <svg className={s.statIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 2v20M17 7l-5-5-5 5"/>
    </svg>
  )
}
function IconRoute() {
  return (
    <svg className={s.statIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 3v4a4 4 0 0 0 4 4h4"/><path d="M21 21v-4a4 4 0 0 0-4-4h-4"/>
    </svg>
  )
}

type MiniName = 'mountain' | 'clock' | 'altitude' | 'route' | 'camp' | 'pickup' | 'bed' | 'meal' | 'fitness' | 'weather' | 'packing' | 'terrain' | 'shield' | 'calendar' | 'check' | 'cross' | 'map' | 'faq'

function MiniIcon({ name }: { name: MiniName }) {
  const paths: Record<typeof name, ReactNode> = {
    mountain: <><path d="m3 18 6-9 4 5 2-3 6 7H3Z"/><path d="m7 12 2 2 2-2"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    altitude: <><path d="M12 21V4"/><path d="m7 9 5-5 5 5"/></>,
    route: <><circle cx="5" cy="18" r="2"/><circle cx="19" cy="6" r="2"/><path d="M7 18h3a3 3 0 0 0 3-3v-6a3 3 0 0 1 3-3h1"/></>,
    camp: <><path d="m3 20 9-16 9 16H3Z"/><path d="m12 11-3 9h6l-3-9Z"/></>,
    pickup: <><path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z"/><circle cx="12" cy="10" r="2"/></>,
    bed: <><path d="M3 6v12M3 13h18v5M5 13V8h7a3 3 0 0 1 3 3v2"/><path d="M8 8v5"/></>,
    meal: <><path d="M7 3v8M4 3v5a3 3 0 0 0 6 0V3M7 11v10M16 3v18M16 3c3 2 4 5 4 8h-4"/></>,
    fitness: <><path d="M5 8v8M19 8v8M2 10v4M22 10v4M5 12h14"/></>,
    weather: <><path d="M7 18h10a4 4 0 0 0 0-8 6 6 0 0 0-11-1A5 5 0 0 0 7 18Z"/><path d="m8 21-1 1M13 21l-1 1M18 21l-1 1"/></>,
    packing: <><rect x="5" y="7" width="14" height="13" rx="2"/><path d="M9 7V4h6v3M9 11v5M15 11v5"/></>,
    terrain: <><path d="m2 20 6-8 4 5 3-4 7 7H2Z"/><path d="m6 13 2 2 2-2"/></>,
    shield: <><path d="M12 3 20 6v5c0 5-3 8-8 10-5-2-8-5-8-10V6l8-3Z"/><path d="m9 12 2 2 4-5"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>,
    check: <><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></>,
    cross: <><circle cx="12" cy="12" r="9"/><path d="m9 9 6 6M15 9l-6 6"/></>,
    map: <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z"/><path d="M9 3v15M15 6v15"/></>,
    faq: <><circle cx="12" cy="12" r="9"/><path d="M9.8 9a2.3 2.3 0 1 1 3.7 1.8c-1 .7-1.5 1.2-1.5 2.2M12 16h.01"/></>,
  }
  return (
    <svg className={s.miniIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {paths[name]}
    </svg>
  )
}

export default function TrekDetail({
  trek,
  related = [],
  initialDeparture,
  initialOption,
  preview = false,
}: {
  trek: TrekRecord
  related?: TrekRecord[]
  initialDeparture?: string
  initialOption?: string
  preview?: boolean
}) {
  const c = trek.content, p = c.preparation, verified = routeIsVerified(c)
  const options = detailOptions(trek)
  const enquiryTrek = { ...trek, options }
  const showProvisionalFacts = preview && c.provisional
  preview = preview || c.fixture

  const nights = Math.max(0, c.durationDays - 1)
  // difficulty → 0..3 (-1 when unknown); drives the 4-pip meter
  const levelKeys = ['easy', 'moderate', 'difficult', 'challenging']
  const diffIdx = levelKeys.indexOf(String(c.difficulty || '').toLowerCase())
  const altitudeKnown = (verified || showProvisionalFacts) && c.maxAltitudeM !== null
  const distanceKnown = verified && c.distanceKm !== null

  // Stat grid tiles (value = big number, sub = small caption, meter = difficulty pips)
  const statsData: { icon: ReactNode; label: string; value: string; sub?: string; meter?: number; levelKey?: string }[] = [
    {
      icon: <IconClock />,
      label: 'Duration',
      value: `${c.durationDays} ${c.durationDays === 1 ? 'day' : 'days'}`,
      sub: `${nights} ${nights === 1 ? 'night' : 'nights'} on the trail`,
    },
    {
      icon: <IconMountain />,
      label: 'Difficulty',
      value: c.difficulty || 'To be confirmed',
      sub: diffIdx >= 0 ? `Level ${diffIdx + 1} of 4` : undefined,
      meter: diffIdx >= 0 ? diffIdx + 1 : 0,
      levelKey: diffIdx >= 0 ? levelKeys[diffIdx] : undefined,
    },
    {
      icon: <IconAltitude />,
      label: 'Max altitude',
      value: altitudeKnown ? `${c.maxAltitudeM!.toLocaleString('en-IN')} m${!verified ? ' · est.' : ''}` : 'To be confirmed',
      sub: altitudeKnown ? 'Highest point' : undefined,
    },
    {
      icon: <IconRoute />,
      label: 'Trail distance',
      value: distanceKnown ? `${c.distanceKm} km` : 'To be confirmed',
      sub: distanceKnown ? 'Covered on foot' : undefined,
    },
  ]

  // Essentials — only the facts NOT already shown in the stat tiles
  const essentials: { icon: MiniName; label: string; value: string }[] = [
    { icon: 'camp', label: 'Basecamp', value: c.basecamp || 'To be confirmed' },
    { icon: 'pickup', label: 'Pickup', value: c.pickup || 'To be confirmed' },
    { icon: 'map', label: 'Drop-off', value: c.drop || 'To be confirmed' },
    { icon: 'calendar', label: 'Best seasons', value: c.seasons.join(' · ') || 'Confirm with us' },
  ]

  return (
    <article className={`${s.page} ${s.detailPage}`}>
      {/* JSON-LD Structured Data */}
      {!preview && !c.fixture && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(trekStructuredData(trek)) }}
        />
      )}

      {/* Motion layer: scroll progress, reveal, scroll-spy, parallax */}
      <TrekMotion progress />

      {/* Notices */}
      {c.fixture && (
        <p className={s.fixture}>
          LOCAL DESIGN FIXTURE · Review content and illustrative imagery only. Any test values are not an offer. Not a real trekking product.
        </p>
      )}
      {c.provisional && (
        <p className={s.fixture}>
          PROVISIONAL DRAFT · Itinerary, measurements, arrangements and artwork require operator review. No dates or selling price are confirmed.
        </p>
      )}
      {preview && (
        <p className={s.previewNotice}>
          Unpublished editor preview · enquiries disabled · route data shown only when marked reviewed.
        </p>
      )}

      {/* Breadcrumbs */}
      <nav className={s.breadcrumbs} aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/treks">Treks</Link>
        <span>/</span>
        <span>{trek.title}</span>
      </nav>

      {/* ── Hero ─────────────────────────────────────────── */}
      <header className={s.detailHero}>
        <TrekPhoto photo={c.hero} eager kenburns />
        <div className={s.shade} />
        {/* floating crystal shards + sparkles */}
        <Crystals />
        <div className={s.detailHeroCopy}>
          {/* Region chip — amber frosted glass with live dot */}
          <p className={s.regionChip}>
            {c.region || trek.destination}
            {trek.destination && c.region && c.region !== trek.destination ? ` · ${trek.destination}` : ''}
          </p>
          <h1>{trek.title || 'Your trek story'}</h1>
          <p>{trek.summary}</p>
          {/* Highlight chips */}
          {c.highlights.length > 0 && (
            <div className={s.heroHighlights}>
              {c.highlights.slice(0, 5).map((h, i) => (
                <span key={i} style={vi(i)}>{h}</span>
              ))}
            </div>
          )}
          {/* Price + CTA */}
          <div className={s.heroAction}>
            <div>
              <small>{c.durationDays} days · {Math.max(0, c.durationDays - 1)} nights</small>
              <strong>
                {trek.startingPrice !== null && !c.enquiryOnly
                  ? `${formatInr(trek.startingPrice)} / person`
                  : 'Enquire for pricing'}
              </strong>
            </div>
            <a href="#trek-enquiry" className={`${s.lightButton} ${s.ctaPulse}`}>
              {preview ? 'View enquiry preview' : 'Plan this trek'} ↗
            </a>
          </div>
        </div>
      </header>

      {/* ── Stat Grid — pulled up over hero ──────────────── */}
      <div
        className={s.statGrid}
        role="region"
        aria-label="Trek at a glance"
        style={{ marginLeft: 'auto', marginRight: 'auto' }}
        data-reveal="zoom"
      >
        {statsData.map(({ icon, label, value, sub, meter, levelKey }) => (
          <div key={label} className={s.statCell}>
            <div className={s.statLabel}>
              {icon}
              {label}
            </div>
            <div className={s.statValue}><CountUp value={value} /></div>
            {sub && <div className={s.statSub}>{sub}</div>}
            {meter ? (
              <span className={s.statMeter} data-level={levelKey} aria-hidden>
                {[1, 2, 3, 4].map(n => <i key={n} data-on={n <= meter ? '' : undefined} />)}
              </span>
            ) : null}
          </div>
        ))}
      </div>

      {/* ── Detail Content ───────────────────────────────── */}
      <div className={s.detailContainer}>
        {/* Trek essentials (basecamp, pickup, drop, seasons) */}
        <section className={s.essentials} aria-label="Trek essentials" data-reveal="up">
          <div className={s.essentialsHead}>
            <p>Trek essentials</p>
            <span>Where you start, stay and finish</span>
          </div>
          <dl>
            {essentials.map(({ icon, label, value }, i) => (
              <div key={label} style={vi(i)}>
                <span className={s.essentialsIcon}><MiniIcon name={icon} /></span>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* In-page anchor nav (sticky + scroll-spy) */}
        <nav className={s.sectionLinks} aria-label="On this trek" data-spy-nav>
          <a href="#trail">Trail &amp; itinerary</a>
          <a href="#departures">Dates &amp; price</a>
          <a href="#preparation">Prepare &amp; stay informed</a>
          <a href="#gallery">Photos &amp; questions</a>
        </nav>

        {/* ── Two-column grid: main + enquiry sidebar ──── */}
        <div className={s.detailGrid}>
          <div className={s.mainColumn}>

            {/* 01 — Description */}
            <section className={s.detailSection} data-reveal="up">
              <p className={s.eyebrow}>The journey, in a few words</p>
              <h2>A little perspective changes everything.</h2>
              <p className={s.prose}>{c.description}</p>
              {c.suitability && (
                <div className={s.softNote}>
                  <MiniIcon name="fitness" />
                  <strong>Is this your kind of trek?</strong>
                  <p>{c.suitability}</p>
                </div>
              )}
            </section>

            {/* 02 — Highlights */}
            {c.highlights.length > 0 && (
              <section className={s.detailSection}>
                <p className={s.eyebrow}>The moments ahead</p>
                <h2>What makes this journey yours.</h2>
                <ul className={s.highlightList}>
                  {c.highlights.map((h, i) => (
                    <li key={i} data-reveal="up" style={vi(i)}>
                      <span className={s.highlightNumber}>{String(i + 1).padStart(2, '0')}</span>
                      <span className={s.highlightIcon}><MiniIcon name={i % 3 === 0 ? 'mountain' : i % 3 === 1 ? 'camp' : 'weather'} /></span>
                      <span className={s.highlightText}>{h}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* 03 — Route Illustration */}
            <RouteIllustration map={c.routeMap} />

            {/* 04 — Trail Overview + Day-by-Day */}
            <TrailOverview content={c} />

            {/* 05 — Elevation Profile */}
            <section className={s.detailSection} aria-label="Stage elevations" data-reveal="up">
              <ElevationProfile content={c} />
            </section>

            {/* 06 — Departures & Pricing */}
            <section id="departures" className={s.detailSection} data-reveal="up">
              <p className={s.eyebrow}>03 · Dates &amp; plans</p>
              <h2>Make room for the mountains.</h2>
              <p className={s.prose}>
                These statuses are maintained by the operator. They are not live seat counts. Availability and the final quote are confirmed when we reply.
              </p>
              {options.length > 0 ? (
                <TrekPricing trek={enquiryTrek} preview={preview} />
              ) : c.enquiryOnly ? (
                <div className={s.softNote}>
                  <strong>Enquire for pricing</strong>
                  <p>Contact us to confirm arrangements. No departure or price is confirmed by this page.</p>
                </div>
              ) : trek.departures.length ? (
                <div className={s.departures}>
                  {trek.departures.map((d, i) => (
                    <article key={d.id || d.key} data-reveal="up" style={vi(i)}>
                      <div>
                        <strong>
                          {d.startDate} <span>→ {d.endDate}</span>
                        </strong>
                        <small>
                          {d.startDate < todayInIndia() ? 'PAST DEPARTURE' : d.status}
                          {d.capacity ? ` · group capacity ${d.capacity}` : ''}
                        </small>
                        {d.notes && <p>{d.notes}</p>}
                      </div>
                      <div>
                        <strong>
                          {(d.priceAdult ?? trek.basePrice ?? trek.startingPrice) !== null
                            ? formatInr((d.priceAdult ?? trek.basePrice ?? trek.startingPrice)!)
                            : 'On request'}
                        </strong>
                        <small>/ person</small>
                        {departureIsEnquirable(d) && !preview && (
                          <Link href={`?departure=${encodeURIComponent(d.id || '')}#trek-enquiry`}>
                            Enquire ↗
                          </Link>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className={s.softNote}>
                  <strong>Dates are being confirmed.</strong>
                  <p>Ask us about a suitable departure or your preferred dates. No batch availability is implied.</p>
                </div>
              )}
            </section>

            {/* 07 — Stays & Travel */}
            <section className={s.detailSection} id="stays-travel" data-reveal="up">
              <p className={s.eyebrow}>Life between the walking</p>
              <h2>Arrive well. Rest well.</h2>
              <div className={s.preparationGrid}>
                <section>
                  <MiniIcon name="bed" />
                  <h3>Accommodation</h3>
                  <p className={s.prose}>{c.accommodation || 'Accommodation details are awaiting operator confirmation.'}</p>
                </section>
                <section>
                  <MiniIcon name="meal" />
                  <h3>Meals</h3>
                  <p className={s.prose}>{c.meals || 'Meal arrangements are awaiting operator confirmation.'}</p>
                </section>
                <section>
                  <MiniIcon name="pickup" />
                  <h3>Pickup &amp; drop-off</h3>
                  <p className={s.prose}>{c.pickup || 'To be confirmed'} → {c.drop || 'To be confirmed'}</p>
                </section>
                <section>
                  <MiniIcon name="route" />
                  <h3>Getting to the trail</h3>
                  <p className={s.prose}>{c.travelDetails || 'Confirm meeting point, timings and transport inclusions with us before travel.'}</p>
                </section>
              </div>
            </section>

            {/* 08 — Inclusions / Exclusions */}
            <section className={`${s.detailSection} ${s.inclusionGrid}`}>
              <div>
                <MiniIcon name="check" />
                <h2>Included, clearly.</h2>
                <ul>
                  {c.inclusions.map((v, i) => (
                    <li key={i} data-reveal="left" style={vi(i)}>{v}</li>
                  ))}
                </ul>
              </div>
              <div>
                <MiniIcon name="cross" />
                <h2>Plan separately.</h2>
                <ul>
                  {c.exclusions.map((v, i) => (
                    <li key={i} data-reveal="right" style={vi(i)}>{v}</li>
                  ))}
                </ul>
              </div>
            </section>

            {/* 09 — Preparation */}
            <section id="preparation" className={s.detailSection} data-reveal="up">
              <p className={s.eyebrow}>04 · Come prepared</p>
              <h2>Know the demands.<br />Enjoy the journey.</h2>
              <div className={s.preparationGrid}>
                {[
                  ['Fitness & difficulty', p.fitness, 'fitness'],
                  ['Weather & seasons', p.weather, 'weather'],
                  ['Altitude considerations', p.altitude, 'altitude'],
                  ['Terrain', p.terrain, 'terrain'],
                  ['Emergency arrangements', p.emergency, 'shield'],
                  ['Operator safety information', p.safety, 'shield'],
                ].map(([title, copy, icon], i) => (
                  <section key={title} data-reveal="up" style={vi(i)}>
                    <MiniIcon name={icon as 'fitness' | 'weather' | 'altitude' | 'terrain' | 'shield'} />
                    <h3>{title}</h3>
                    <p className={s.prose}>{copy || 'Operator details have not been supplied yet.'}</p>
                  </section>
                ))}
              </div>
              <h3 className={s.subheading}>What to pack</h3>
              <ul className={s.packing}>
                {p.packing.map((v, i) => (
                  <li key={i}>
                    <label>
                      <MiniIcon name="packing" />
                      <input type="checkbox" />
                      {v}
                    </label>
                  </li>
                ))}
              </ul>
              {p.operatorVerified && (
                <p className={s.caption}>
                  Operator review: {p.reviewedBy} · {p.reviewedOn}. Route and weather conditions can change; review arrangements before departure.
                </p>
              )}
              <p className={s.prose}>Best seasons: {c.seasons.join(' · ') || 'Confirm with us'}</p>
              <Link href="/cancellation" className={s.textLink}>
                Read cancellation &amp; refund information ↗
              </Link>
            </section>

            {/* 10 — Photo Gallery (vertical, slow auto-drift, hover to pause & browse) */}
            <section id="gallery" className={s.detailSection} data-reveal="up">
              <p className={s.eyebrow}>05 · A sense of place</p>
              <h2>Between the trail notes.</h2>
              {c.gallery.length > 0 ? (
                <TrekGallery photos={c.gallery} />
              ) : (
                <p className={s.prose}>More photographs will be added when available.</p>
              )}
            </section>

            {/* 11 — FAQs */}
            <section className={s.detailSection}>
              <h2>Good questions, honest answers.</h2>
              {c.faqs.map((f, i) => (
                <details key={i} className={s.faq} data-reveal="up" style={vi(i)}>
                  <summary>{f.q}</summary>
                  <p className={s.prose}>{f.a}</p>
                </details>
              ))}
              {!c.faqs.length && (
                <p className={s.prose}>Have a question about this trek? Send us an enquiry.</p>
              )}
            </section>

            {/* 12 — Related Treks */}
            {related.length > 0 && (
              <section className={s.detailSection} data-reveal="up">
                <p className={s.eyebrow}>Keep exploring</p>
                <h2>Another trail, another story.</h2>
                <div className={s.trekRows}>
                  {related.map(t => <TrekCard key={t.id} trek={t} />)}
                </div>
              </section>
            )}
          </div>

          {/* Enquiry Sidebar */}
          <aside className={s.enquiryColumn}>
            <TrekEnquiryForm
              trek={enquiryTrek}
              initialDeparture={initialDeparture}
              initialOption={initialOption}
              preview={preview}
            />
          </aside>
        </div>
      </div>

      {/* Mobile sticky bottom bar */}
      <div className={s.mobileEnquiry} data-mobile-bar>
        <div>
          {!c.enquiryOnly && <small>Starting / person</small>}
          <strong>
            {c.enquiryOnly
              ? 'Enquire for pricing'
              : trek.startingPrice !== null
              ? formatInr(trek.startingPrice)
              : 'Enquire for pricing'}
          </strong>
        </div>
        <a href="#trek-enquiry">
          {preview ? 'View enquiry preview' : 'Plan this trek'} ↗
        </a>
      </div>
    </article>
  )
}