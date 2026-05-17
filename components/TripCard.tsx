'use client'
import { useState } from 'react'
import Link from 'next/link'

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
  trip: Trip
}

export default function TripCard({ trip }: Props) {
  const images: string[] = (() => {
    try {
      const parsed = JSON.parse(trip.gallery)
      return parsed.length > 0 ? parsed : [trip.image].filter(Boolean)
    } catch {
      return [trip.image].filter(Boolean)
    }
  })()

  const [imgIdx, setImgIdx] = useState(0)

  const prev = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setImgIdx(i => (i - 1 + images.length) % images.length)
  }
  const next = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setImgIdx(i => (i + 1) % images.length)
  }

  return (
    <Link
      href={`/trip/${trip.slug}`}
      style={{ textDecoration: 'none', color: 'inherit', display: 'block', minWidth: 270, maxWidth: 270 }}
      className="flex-shrink-0 bg-white rounded-2xl border border-[#EAE8E4] overflow-hidden cursor-pointer"
    >
      {/* Image with carousel */}
      <div className="relative h-[170px] overflow-hidden">
        {images[imgIdx] ? (
          <img
            src={images[imgIdx]}
            alt={trip.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#c8ddd5,#a8c5b8)' }} />
        )}

        {/* Category badge */}
        <div className="absolute top-3 left-3 bg-black/50 text-white text-[10px] font-medium px-2.5 py-1 rounded-full">
          {trip.category}
        </div>

        {/* New badge */}
        <div className="absolute top-3 right-3 bg-[#1D9E75] text-white text-[10px] font-medium px-2.5 py-1 rounded-full">
          New
        </div>

        {/* Arrow buttons — only when multiple images */}
        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/80 rounded-full flex items-center justify-center border-none cursor-pointer"
              style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }}
            >
              <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                <path d="M5.5 1.5L2.5 4.5l3 3" stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/80 rounded-full flex items-center justify-center border-none cursor-pointer"
              style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }}
            >
              <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                <path d="M3.5 1.5l3 3-3 3" stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </>
        )}

        {/* Dot indicators */}
        {images.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {images.map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === imgIdx ? 14 : 5,
                  height: 5,
                  borderRadius: 999,
                  background: i === imgIdx ? '#fff' : 'rgba(255,255,255,0.5)',
                  transition: 'width 0.2s',
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="p-4">
        {/* Route */}
        {trip.route && (
          <p className="text-[11px] text-[#AAA] mb-1.5 truncate">{trip.route}</p>
        )}

        {/* Title */}
        <h3
          style={{ fontFamily: 'var(--font-playfair)' }}
          className="text-[17px] font-medium text-[#1a1a1a] mb-2 leading-snug"
        >
          {trip.title}
        </h3>

        {/* Tags — duration + difficulty only, no group size */}
        <div className="flex gap-1.5 mb-3">
          <span className="text-[10px] bg-[#F5F3F0] text-[#888] px-2.5 py-1 rounded-full border border-[#EAE8E4]">
            {trip.duration}
          </span>
          <span className="text-[10px] bg-[#F5F3F0] text-[#888] px-2.5 py-1 rounded-full border border-[#EAE8E4]">
            {trip.difficulty}
          </span>
        </div>

        {/* Price + View row */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[9px] text-[#BBB] uppercase tracking-wider mb-0.5">Starting from</p>
            <p
              style={{ fontFamily: 'var(--font-playfair)' }}
              className="text-[22px] font-medium text-[#1a1a1a] leading-none"
            >
              ₹{trip.price.toLocaleString('en-IN')}
            </p>
            <p className="text-[10px] text-[#BBB] mt-0.5">per person</p>
          </div>
          <div className="bg-[#1a1a1a] text-white text-[12px] font-medium px-4 py-2.5 rounded-full">
            View →
          </div>
        </div>
      </div>
    </Link>
  )
}
