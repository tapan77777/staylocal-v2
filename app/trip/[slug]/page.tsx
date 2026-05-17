import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Navbar from '@/components/Navbar'
import CalculatorTrip from '@/components/trip/CalculatorTrip'
import EnquiryTrip from '@/components/trip/EnquiryTrip'
import AndamanPage from '@/components/AndamanPage'

export const dynamic = 'force-dynamic'

export default async function TripPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const trip = await prisma.trip.findUnique({ where: { slug } })
  if (!trip || trip.status !== 'published') return notFound()

  // Andaman has its own layout — pass raw trip, it handles all parsing
  if (trip.type === 'andaman') {
    return (
      <>
        <Navbar />
        <AndamanPage trip={trip} />
      </>
    )
  }

  const parse = (s: string) => { try { return JSON.parse(s) } catch { return [] } }

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
  }

  return (
    <>
      <Navbar />
      {trip.type === 'calculator'
        ? <CalculatorTrip trip={data} />
        : <EnquiryTrip trip={data} />
      }
    </>
  )
}
