import { assertPreviewIsolation } from '@/lib/preview-isolation'

export const dynamic = 'force-dynamic'

// Non-secret preflight lets the staging runner refuse unsafe targets before login.
export async function GET() {
  if (process.env.VERCEL_ENV !== 'preview') return new Response(null, { status: 404 })
  try {
    const databaseId = assertPreviewIsolation()
    return Response.json({ environment: 'preview', databaseId }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return Response.json({ error: 'Preview isolation is not configured.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
}
