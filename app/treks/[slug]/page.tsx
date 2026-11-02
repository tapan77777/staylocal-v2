import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import TrekDetail from '@/components/treks/TrekDetail'
import { getPublishedTrek, getPublishedTreks } from '@/lib/treks/store'
import { trekMetadata } from '@/lib/treks/seo'
export const dynamic = 'force-dynamic'
type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ departure?: string }> }
export async function generateMetadata({ params }: Props) {
  const trek = await getPublishedTrek((await params).slug)
  return trek ? trekMetadata(trek) : { title: 'Trek not found', robots: { index: false, follow: false } }
}
export default async function TrekPage({ params, searchParams }: Props) {
  const trek = await getPublishedTrek((await params).slug)
  if (!trek) return notFound()
  const related = (await getPublishedTreks()).filter(t => t.id !== trek.id).slice(0, 2)
  const selection = (await searchParams).departure
  return <><Navbar /><main id="main-content"><TrekDetail trek={trek} related={related} initialDeparture={typeof selection === 'string' ? selection : undefined} /></main><Footer /></>
}
