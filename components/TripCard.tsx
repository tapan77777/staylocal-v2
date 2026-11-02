'use client'
import { useState } from 'react'
import { isDedicatedTrek } from '@/lib/discovery'
import Link from 'next/link'

interface Trip {
  productKind?: 'TREK' | 'TOUR' | null
  publicPath?: string
  enquiryOnly?: boolean
  id: number
  slug: string
  title: string
  subtitle: string
  location: string
  category: string
  duration: string
  difficulty: string
  price: number
  priceBasis?: string
  priceOnRequest?: boolean
  image: string
  gallery: string
  route: string
  status: string
}

interface Props {
  trip: Trip
  size?: 'default' | 'wide' | 'fluid'
}

export default function TripCard({ trip, size = 'default' }: Props) {
  const enquiryOnly = isDedicatedTrek(trip) && trip.enquiryOnly
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

  const minWidth = size === 'fluid' ? 0 : size === 'wide' ? 300 : 272
  const maxWidth = size === 'fluid' ? '100%' : size === 'wide' ? 320 : 288

  return (
    <article style={{ position: 'relative', minWidth, maxWidth, width: size === 'fluid' ? '100%' : undefined }}>
    <Link
      href={trip.publicPath || `/trip/${trip.slug}`}
      className="group lift"
      aria-label={`${trip.title} — ${trip.duration}, ${enquiryOnly ? 'Enquire for dates & pricing' : trip.priceOnRequest ? 'price on request' : `from ₹${trip.price.toLocaleString('en-IN')} per person`}`}
      style={{
        textDecoration: 'none',
        color: 'inherit',
        display: 'block',
        minWidth,
        maxWidth,
        width: size === 'fluid' ? '100%' : undefined,
        background: '#fff',
        borderRadius: 20,
        border: '1px solid var(--border)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* Image */}
      <div
        style={{
          position: 'relative',
          aspectRatio: '4 / 3',
          overflow: 'hidden',
          background: '#f0ede8',
        }}
      >
        {images[imgIdx] ? (
          <img
            src={images[imgIdx]}
            alt=""
            loading="lazy"
            decoding="async"
            className="card-img"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg,#c8ddd5,#a8c5b8)',
            }}
          />
        )}

        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(0,0,0,0.3) 100%)',
          }}
        />

        {/* Category chip */}
        <span
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            background: 'rgba(255,255,255,0.95)',
            color: '#1a1a1a',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            padding: '5px 10px',
            borderRadius: 999,
          }}
        >
          {trip.category}
        </span>


      </div>

      {/* Body */}
      <div style={{ padding: '16px 18px 18px' }}>
        <p
          style={{
            fontSize: 11,
            color: 'var(--text-muted)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: 6,
          }}
        >
          {trip.location || trip.route || trip.category}
        </p>
        <h3
          style={{
            fontFamily: 'var(--font-playfair)',
            fontSize: 20,
            fontWeight: 700,
            lineHeight: 1.2,
            color: '#121212',
            marginBottom: 10,
            letterSpacing: '-0.005em',
          }}
        >
          {trip.title}
        </h3>

        <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
          <span style={tag}>{trip.duration}</span>
          {isDedicatedTrek(trip) && trip.difficulty && <span style={tag}>{trip.difficulty}</span>}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: 10,
            paddingTop: 14,
            borderTop: '1px solid var(--border-light)',
          }}
        >
          <div>
            <p
              style={{
                fontSize: 10,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
              }}
            >
              {enquiryOnly ? 'Enquiries' : trip.priceOnRequest ? 'Pricing' : 'Starting from'}
            </p>
            <p
              style={{
                fontFamily: 'var(--font-playfair)',
                fontSize: 22,
                fontWeight: 700,
                lineHeight: 1.1,
                color: '#121212',
                marginTop: 2,
              }}
            >
              {enquiryOnly ? 'Enquire for dates & pricing' : trip.priceOnRequest ? 'Price on request' : `₹${trip.price.toLocaleString('en-IN')}`}
              <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', marginLeft: 6 }}>
                {enquiryOnly || trip.priceOnRequest ? '' : '/ person'}
              </span>
            </p>
          </div>
          <span
            style={{
              background: '#121212',
              color: '#fff',
              padding: '9px 14px',
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            Explore trip →
          </span>
        </div>
      </div>
    </Link>
    {images.length > 1 && <div style={{ position: 'absolute', top: 16, right: 12, display: 'flex', gap: 6 }}><button type="button" onClick={prev} aria-label={`Previous image of ${trip.title}`} style={galleryButton}>‹</button><button type="button" onClick={next} aria-label={`Next image of ${trip.title}`} style={galleryButton}>›</button></div>}
    </article>
  )
}

const tag: React.CSSProperties = {
  fontSize: 11,
  background: 'var(--bg-muted)',
  color: 'var(--text-secondary)',
  padding: '4px 10px',
  borderRadius: 999,
  border: '1px solid var(--border)',
  fontWeight: 500,
}

const galleryButton: React.CSSProperties = { width: 44, height: 44, borderRadius: '50%', border: '1px solid #ddd', background: '#ffffffee', color: '#183d2d', fontSize: 24, cursor: 'pointer' }
