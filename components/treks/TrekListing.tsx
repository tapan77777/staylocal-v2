import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import type { TrekRecord } from '@/lib/treks/schema'
import TrekPhoto from './TrekPhoto'
import TrekCard from './TrekCard'
import s from './Treks.module.css'
export type TrekFilters = { region?: string; difficulty?: string; duration?: string; season?: string; price?: string }
export function filterTreks(treks: TrekRecord[], filters: TrekFilters) {
  return treks.filter(t => (!filters.region || t.content.region === filters.region) && (!filters.difficulty || t.content.difficulty === filters.difficulty) && (!filters.season || t.content.seasons.includes(filters.season as TrekRecord['content']['seasons'][number])) && (!filters.duration || (filters.duration === 'short' ? t.content.durationDays <= 3 : filters.duration === 'week' ? t.content.durationDays >= 4 && t.content.durationDays <= 6 : filters.duration === 'long' ? t.content.durationDays >= 7 : false)) && (!filters.price || (t.startingPrice !== null && (filters.price === 'under-10000' ? t.startingPrice < 10000 : filters.price === '10000-20000' ? t.startingPrice >= 10000 && t.startingPrice <= 20000 : filters.price === 'over-20000' ? t.startingPrice > 20000 : false))))
}
export default function TrekListing({ treks, filters = {} }: { treks: TrekRecord[]; filters?: TrekFilters }) {
  const visible = filterTreks(treks, filters)
  const regions = [...new Set(treks.map(t => t.content.region).filter(Boolean))].sort()
  const difficulties = [...new Set(treks.map(t => t.content.difficulty).filter((v): v is NonNullable<typeof v> => !!v))]
  const seasons = [...new Set(treks.flatMap(t => t.content.seasons))]
  const active = Object.values(filters).some(Boolean)
  return <><Navbar /><main id="main-content" className={s.page}>
    <section className={s.listHero}><TrekPhoto photo={{ src: '/images/mountain-trail.jpg', alt: 'Layers of mountain ridges above the clouds', caption: '' }} eager /><div className={s.shade} /><div className={s.heroCopy}><p className={s.heroEyebrow}>StayLocal · A different way up</p><h1>Find your trail.<br /><em>Keep the feeling.</em></h1><p>Thoughtful trekking journeys, clear trail notes and a little more room to breathe.</p><a href="#trek-collection" className={s.lightButton}>Explore the collection ↓</a></div></section>
    <section id="trek-collection" className={s.container}><div className={s.sectionIntro}><div><p className={s.eyebrow}>Trekking, thoughtfully planned</p><h2>Good journeys start with good information.</h2></div><p>Find a trek that suits your pace. Read the route, understand the demands and ask us about the details before you commit.</p></div>
      {treks.some(t => t.content.fixture) && <p className={s.fixture}>LOCAL DESIGN FIXTURES · These are simulated products for interface testing, not real trekking offers.</p>}
      {treks.length > 0 && <form action="/treks" method="get" className={s.filters} aria-label="Filter treks">
        {regions.length > 0 && <label>Region<select name="region" defaultValue={filters.region || ''}><option value="">All regions</option>{regions.map(v => <option key={v}>{v}</option>)}</select></label>}
        {difficulties.length > 0 && <label>Difficulty<select name="difficulty" defaultValue={filters.difficulty || ''}><option value="">All levels</option>{difficulties.map(v => <option key={v}>{v}</option>)}</select></label>}
        <label>Duration<select name="duration" defaultValue={filters.duration || ''}><option value="">Any length</option>{treks.some(t => t.content.durationDays <= 3) && <option value="short">1–3 days</option>}{treks.some(t => t.content.durationDays >= 4 && t.content.durationDays <= 6) && <option value="week">4–6 days</option>}{treks.some(t => t.content.durationDays >= 7) && <option value="long">7+ days</option>}</select></label>
        {seasons.length > 0 && <label>Season<select name="season" defaultValue={filters.season || ''}><option value="">Any season</option>{seasons.map(v => <option key={v}>{v}</option>)}</select></label>}
        {treks.some(t => t.startingPrice !== null) && <label>Price / person<select name="price" defaultValue={filters.price || ''}><option value="">Any budget</option>{treks.some(t => t.startingPrice !== null && t.startingPrice < 10000) && <option value="under-10000">Under ₹10,000</option>}{treks.some(t => t.startingPrice !== null && t.startingPrice >= 10000 && t.startingPrice <= 20000) && <option value="10000-20000">₹10,000–20,000</option>}{treks.some(t => t.startingPrice !== null && t.startingPrice > 20000) && <option value="over-20000">Above ₹20,000</option>}</select></label>}
        <button className={s.primary} type="submit">Find treks</button>{active && <Link href="/treks" className={s.textLink}>Clear filters</Link>}
      </form>}
      <p className={s.resultCount} aria-live="polite">{visible.length} {visible.length === 1 ? 'trek' : 'treks'}{active ? ' matching your filters' : ' in the collection'}</p>
      <div className={s.listLayout}><div className={s.trekRows}>{visible.map(t => <TrekCard key={t.id} trek={t} />)}{!visible.length && <div className={s.empty}><h3>{treks.length ? 'A little more room to explore.' : 'The next chapter is taking shape.'}</h3><p>{treks.length ? 'No published treks match these filters. Try another season or clear your selection.' : 'Dedicated trek itineraries are being prepared. We’ll publish them when their route, preparation and operator details are ready.'}</p><Link href={treks.length ? '/treks' : '/contact'} className={s.textLink}>{treks.length ? 'Clear filters' : 'Talk to us about a trek'} ↗</Link></div>}</div><aside className={s.collectionNote}><p className={s.eyebrow}>Choose your pace</p><h3>The best trail is the one that’s right for you.</h3><p>Difficulty is an operator assessment. Read the day-by-day trail notes, preparation and pickup details before making plans.</p><Link href="/contact">Ask a real person ↗</Link><hr /><p>Prefer a mountain holiday with shorter walks?</p><Link href="/tours">Explore tours & holidays ↗</Link></aside></div>
    </section>
  </main><Footer /></>
}
