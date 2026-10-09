import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import SearchBar from '@/components/SearchBar'
import PlannerSheet from '@/components/PlannerSheet'
import Discover from '@/components/Discover'
import TravelByStyle from '@/components/TravelByStyle'
import WhySection from '@/components/WhySection'
import HowItWorks from '@/components/HowItWorks'
import FounderSection from '@/components/FounderSection'
import EnquiryForm from '@/components/EnquiryForm'
import Footer from '@/components/Footer'

export const dynamic = 'force-dynamic'

const homeTitle = 'StayLocal — Discover India Beyond the Ordinary'
const homeDescription =
  'Discover authentic India with local insights, thoughtfully planned trips, and personal travel support from StayLocal.'

export const metadata: Metadata = {
  title: { absolute: homeTitle },
  description: homeDescription,
  openGraph: {
    title: homeTitle,
    description: homeDescription,
    url: '/',
    type: 'website',
    locale: 'en_IN',
  },
  twitter: {
    card: 'summary_large_image',
    title: homeTitle,
    description: homeDescription,
  },
}

function regionOf(location: string, category: string): string {
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

  const destinationTrips = tripList.map(t => ({
    slug: t.slug, title: t.title, location: t.location, category: t.category, image: t.image,
  }))

  const regionSet = new Map<string, number>()
  for (const t of tripList) {
    const key = regionOf(t.location, t.category)
    regionSet.set(key, (regionSet.get(key) ?? 0) + 1)
  }
  const plannerDestinations = Array.from(regionSet.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([k, n]) => ({ key: k, label: `${k} (${n})` }))

  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <SearchBar />
        <Discover trips={tripList} destinationTrips={destinationTrips} />
        <TravelByStyle />
        <WhySection />
        <HowItWorks />
        <FounderSection experiences={expList} />
        <EnquiryForm trips={tripDropdown} />
      </main>
      <Footer />
      <PlannerSheet destinations={plannerDestinations} />
    </>
  )
}
