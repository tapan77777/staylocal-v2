import { prisma } from '@/lib/prisma'
import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import TripsList from '@/components/TripsList'
import WhySection from '@/components/WhySection'
import FounderSection from '@/components/FounderSection'
import EnquiryForm from '@/components/EnquiryForm'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const [trips, experiences] = await Promise.all([
    prisma.trip.findMany({ where: { status: 'published' }, orderBy: { createdAt: 'desc' } }),
    prisma.experience.findMany({ where: { status: 'published' }, orderBy: { createdAt: 'desc' } }),
  ])

  const tripList = trips.map(t => ({
    id: t.id, slug: t.slug, title: t.title, subtitle: t.subtitle,
    location: t.location, category: t.category, duration: t.duration,
    difficulty: t.difficulty, price: t.price, image: t.image,
    gallery: t.gallery, route: t.route, status: t.status,
  }))

  const expList = experiences.map(e => ({
    id: e.id, slug: e.slug, title: e.title, location: e.location,
    category: e.category, description: e.description, visited: e.visited,
  }))

  const tripDropdown = tripList.map(t => ({ slug: t.slug, title: t.title }))

  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <TripsList trips={tripList} />
        <WhySection />
        <FounderSection experiences={expList} />
        <EnquiryForm trips={tripDropdown} />
      </main>
      <footer style={{ borderTop: '1px solid var(--border)', padding: '28px 20px', textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-playfair)', fontSize: 20, fontWeight: 700, marginBottom: 6 }}>
          <span>Stay</span><span style={{ color: 'var(--green)' }}>Local</span>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10 }}>Slow travel · Real places</p>
        <a href="https://wa.me/919178628894" target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--green)', textDecoration: 'none' }}>
          WhatsApp us
        </a>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 16 }}>© 2026 StayLocal. All rights reserved.</p>
      </footer>
    </>
  )
}
