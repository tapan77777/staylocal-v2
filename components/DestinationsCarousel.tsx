import Link from 'next/link'
import Reveal from './Reveal'

interface Trip {
  slug: string
  title: string
  location: string
  category: string
  image: string
}

interface DestinationCard {
  key: string
  label: string
  blurb: string
  image: string
  count: number
}

const REGION_BLURBS: Record<string, string> = {
  'Himachal Pradesh': 'Mountain valleys, cedar forests, slow mornings.',
  'Uttarakhand': 'Yoga towns, Himalayan foothills, river rafting.',
  'Kashmir & Ladakh': 'High-altitude deserts and mirror-lake valleys.',
  'Rajasthan': 'Desert forts, palaces, and painted villages.',
  'Kerala': 'Backwaters, spice hills, and quiet homestays.',
  'Andaman Islands': 'Turquoise shores, coral reefs, slow island days.',
  'Goa': 'Beaches that haven\u2019t forgotten how to be beaches.',
  'Northeast India': 'Living root bridges, rolling hills, warm hospitality.',
  'Karnataka': 'Coffee country, waterfalls, and old royal towns.',
  'Maharashtra': 'Western Ghats, Konkan coast, hill forts.',
}

function pickRegion(location: string, category: string): string {
  const l = (location || '').toLowerCase()
  if (l.includes('himachal') || l.includes('jibhi') || l.includes('tirthan') || l.includes('kasol') || l.includes('spiti') || l.includes('manali') || l.includes('shimla')) return 'Himachal Pradesh'
  if (l.includes('uttarakhand') || l.includes('rishikesh') || l.includes('nainital') || l.includes('mussoorie') || l.includes('dehradun') || l.includes('auli') || l.includes('kedar')) return 'Uttarakhand'
  if (l.includes('kashmir') || l.includes('srinagar') || l.includes('ladakh') || l.includes('leh')) return 'Kashmir & Ladakh'
  if (l.includes('rajasthan') || l.includes('jaipur') || l.includes('udaipur') || l.includes('jodhpur') || l.includes('jaisalmer')) return 'Rajasthan'
  if (l.includes('kerala') || l.includes('munnar') || l.includes('alleppey') || l.includes('wayanad')) return 'Kerala'
  if (l.includes('andaman') || l.includes('port blair') || l.includes('havelock') || l.includes('neil')) return 'Andaman Islands'
  if (l.includes('goa')) return 'Goa'
  if (l.includes('meghalaya') || l.includes('assam') || l.includes('sikkim') || l.includes('arunachal') || l.includes('nagaland') || l.includes('mizoram') || l.includes('tripura') || l.includes('manipur') || l.includes('shillong') || l.includes('gangtok')) return 'Northeast India'
  if (l.includes('karnataka') || l.includes('coorg') || l.includes('chikmagalur')) return 'Karnataka'
  if (l.includes('maharashtra') || l.includes('mumbai')) return 'Maharashtra'
  if (category) return category
  return location
}

interface Props {
  trips: Trip[]
}

export default function DestinationsCarousel({ trips }: Props) {
  if (!trips.length) return null

  const byKey = new Map<string, DestinationCard>()
  for (const t of trips) {
    const key = pickRegion(t.location, t.category)
    const existing = byKey.get(key)
    if (existing) {
      existing.count += 1
      if (!existing.image && t.image) existing.image = t.image
    } else {
      byKey.set(key, {
        key,
        label: key,
        blurb: REGION_BLURBS[key] || `${t.category} trips & experiences.`,
        image: t.image,
        count: 1,
      })
    }
  }

  const items = Array.from(byKey.values()).sort((a, b) => b.count - a.count).slice(0, 10)

  return (
    <section
      id="destinations"
      style={{ padding: 'clamp(32px, 6vh, 56px) 0' }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px 16px' }}>
        <Reveal>
          <p className="eyebrow" style={{ marginBottom: 8 }}>Where we travel</p>
          <h2 className="section-title">Destinations across India.</h2>
          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: 'clamp(14px, 1.3vw, 16px)',
              lineHeight: 1.6,
              marginTop: 8,
              maxWidth: 560,
            }}
          >
            Every region here links to real, published trips — never a dead end.
          </p>
        </Reveal>
      </div>

      <div className="hscroll dest-row hide-scrollbar">
        {items.map((d, i) => (
          <Reveal key={d.key} delay={i * 60}>
            <DestinationCard d={d} />
          </Reveal>
        ))}
      </div>

      <style>{`
        .dest-row > * { width: 84vw; max-width: 320px; }
        @media (min-width: 720px) {
          .dest-row > * { width: 300px; }
        }
        @media (min-width: 1024px) {
          .dest-row {
            max-width: 1200px;
            margin: 0 auto;
          }
          .dest-row > * { width: 280px; }
        }
      `}</style>
    </section>
  )
}

function DestinationCard({ d }: { d: DestinationCard }) {
  return (
    <Link
      href={`/trips?q=${encodeURIComponent(d.label)}`}
      className="group lift"
      aria-label={`${d.label} — ${d.count} ${d.count === 1 ? 'trip' : 'trips'}`}
      style={{
        position: 'relative',
        display: 'block',
        height: 320,
        borderRadius: 20,
        overflow: 'hidden',
        textDecoration: 'none',
        color: '#fff',
        background: '#0b1510',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      {d.image ? (
        <img
          src={d.image}
          alt=""
          className="card-img"
          style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.95 }}
        />
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg,#a8c5b8,#6fa08a)',
          }}
        />
      )}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(0,0,0,0.0) 30%, rgba(0,0,0,0.75) 100%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          gap: 6,
        }}
      >
        <p
          style={{
            fontSize: 11,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.78)',
          }}
        >
          {d.count} {d.count === 1 ? 'trip' : 'trips'}
        </p>
        <h3
          style={{
            fontFamily: 'var(--font-playfair)',
            fontSize: 22,
            fontWeight: 700,
            lineHeight: 1.1,
          }}
        >
          {d.label}
        </h3>
        <span
          style={{
            marginTop: 6,
            fontSize: 13,
            fontWeight: 600,
            color: '#9FE4C4',
          }}
        >
          Explore {d.label} →
        </span>
      </div>
    </Link>
  )
}
