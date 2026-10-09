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
  size?: 'default' | 'wide'
}

export default function TripCard({ trip, size = 'default' }: Props) {
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

  const minWidth = size === 'wide' ? 300 : 272
  const maxWidth = size === 'wide' ? 320 : 288

  return (
    <Link
      href={`/trip/${trip.slug}`}
      className="group lift"
      aria-label={`${trip.title} — ${trip.duration}, from ₹${trip.price.toLocaleString('en-IN')} per person`}
      style={{
        textDecoration: 'none',
        color: 'inherit',
        display: 'block',
        minWidth,
        maxWidth,
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

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Previous image"
              style={navBtn('left')}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M6.2 1.5 3 5l3.2 3.5" stroke="#1a1a1a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next image"
              style={navBtn('right')}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M3.8 1.5 7 5l-3.2 3.5" stroke="#1a1a1a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div
              style={{
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-50%)',
                bottom: 10,
                display: 'flex',
                gap: 4,
              }}
            >
              {images.map((_, i) => (
                <span
                  key={i}
                  style={{
                    width: i === imgIdx ? 14 : 5,
                    height: 5,
                    borderRadius: 999,
                    background: i === imgIdx ? '#fff' : 'rgba(255,255,255,0.55)',
                    transition: 'width 0.25s',
                  }}
                />
              ))}
            </div>
          </>
        )}
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
          {trip.difficulty && <span style={tag}>{trip.difficulty}</span>}
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
              Starting from
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
              ₹{trip.price.toLocaleString('en-IN')}
              <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', marginLeft: 6 }}>
                / person
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

function navBtn(side: 'left' | 'right'): React.CSSProperties {
  return {
    position: 'absolute',
    top: '50%',
    left: side === 'left' ? 10 : undefined,
    right: side === 'right' ? 10 : undefined,
    transform: 'translateY(-50%)',
    width: 30,
    height: 30,
    borderRadius: 999,
    background: 'rgba(255,255,255,0.95)',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
  }
}
