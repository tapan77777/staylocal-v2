import type { Metadata } from 'next'
import { brand } from '@/lib/config'

export function discoveryMetadata(title: string, description: string, path: string, image: string): Metadata {
  return {
    title: path === '/' ? { absolute: `${brand.name} — ${title}` } : title, description, alternates: { canonical: `${brand.siteUrl}${path}` },
    openGraph: { title: `${title} · ${brand.name}`, description, url: `${brand.siteUrl}${path}`, type: 'website', locale: 'en_IN', images: [{ url: image }] },
    twitter: { card: 'summary_large_image', title: `${title} · ${brand.name}`, description, images: [image] },
  }
}
