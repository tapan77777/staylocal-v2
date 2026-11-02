import { NextRequest, NextResponse } from 'next/server'
import { adminAccess } from '@/lib/admin-access'
import { adminError, positiveId } from '@/lib/admin-errors'
import { readAdminTrek, saveTrek } from '@/lib/treks/store'
type Context = { params: Promise<{ id: string }> }
export async function GET(_request: NextRequest, { params }: Context) {
  const access = await adminAccess('content')
  if (!access.ok) return access.response
  const id = positiveId((await params).id)
  if (!id) return NextResponse.json({ error: 'Invalid ID.' }, { status: 400 })
  try { const trek = await readAdminTrek(id); return NextResponse.json(trek ?? { error: 'Trek not found.' }, { status: trek ? 200 : 404, headers: { 'Cache-Control': 'no-store' } }) } catch (error) { return adminError(error) }
}
export async function PUT(request: NextRequest, { params }: Context) {
  const access = await adminAccess('content', request)
  if (!access.ok) return access.response
  const id = positiveId((await params).id)
  if (!id) return NextResponse.json({ error: 'Invalid ID.' }, { status: 400 })
  let input: unknown
  try { input = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 }) }
  try { return NextResponse.json(await saveTrek(input, id), { headers: { 'Cache-Control': 'no-store' } }) } catch (error) { return adminError(error) }
}
