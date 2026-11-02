import TripForm from '@/components/admin/TripForm'
import TrekBuilder from '@/components/admin/TrekBuilder'
import CreatePackageChoice from '@/components/admin/CreatePackageChoice'
import { requireAdmin } from '@/lib/requireAdmin'
import { trekSystemEnabled, trekWritesEnabled } from '@/lib/treks/flags'
export const metadata = { title: 'Create package', robots: { index: false, follow: false } }
export default async function NewTripPage({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  await requireAdmin()
  const kind = (await searchParams).kind
  if (kind === 'trek') return <TrekBuilder writeEnabled={trekWritesEnabled()} />
  if (kind === 'tour') return <TripForm productKind={trekSystemEnabled() ? 'TOUR' : undefined} />
  return <CreatePackageChoice enabled={trekSystemEnabled()} />
}
