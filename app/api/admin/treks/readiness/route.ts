import { adminAccess } from '@/lib/admin-access'
import { trekSystemEnabled, trekWritesEnabled, trekFixturesAllowed } from '@/lib/treks/flags'
export async function GET() {
  const access = await adminAccess('content')
  if (!access.ok) return access.response
  return Response.json({ enabled: trekSystemEnabled(), writable: trekWritesEnabled(), isolatedFixtureReview: trekFixturesAllowed() }, { headers: { 'Cache-Control': 'no-store' } })
}
