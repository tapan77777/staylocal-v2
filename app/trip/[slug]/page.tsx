import { publicTripPrices } from '@/lib/public-trip-prices'
import UniversalTrip from '@/components/trip/UniversalTrip'
import { loadUniversal, legacyPackages } from '@/lib/universal-store'
import { quoteOffer, eligibleOffers, publicUniversal } from '@/lib/universal-trip'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import CalculatorTrip from '@/components/trip/CalculatorTrip'
import EnquiryTrip from '@/components/trip/EnquiryTrip'
import AndamanPage from '@/components/AndamanPage'
import { brand } from '@/lib/config'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const trip = await prisma.trip.findUnique({ where: { slug } })
  if (!trip || trip.status !== 'published') {
    return { title: 'Trip not found', robots: { index: false } }
  }



  const [pricedTrip] = await publicTripPrices([trip])
  const title = `${trip.title} — ${trip.duration} in ${trip.location}`
  const description =
    trip.subtitle ||
    `${trip.title}: ${trip.duration} trip in ${trip.location}. ${pricedTrip.priceOnRequest ? 'Price on request.' : `Starting from ₹${pricedTrip.price.toLocaleString('en-IN')} per person.`}`
  const url = `${brand.siteUrl}/trip/${trip.slug}`
  const image = trip.image || undefined

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: 'article',
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : undefined,
    },
  }
}

export default async function TripPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const trip = await prisma.trip.findUnique({
    where: { slug },
    include: { packages: { where: { status: 'published' }, orderBy: { sortOrder: 'asc' } } },
  })
  if (!trip || trip.status !== 'published') return notFound()

  const universal = await loadUniversal(trip)
  if (universal) {
    const initialQuotes = Object.fromEntries(eligibleOffers(universal, trip.packages).map(({ pkg }) => [pkg.slug, quoteOffer(universal, trip.packages, pkg.slug, Math.min(2, universal.maxPeople))]))
    return <><Navbar /><UniversalTrip trip={trip} config={publicUniversal(universal, trip.packages)} initialQuotes={initialQuotes} /><Footer /></>
  }

  if (trip.type === 'andaman') {
    return (
      <>
        <Navbar />
        <AndamanPage trip={trip} />
        <Footer />
      </>
    )
  }

  const parse = (s: string) => {
    try { return JSON.parse(s) } catch { return [] }
  }

  const data = {
    ...trip,
    galleryArr: parse(trip.gallery),
    highlightsArr: parse(trip.highlights),
    includedArr: parse(trip.included),
    notIncludedArr: parse(trip.notIncluded),
    faqsArr: parse(trip.faqs),
    pricingArr: parse(trip.pricing),
    itineraryArr: parse(trip.itinerary),
    tierDetailsArr: parse(trip.tierDetails),
    durLabelsArr: parse(trip.durLabels),
    durSubLabelsArr: parse(trip.durSubLabels),
    packages: legacyPackages(trip.packages),
  }

  return (
    <>
      <Navbar />
      {trip.type === 'calculator'
        ? <CalculatorTrip trip={data} />
        : <EnquiryTrip trip={data} />
      }
      <Footer />
    </>
  )
}
