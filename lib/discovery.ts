export type DiscoveryKind = 'treks' | 'tours'
interface Discoverable { productKind?: 'TREK' | 'TOUR' | null; category: string; location: string; highlights: string; itinerary: string }

// Classification is explicit; category text never upgrades an ambiguous legacy record.
export function isDedicatedTrek(trip: Pick<Discoverable, 'category' | 'productKind'>) {
  return trip.productKind === 'TREK'
}
export function hasHimalayanWalks(trip: Discoverable) {
  return !isDedicatedTrek(trip) && /himachal|uttarakhand|kashmir|ladakh|sikkim|darjeeling|himalaya|jibhi/i.test(trip.location)
    && /\b(trek|trekking|hike|hiking)\b/i.test(`${trip.highlights} ${trip.itinerary}`)
}
