'use client'
import { useState } from 'react'
import CategoryFilter from './CategoryFilter'
import TripCard from './TripCard'

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

interface Props {
  trips: Trip[]
}

export default function TripsList({ trips }: Props) {
  const [category, setCategory] = useState('All')

  const filtered = category === 'All' ? trips : trips.filter(t => t.category === category)

  return (
    <section id="trips" style={{ paddingBottom: 8 }}>

      {/* FIX 4 — Section heading */}
      <div className="px-4 pt-6 pb-3">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#1D9E75] font-medium mb-2">
          Handpicked for you
        </p>
        <h2
          style={{ fontFamily: 'var(--font-playfair)' }}
          className="text-[26px] text-[#1a1a1a] leading-tight"
        >
          Explore our trips
        </h2>
      </div>

      {/* Category filter */}
      <CategoryFilter active={category} onChange={setCategory} />

      {/* FIX 5 — Cards scroll container */}
      <div className="flex gap-3 overflow-x-auto hide-scrollbar px-4 pb-5 pt-3">
        {filtered.length === 0 && (
          <p style={{ color: 'var(--text-muted)', fontSize: 14, padding: '20px 0', flexShrink: 0 }}>
            No trips in this category yet.
          </p>
        )}
        {filtered.map(trip => (
          <TripCard key={trip.id} trip={trip} />
        ))}
      </div>

    </section>
  )
}
