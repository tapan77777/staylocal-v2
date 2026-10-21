import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import sharp from 'sharp'
import { NextRequest, NextResponse } from 'next/server'
import { imageFileSchema, MAX_IMAGE_BYTES } from '@/lib/image-policy'
import { prepareImage, readImage } from '@/lib/image-upload'

const mocks = vi.hoisted(() => ({ access: vi.fn(), put: vi.fn() }))
vi.mock('@/lib/admin-access', () => ({ adminAccess: mocks.access }))
vi.mock('@vercel/blob', () => ({ put: mocks.put }))
import { GET, POST } from '@/app/api/admin/media/route'

const image = () => sharp({ create: { width: 8, height: 8, channels: 3, background: '#315e42' } }).png().toBuffer()
const request = (body: Uint8Array, type = 'image/png') => new NextRequest('https://staylocal.test/api/admin/media', { method: 'POST', headers: { 'content-type': type }, body: new Uint8Array(body) })

beforeEach(() => {
  vi.clearAllMocks()
  mocks.access.mockResolvedValue({ ok: true })
  mocks.put.mockResolvedValue({ url: 'https://test.public.blob.vercel-storage.com/trips/test.webp' })
  vi.stubEnv('BLOB_READ_WRITE_TOKEN', 'test-only-storage-configuration')
})
afterEach(() => vi.unstubAllEnvs())

describe('image policy and decoding', () => {
  it.each(['image/svg+xml', 'text/html', 'application/pdf', 'image/gif'])('rejects %s', type => {
    expect(imageFileSchema.safeParse({ type, size: 100 }).success).toBe(false)
  })
  it('rejects empty and oversized files', () => {
    expect(imageFileSchema.safeParse({ type: 'image/png', size: 0 }).success).toBe(false)
    expect(imageFileSchema.safeParse({ type: 'image/png', size: MAX_IMAGE_BYTES + 1 }).success).toBe(false)
  })
  it('decodes and re-encodes actual image bytes as WebP', async () => {
    const output = await prepareImage(await image(), 'image/png')
    const metadata = await sharp(output).metadata()
    expect(metadata.format).toBe('webp')
    expect(metadata.exif).toBeUndefined()
  })
  it('rejects disguised HTML and mismatched MIME types', async () => {
    await expect(prepareImage(Buffer.from('<html>bad</html>'), 'image/png')).rejects.toThrow('could not be read')
    await expect(prepareImage(await image(), 'image/jpeg')).rejects.toThrow('does not match')
  })
  it('enforces size limits even without a content-length header', async () => {
    await expect(readImage(request(new Uint8Array(MAX_IMAGE_BYTES + 1)))).rejects.toThrow('4 MB')
  })
})

describe('authenticated upload API', () => {
  it.each([401, 403])('rejects unauthorized uploads before storage/body processing: %i', async status => {
    mocks.access.mockResolvedValue({ ok: false, response: NextResponse.json({ error: 'Denied' }, { status }) })
    expect((await POST(request(new Uint8Array()))).status).toBe(status)
    expect(mocks.put).not.toHaveBeenCalled()
  })
  it('reports unavailable storage without exposing configuration', async () => {
    vi.stubEnv('BLOB_READ_WRITE_TOKEN', '')
    const response = await POST(request(await image()))
    expect(response.status).toBe(503)
    expect(mocks.put).not.toHaveBeenCalled()
    expect(await (await GET()).json()).toEqual({ uploadsEnabled: false })
  })
  it('uploads only sanitized images under a server-generated pathname', async () => {
    expect((await POST(request(await image()))).status).toBe(201)
    expect(mocks.access).toHaveBeenCalledWith('content', expect.any(NextRequest))
    expect(mocks.put).toHaveBeenCalledWith(expect.stringMatching(/^trips\/[a-f0-9-]+\.webp$/), expect.any(Buffer), expect.objectContaining({ access: 'public', contentType: 'image/webp', allowOverwrite: false }))
  })
  it('rejects SVG without contacting storage', async () => {
    expect((await POST(request(Buffer.from('<svg/>'), 'image/svg+xml'))).status).toBe(415)
    expect(mocks.put).not.toHaveBeenCalled()
  })
  it('does not leak storage errors or tokens', async () => {
    mocks.put.mockRejectedValue(new Error('private-provider-details'))
    const response = await POST(request(await image()))
    expect(response.status).toBe(502)
    expect(await response.text()).not.toContain('private-provider-details')
  })
})
