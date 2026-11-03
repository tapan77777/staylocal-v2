import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/requireAdmin'
import { positiveId } from '@/lib/admin-errors'
import { readAdminTrek } from '@/lib/treks/store'
import TrekCard from '@/components/treks/TrekCard'
import TrekDetail from '@/components/treks/TrekDetail'
export const dynamic = 'force-dynamic'
export const metadata = { title: 'Private trek preview', robots: { index: false, follow: false } }
export default async function TrekPreview({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const id = positiveId((await params).id)
  const trek = id ? await readAdminTrek(id) : null
  if (!trek) return notFound()
  return <><section aria-label="Listing card preview" style={{ maxWidth: 850, margin: '0 auto 30px' }}><TrekCard trek={trek}/></section><TrekDetail trek={trek} preview /></>
}
