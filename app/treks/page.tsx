import TrekListing, { type TrekFilters } from '@/components/treks/TrekListing'
import { getPublishedTreks } from '@/lib/treks/store'
import { trekFixturesAllowed } from '@/lib/treks/flags'
import { discoveryMetadata } from '@/lib/discovery-metadata'
export const dynamic = 'force-dynamic'
type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }
const metadata = discoveryMetadata('Himalayan treks & trekking adventures in India', 'Find a trek for your pace. Explore documented itineraries, difficulty, preparation and operator-confirmed departures with StayLocal.', '/treks', '/images/mountain-trail.jpg')
export async function generateMetadata({ searchParams }: Props) {
  const params = await searchParams
  return { ...metadata, robots: { index: !trekFixturesAllowed() && !['region', 'difficulty', 'duration', 'season', 'price'].some(k => !!params[k]), follow: true } }
}
export default async function TreksPage({ searchParams }: Props) {
  const params = await searchParams
  const filters = Object.fromEntries(['region', 'difficulty', 'duration', 'season', 'price'].map(k => [k, typeof params[k] === 'string' ? params[k] : ''])) as TrekFilters
  return <TrekListing treks={await getPublishedTreks()} filters={filters} />
}
