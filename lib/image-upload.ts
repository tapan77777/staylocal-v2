import sharp from 'sharp'
import { MAX_IMAGE_BYTES, IMAGE_TYPES } from '@/lib/image-policy'
export { MAX_IMAGE_BYTES, IMAGE_TYPES } from '@/lib/image-policy'

export class ImageError extends Error { constructor(message: string, public status = 400) { super(message) } }

export async function readImage(request: Request): Promise<Buffer> {
  if (!IMAGE_TYPES.includes(request.headers.get('content-type')?.split(';')[0] ?? '')) throw new ImageError('Choose a JPEG, PNG, or WebP image.', 415)
  const length = Number(request.headers.get('content-length'))
  if (length > MAX_IMAGE_BYTES) throw new ImageError('Images must be 4 MB or smaller.', 413)
  if (!request.body) throw new ImageError('Choose an image to upload.')
  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    while (true) {
      const chunk = await reader.read()
      if (chunk.done) break
      size += chunk.value.byteLength
      if (size > MAX_IMAGE_BYTES) {
        await reader.cancel()
        throw new ImageError('Images must be 4 MB or smaller.', 413)
      }
      chunks.push(chunk.value)
    }
  } finally { reader.releaseLock() }
  if (!size) throw new ImageError('The image is empty.')
  return Buffer.concat(chunks)
}

export async function prepareImage(buffer: Buffer, contentType: string): Promise<Buffer> {
  try {
    const image = sharp(buffer, { limitInputPixels: 25_000_000, failOn: 'warning' })
    const metadata = await image.metadata()
    const types: Record<string, string> = { jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }
    if (types[metadata.format ?? ''] !== contentType || (metadata.pages ?? 1) > 1) throw new ImageError('The image type does not match its contents, or it is animated.')
    return await image.rotate().resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true }).webp({ quality: 85 }).toBuffer()
  } catch (error) {
    if (error instanceof ImageError) throw error
    throw new ImageError('This image could not be read. Use a valid, nonanimated image under 25 megapixels.')
  }
}
