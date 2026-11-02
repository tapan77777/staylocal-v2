import type { Metadata } from 'next'
import type { TrekRecord } from './schema'
import { brand } from '@/lib/config'
export function trekMetadata(trek: TrekRecord): Metadata {
  const title = trek.content.seo.title || `${trek.title} — ${trek.content.durationDays} days in ${trek.content.region}`
  const description = trek.content.seo.description || trek.summary
  const image = trek.content.seo.socialImage || trek.content.hero.src
  const url = `${brand.siteUrl}/treks/${trek.slug}`
  return { title, description, alternates: { canonical: url }, robots: { index: !trek.content.fixture, follow: true }, openGraph: { title, description, url, type: 'website', locale: 'en_IN', images: image ? [{ url: image, alt: trek.content.hero.alt }] : [] }, twitter: { card: 'summary_large_image', title, description, images: image ? [image] : [] } }
}
export function trekStructuredData(trek: TrekRecord) {
  const url = `${brand.siteUrl}/treks/${trek.slug}`
  return { '@context': 'https://schema.org', '@graph': [
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: brand.siteUrl }, { '@type': 'ListItem', position: 2, name: 'Treks', item: `${brand.siteUrl}/treks` }, { '@type': 'ListItem', position: 3, name: trek.title, item: url }] },
    { '@type': 'TouristTrip', '@id': `${url}#trek`, name: trek.title, description: trek.summary, url, image: trek.content.hero.src, touristType: 'Trekking', provider: { '@type': 'Organization', name: brand.name, url: brand.siteUrl }, itinerary: { '@type': 'ItemList', itemListElement: trek.content.stages.map((stage, i) => ({ '@type': 'ListItem', position: i + 1, name: stage.title })) }, ...(!trek.content.enquiryOnly && trek.startingPrice !== null ? { offers: { '@type': 'Offer', url, price: trek.startingPrice, priceCurrency: 'INR', description: 'Starting price per person; final quote confirmed on enquiry.' } } : {}) },
  ] }
}
export function safeJsonLd(value: unknown) { return JSON.stringify(value).replace(/</g, '\\u003c') }
