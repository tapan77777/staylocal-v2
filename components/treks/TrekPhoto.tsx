import Image from 'next/image'
import type { TrekContent } from '@/lib/treks/schema'

interface TrekPhotoProps {
  photo: TrekContent['hero']
  sizes?: string
  eager?: boolean
  /** Add kenburns zoom animation (for hero images) */
  kenburns?: boolean
  /** Add card-img zoom-on-hover class (for card thumbnails) */
  cardImg?: boolean
  className?: string
}

export default function TrekPhoto({
  photo,
  sizes = '100vw',
  eager = false,
  kenburns = false,
  cardImg = false,
  className,
}: TrekPhotoProps) {
  if (!photo.src) return null

  const optimizable =
    photo.src.startsWith('/') ||
    /^https:\/\/images\.unsplash\.com\//.test(photo.src) ||
    /^https:\/\/[^/]+\.public\.blob\.vercel-storage\.com\//.test(photo.src)

  const cls = [kenburns && 'kenburns', cardImg && 'card-img', className]
    .filter(Boolean)
    .join(' ') || undefined

  return (
    <Image
      src={photo.src}
      alt={photo.alt}
      fill
      sizes={sizes}
      unoptimized={!optimizable}
      loading={eager ? 'eager' : 'lazy'}
      fetchPriority={eager ? 'high' : undefined}
      style={{ objectFit: 'cover' }}
      className={cls}
    />
  )
}
