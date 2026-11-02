import { NextRequest, NextResponse } from 'next/server'
import { adminAccess } from '@/lib/admin-access'
import { adminError } from '@/lib/admin-errors'
import { saveTrek } from '@/lib/treks/store'
export async function POST(request: NextRequest) {
  const access = await adminAccess('content', request)
  if (!access.ok) return access.response
  let input: unknown
  try { input = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 }) }
  try { return NextResponse.json(await saveTrek(input), { headers: { 'Cache-Control': 'no-store' } }) } catch (error) { return adminError(error) }
}
