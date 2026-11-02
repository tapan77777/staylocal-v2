import Image from 'next/image'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import TripCard from '@/components/TripCard'
import { getPublicCatalogue } from '@/lib/public-catalogue'
import { isDedicatedTrek, hasHimalayanWalks, type DiscoveryKind } from '@/lib/discovery'
import { waLink } from '@/lib/config'
import s from './Editorial.module.css'

export default async function DiscoveryLanding({ kind }: { kind: DiscoveryKind }) {
  const trips = await getPublicCatalogue()
  const trek = kind === 'treks'
  const primary = trips.filter(t => trek ? isDedicatedTrek(t) : !isDedicatedTrek(t))
  const related = trek ? trips.filter(hasHimalayanWalks) : []
  return <><Navbar /><main id="main-content">
    <section className={`${s.landingHero} ${trek ? s.trekHero : ''}`}>
      <Image src={trek ? '/images/mountain-trail.jpg' : '/images/island-shore.jpg'} alt={trek ? 'A mountain ridge above the clouds' : 'An island shore fringed by palm trees'} fill sizes="100vw" preload className={s.cover} />
      <div className={s.heroShade} /><div className={s.landingHeroCopy}><p className={s.lightEyebrow}>{trek ? 'Treks & mountain adventures' : 'Domestic holidays & group journeys'}</p><h1>{trek ? <>A little higher.<br /><em>A little closer to yourself.</em></> : <>Less rush.<br /><em>More India.</em></>}</h1><p>{trek ? 'Find your next trail, from quiet forest walks to Himalayan trekking adventures.' : 'Mountain towns, island mornings and holidays shaped around the way you travel.'}</p><a href="#journeys" className={s.lightButton}>{trek ? 'Explore mountain journeys' : 'Find your next holiday'} <span aria-hidden>↓</span></a></div>
    </section>
    <section id="journeys" className={s.section}>
      <div className={s.sectionHead}><div><p className="eyebrow">{trek ? 'Answer the call of the trail' : 'Somewhere worth slowing down'}</p><h2>{trek ? 'Find your mountain moment.' : 'Your next chapter starts here.'}</h2></div><p>{trek ? 'Choose the experience that suits your pace. We’ll help with the details.' : 'Private holidays and journeys with your people. Final dates and arrangements are confirmed personally.'}</p></div>
      {primary.length > 0 ? <><p className={s.listNote}>{primary.length} published {primary.length === 1 ? 'journey' : 'journeys'} · Starting prices are per person, based on two travellers. Final quote confirmed on enquiry.</p><div className={s.tripGrid}>{primary.map(t => <TripCard key={t.id} trip={t} size="fluid" />)}</div></> : <div className={s.emptyState}><h3>{trek ? 'Let’s find the right trail for you.' : 'Let’s find your next getaway.'}</h3><p>{trek ? 'Dedicated trek departures aren’t published yet. Tell us your preferred region, dates and walking experience, and we’ll discuss what’s possible.' : 'New holidays are being planned. Share your dates, destination and group size, and we’ll discuss a personal itinerary.'}</p><a className={s.textLink} href={waLink(trek ? 'Hi StayLocal! I would like to discuss a Himalayan trek. Please help me choose a suitable trail and dates.' : 'Hi StayLocal! I would like to discuss a customized holiday in India.')} target="_blank" rel="noopener noreferrer">{trek ? 'Talk to us about a trek' : 'Talk to us about a holiday'} ↗</a></div>}
      {related.length > 0 && <div className={s.related}><p className="eyebrow">Another way into the mountains</p><h2>Mountain holidays with a little adventure.</h2><p>These are holidays with trekking or guided walks in their itinerary, rather than dedicated trek departures. Open a package to see the included activities and options.</p><div className={s.tripGrid}>{related.map(t => <TripCard key={t.id} trip={t} size="fluid" />)}</div></div>}
    </section>
    <section className={s.landingCta}><div><p className="eyebrow">Made around you</p><h2>Your dates. Your people. Your kind of journey.</h2><p>Share an idea, or start with a conversation. We’ll help put the details together.</p></div><Link href="/#enquiry" className={s.darkButton}>Plan a personal journey ↗</Link><Link className={s.textLink} href={trek ? '/tours' : '/treks'}>{trek ? 'Explore tours instead' : 'Head for the trails'} ↗</Link></section>
  </main><Footer /></>
}
