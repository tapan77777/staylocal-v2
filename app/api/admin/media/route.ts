import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { randomUUID } from 'node:crypto'
import { adminAccess } from '@/lib/admin-access'
import { readImage, prepareImage, ImageError } from '@/lib/image-upload'

export const runtime = 'nodejs'

export async function GET() {
  const access = await adminAccess('content')
  if (!access.ok) return access.response
  return NextResponse.json({ uploadsEnabled: !!process.env.BLOB_READ_WRITE_TOKEN }, { headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(req: NextRequest) {
  const access = await adminAccess('content', req)
  if (!access.ok) return access.response
  if (!process.env.BLOB_READ_WRITE_TOKEN) return NextResponse.json({ error: 'Photo uploads are not configured yet. Use an image URL or ask your administrator to connect storage.' }, { status: 503 })
  try {
    const contentType = req.headers.get('content-type')?.split(';')[0] ?? ''
    const image = await prepareImage(await readImage(req), contentType)
    const photo = await put(`trips/${randomUUID()}.webp`, image, { access: 'public', contentType: 'image/webp', addRandomSuffix: true, allowOverwrite: false })
    return NextResponse.json({ url: photo.url }, { status: 201 })
  } catch (error) {
    if (error instanceof ImageError) return NextResponse.json({ error: error.message }, { status: error.status })
    return NextResponse.json({ error: 'Photo upload failed. Your trip has not changed. Please retry or use an image URL.' }, { status: 502 })
  }
}
