'use client'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

function openPlanner() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('planner:open'))
  }
}

const VIDEO_SRC = process.env.NEXT_PUBLIC_HERO_VIDEO_URL || ''
const POSTER =
  process.env.NEXT_PUBLIC_HERO_POSTER ||
  'https://images.unsplash.com/photo-1587922546307-776227941871?auto=format&fit=crop&w=1920&q=72'

export default function Hero() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [videoReady, setVideoReady] = useState(false)

  useEffect(() => {
    const v = videoRef.current
    if (!v) return

    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion) return

    const tryPlay = () => {
      v.play().catch(() => {})
    }
    v.addEventListener('loadeddata', tryPlay, { once: true })

    const onVisibility = () => {
      if (document.hidden) v.pause()
      else tryPlay()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      v.removeEventListener('loadeddata', tryPlay)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return (
    <section
      style={{
        position: 'relative',
        minHeight: 'clamp(520px, 78vh, 760px)',
        width: '100%',
        overflow: 'hidden',
        color: '#fff',
        isolation: 'isolate',
      }}
    >
      {/* Background */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          background: '#0b1510',
        }}
      >
        {/* Image fallback / always-rendered base layer */}
        <img
          src={POSTER}
          alt=""
          className={VIDEO_SRC && videoReady ? '' : 'kenburns'}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center 42%',
            opacity: VIDEO_SRC && videoReady ? 0 : 1,
            transition: 'opacity 600ms ease',
          }}
        />
        {VIDEO_SRC && (
          <video
            ref={videoRef}
            poster={POSTER}
            muted
            autoPlay
            playsInline
            loop
            preload="metadata"
            aria-hidden
            onCanPlay={() => setVideoReady(true)}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center 42%',
              opacity: videoReady ? 1 : 0,
              transition: 'opacity 700ms ease',
            }}
          >
            <source src={VIDEO_SRC} />
          </video>
        )}
      </div>

      {/* Gradient overlay */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          background:
            'linear-gradient(180deg, rgba(7,42,33,0.55) 0%, rgba(7,20,14,0.35) 38%, rgba(7,20,14,0.75) 100%)',
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          background:
            'linear-gradient(90deg, rgba(7,20,14,0.5) 0%, rgba(7,20,14,0) 55%)',
        }}
      />

      {/* Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          minHeight: 'inherit',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          maxWidth: 1200,
          margin: '0 auto',
          padding: 'clamp(96px, 14vh, 160px) 20px 56px',
        }}
      >
        <div className="hero-rise" style={{ maxWidth: 760 }}>
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: '#9FE4C4',
              marginBottom: 20,
            }}
          >
            Thoughtfully planned · India
          </p>
          <h1
            style={{
              fontFamily: 'var(--font-playfair)',
              fontSize: 'clamp(38px, 7.4vw, 76px)',
              fontWeight: 700,
              lineHeight: 1.02,
              letterSpacing: '-0.015em',
              marginBottom: 20,
              textShadow: '0 2px 20px rgba(0,0,0,0.25)',
            }}
          >
            Your next great{' '}
            <em style={{ fontStyle: 'italic', color: '#8BE4C0' }}>Indian</em>{' '}
            adventure starts here.
          </h1>
          <p
            style={{
              fontSize: 'clamp(15px, 1.6vw, 19px)',
              lineHeight: 1.55,
              color: 'rgba(255,255,255,0.88)',
              maxWidth: 560,
              marginBottom: 28,
            }}
          >
            Discover unforgettable places, thoughtfully planned trips, and
            experiences worth travelling for — from the Himalayas to the Andaman coast.
          </p>
          <div
            style={{
              display: 'flex',
              gap: 10,
              flexWrap: 'wrap',
              marginBottom: 28,
            }}
          >
            <Link
              href="/trips"
              style={{
                background: 'var(--green)',
                color: '#fff',
                padding: '15px 28px',
                borderRadius: 999,
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: 15,
                letterSpacing: '0.01em',
                boxShadow: '0 10px 30px -10px rgba(29,158,117,0.6)',
              }}
            >
              Explore Trips →
            </Link>
            <button
              type="button"
              onClick={openPlanner}
              style={{
                background: 'rgba(255,255,255,0.1)',
                color: '#fff',
                padding: '15px 28px',
                borderRadius: 999,
                fontWeight: 600,
                fontSize: 15,
                border: '1.5px solid rgba(255,255,255,0.55)',
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Plan Your Trip
            </button>
          </div>
          <div
            style={{
              display: 'flex',
              gap: 'clamp(14px, 2.5vw, 24px)',
              fontSize: 13,
              color: 'rgba(255,255,255,0.78)',
              flexWrap: 'wrap',
            }}
          >
            {[
              'Founder-led planning',
              'Transparent pricing',
              'Real humans on WhatsApp',
            ].map(item => (
              <span
                key={item}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 999,
                    background: '#8BE4C0',
                    display: 'inline-block',
                  }}
                />
                {item}
              </span>
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}
