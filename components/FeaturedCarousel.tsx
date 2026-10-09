'use client'
import Link from 'next/link'
import { useEffect, useRef } from 'react'
import TripCard from './TripCard'
import Reveal from './Reveal'

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
  activeCategory: string
}

export default function FeaturedCarousel({ trips, activeCategory }: Props) {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const pausedRef = useRef(false)
  const visibleRef = useRef(true)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const el = scrollRef.current
    if (!el) return

    const mql = window.matchMedia(
      '(min-width: 1024px) and (prefers-reduced-motion: no-preference)',
    )
    if (!mql.matches) return

    const io = new IntersectionObserver(
      entries => {
        visibleRef.current = entries[0]?.isIntersecting ?? false
      },
      { threshold: 0.2 },
    )
    io.observe(el)

    const timer = window.setInterval(() => {
      if (pausedRef.current || !visibleRef.current || document.hidden) return
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 10
      if (atEnd) {
        el.scrollTo({ left: 0, behavior: 'smooth' })
      } else {
        const card = el.querySelector<HTMLElement>('[data-card]')
        const step = card ? card.offsetWidth + 14 : Math.round(el.clientWidth * 0.5)
        el.scrollBy({ left: step, behavior: 'smooth' })
      }
    }, 4800)

    return () => {
      io.disconnect()
      window.clearInterval(timer)
    }
  }, [trips.length])

  // Reset scroll position when the filter changes
  useEffect(() => {
    scrollRef.current?.scrollTo({ left: 0, behavior: 'auto' })
  }, [activeCategory])

  return (
    <section
      id="featured"
      style={{
        padding: 'clamp(32px, 6vh, 56px) 0',
        background: 'var(--bg)',
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0 20px 12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <Reveal>
          <div style={{ maxWidth: 680 }}>
            <p className="eyebrow" style={{ marginBottom: 8 }}>Featured trips</p>
            <h2 className="section-title">
              {activeCategory === 'All'
                ? 'Trips we actually run.'
                : `${activeCategory} we actually run.`}
            </h2>
            <p
              style={{
                color: 'var(--text-secondary)',
                fontSize: 'clamp(14px, 1.3vw, 16px)',
                marginTop: 8,
                lineHeight: 1.6,
                maxWidth: 560,
              }}
            >
              Each one is planned end-to-end with partners we know. &quot;Starting from&quot; prices are
              per person — your final quote depends on dates, group size, and the tier you pick.
            </p>
          </div>
        </Reveal>
        <Link
          href="/trips"
          className="lift"
          style={{
            background: '#fff',
            color: '#1a1a1a',
            padding: '12px 20px',
            borderRadius: 999,
            textDecoration: 'none',
            fontSize: 14,
            fontWeight: 600,
            border: '1.5px solid var(--border)',
          }}
        >
          See all trips →
        </Link>
      </div>

      <div
        ref={scrollRef}
        className="hscroll hide-scrollbar featured-row"
        onMouseEnter={() => { pausedRef.current = true }}
        onMouseLeave={() => { pausedRef.current = false }}
        onFocusCapture={() => { pausedRef.current = true }}
        onBlurCapture={() => { pausedRef.current = false }}
      >
        {trips.length === 0 && (
          <p
            style={{
              color: 'var(--text-muted)',
              fontSize: 14,
              padding: '20px 4px',
              flexShrink: 0,
            }}
          >
            No trips in this category yet.
          </p>
        )}
        {trips.map((trip, i) => (
          <Reveal key={trip.id} delay={i * 60} style={{ flexShrink: 0 }}>
            <div data-card>
              <TripCard trip={trip} size="wide" />
            </div>
          </Reveal>
        ))}
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .featured-row {
            max-width: 1200px;
            margin: 0 auto;
          }
        }
      `}</style>
    </section>
  )
}
