'use client'
import { useMemo, useState } from 'react'
import CategoryCircles from './CategoryCircles'
import CuratedTrips from './CuratedTrips'
import DestinationsCarousel from './DestinationsCarousel'
import FeaturedCarousel from './FeaturedCarousel'

interface Trip {
  id: number
  slug: string
  title: string
  subtitle: string
  location: string
  category: string
  duration: string
  difficulty: string
  price: number
  image: string
  gallery: string
  route: string
  status: string
}

interface DestinationTrip {
  slug: string
  title: string
  location: string
  category: string
  image: string
}

interface Props {
  trips: Trip[]
  destinationTrips: DestinationTrip[]
}

function matchesCategory(tripCat: string, selected: string) {
  if (selected === 'All') return true
  const t = (tripCat || '').toLowerCase()
  const s = selected.toLowerCase()
  if (!t) return false
  return t === s || t.startsWith(s) || s.startsWith(t)
}

export default function Discover({ trips, destinationTrips }: Props) {
  const [cat, setCat] = useState('All')
  const filtered = useMemo(
    () => trips.filter(t => matchesCategory(t.category, cat)),
    [trips, cat],
  )

  return (
    <>
      <CategoryCircles active={cat} onChange={setCat} />
      <FeaturedCarousel trips={filtered} activeCategory={cat} />
      <CuratedTrips />
      <DestinationsCarousel trips={destinationTrips} />
    </>
  )
}
