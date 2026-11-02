import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/requireAdmin'
import { positiveId } from '@/lib/admin-errors'
import { readAdminTrek } from '@/lib/treks/store'
import TrekDetail from '@/components/treks/TrekDetail'
export const dynamic = 'force-dynamic'
export const metadata = { title: 'Private trek preview', robots: { index: false, follow: false } }
export default async function TrekPreview({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const id = positiveId((await params).id)
  const trek = id ? await readAdminTrek(id) : null
  if (!trek) return notFound()
  return <TrekDetail trek={trek} preview />
}
