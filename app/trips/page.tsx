import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import TripsBrowser from '@/components/TripsBrowser'
import { brand } from '@/lib/config'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: `All trips — ${brand.name}`,
  description:
    'Browse all our thoughtfully planned trips across India. Filter by destination, duration, and budget.',
  alternates: { canonical: `${brand.siteUrl}/trips` },
  openGraph: {
    title: `All trips — ${brand.name}`,
    description:
      'Browse all our thoughtfully planned trips across India. Filter by destination, duration, and budget.',
    url: `${brand.siteUrl}/trips`,
    type: 'website',
  },
}

type SP = Promise<{ q?: string; category?: string; duration?: string; price?: string; sort?: string }>

export default async function TripsPage({ searchParams }: { searchParams: SP }) {
  const trips = await prisma.trip.findMany({
    where: { status: 'published' },
    orderBy: { createdAt: 'desc' },
  })

  const sp = await searchParams

  const data = trips.map(t => ({
    id: t.id,
    slug: t.slug,
    title: t.title,
    subtitle: t.subtitle,
    location: t.location,
    category: t.category,
    duration: t.duration,
    difficulty: t.difficulty,
    price: t.price,
    image: t.image,
    gallery: t.gallery,
    route: t.route,
    status: t.status,
  }))

  const categories = Array.from(new Set(trips.map(t => t.category).filter(Boolean))).sort()

  return (
    <>
      <Navbar />
      <section
        style={{
          background:
            'linear-gradient(180deg, #F3EEE3 0%, var(--bg) 100%)',
          borderBottom: '1px solid var(--border-light)',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: 'clamp(48px, 8vh, 80px) 20px 36px' }}>
          <p className="eyebrow" style={{ marginBottom: 10 }}>All trips</p>
          <h1 className="section-title" style={{ letterSpacing: '-0.015em' }}>
            Pick a trip to explore.
          </h1>
          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: 'clamp(14px, 1.4vw, 16px)',
              marginTop: 12,
              maxWidth: 620,
              lineHeight: 1.6,
            }}
          >
            Everything we currently plan. Filter by destination, duration, or budget.
            All &quot;starting from&quot; prices are per person — final quotes confirmed on enquiry.
          </p>
        </div>
      </section>
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 20px 56px' }}>
        <TripsBrowser
          trips={data}
          categories={categories}
          initial={{
            q: sp.q ?? '',
            category: sp.category ?? '',
            duration: sp.duration ?? '',
            price: sp.price ?? '',
            sort: sp.sort ?? 'newest',
          }}
        />
      </main>
      <Footer />
    </>
  )
}
