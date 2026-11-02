import Image from 'next/image'
import type { TrekContent } from '@/lib/treks/schema'
export default function TrekPhoto({ photo, sizes = '100vw', eager = false }: { photo: TrekContent['hero']; sizes?: string; eager?: boolean }) {
  if (!photo.src) return null
  const optimizable = photo.src.startsWith('/') || /^https:\/\/images\.unsplash\.com\//.test(photo.src) || /^https:\/\/[^/]+\.public\.blob\.vercel-storage\.com\//.test(photo.src)
  return <Image src={photo.src} alt={photo.alt} fill sizes={sizes} unoptimized={!optimizable} loading={eager ? 'eager' : 'lazy'} fetchPriority={eager ? 'high' : undefined} style={{ objectFit: 'cover' }} />
}
