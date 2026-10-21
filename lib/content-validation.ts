import type { Trip, Prisma } from '@prisma/client'
import { tripInputSchema } from '@/lib/trip-schemas'

export type Validation<T> = { ok: true; data: T } | { ok: false; error: string }
export class ContentError extends Error {}
const fail = (message: string): never => { throw new ContentError(message) }

export function object(value: unknown, label = 'Body'): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return fail(`${label} must be an object.`)
  return value as Record<string, unknown>
}
export function text(value: unknown, label: string, required = false, max = 2000): string {
  if (typeof value !== 'string' || value.length > max || (required && !value.trim())) return fail(`${label} must be ${required ? 'a nonempty' : 'a'} string (max ${max} characters).`)
  return value.trim()
}
export function integer(value: unknown, label: string, min = 0, max = 10_000_000): number {
  if (typeof value === 'string' && /^\d+$/.test(value)) value = Number(value)
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < min || value > max) return fail(`${label} must be an integer from ${min} to ${max}.`)
  return value
}
export function imageUrl(value: unknown, label: string): string {
  const url = text(value, label, false, 2048)
  if (!url || (/^\/(?!\/)/.test(url) && !url.includes('\\'))) return url
  try {
    const parsed = new URL(url)
    if (['http:', 'https:'].includes(parsed.protocol) && !parsed.username && !parsed.password) return url
  } catch { /* rejected below */ }
  return fail(`${label} must be an HTTP(S) URL or a local path.`)
}
export function list(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value) || value.length > 200) return fail(`${label} must be an array (max 200 entries).`)
  return value
}
export function stringList(value: unknown, label: string): string[] {
  return list(value, label).map(v => text(v, label))
}
export function jsonValue(value: unknown, label: string): unknown {
  if (typeof value !== 'string') return fail(`${label} must be a JSON string.`)
  if (value.length > 100_000) return fail(`${label} is too large.`)
  try { return JSON.parse(value) } catch { return fail(`${label} contains invalid JSON.`) }
}
export function itinerary(value: unknown, label: string, requireTitle = true) {
  return list(value, label).map(v => {
    const d = object(v, label)
    return { day: text(d.day, `${label}: day`, true, 120), title: text(d.title, `${label}: title`, requireTitle, 300), desc: text(d.desc, `${label}: description`, false, 10_000) }
  })
}
export function validate<T>(fn: () => T): Validation<T> {
  try { return { ok: true, data: fn() } } catch (error) {
    if (error instanceof ContentError) return { ok: false, error: error.message }
    throw error
  }
}
export function allowedKeys(raw: Record<string, unknown>, keys: string[]) {
  if (Object.keys(raw).some(key => !keys.includes(key))) fail('Body contains unsupported fields.')
}
export function slug(value: unknown, label = 'Slug'): string {
  const result = text(value, label, true, 80)
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(result)) fail(`${label} must contain lowercase letters, digits, and single hyphens.`)
  return result
}
export function publication(value: unknown): 'draft' | 'published' {
  if (value !== 'draft' && value !== 'published') return fail('Status must be draft or published.')
  return value
}

const textKeys = ['title', 'subtitle', 'location', 'category', 'duration', 'difficulty', 'route'] as const
const jsonKeys = ['gallery', 'highlights', 'included', 'notIncluded', 'faqs', 'pricing', 'itinerary', 'tierDetails', 'durLabels', 'durSubLabels'] as const

// Explicit whitelist: never pass raw request properties or nested Prisma writes to the DB.
export function validateTripInput(input: unknown, existing?: Trip): Validation<Prisma.TripUncheckedCreateInput> {
  const shape = tripInputSchema.safeParse(input)
  if (!shape.success) return { ok: false, error: `Invalid trip field: ${shape.error.issues[0]?.path.join('.') || 'body'}. Check its value and format.` }
  return validate(() => {
    const raw = object(input)
    allowedKeys(raw, ['slug', 'price', 'status', 'type', 'image', 'packages', ...textKeys, ...jsonKeys])
    const get = (key: keyof Trip, fallback: unknown) => raw[key] ?? existing?.[key] ?? fallback
    for (const key of Object.keys(raw)) if (raw[key] === null) fail(`${key} cannot be null.`)
    const type = get('type', 'calculator')
    if (!['calculator', 'enquiry', 'andaman'].includes(type as string)) fail('Invalid trip type.')
    const status = publication(get('status', 'draft'))
    const data: Prisma.TripUncheckedCreateInput = {
      slug: slug(get('slug', '')),
      title: text(get('title', ''), 'Title', true, 200),
      location: text(get('location', ''), 'Location', true, 300),
      category: text(get('category', ''), 'Category', true, 120),
      duration: text(get('duration', ''), 'Duration', false, 120),
      price: integer(get('price', 0), 'Base price', status === 'published' ? 1 : 0),
      status, type: type as string, image: imageUrl(get('image', ''), 'Hero image'),
    }
    for (const key of ['subtitle', 'difficulty', 'route'] as const) data[key] = text(get(key, key === 'difficulty' ? 'Easy' : ''), key)
    for (const key of jsonKeys) {
      const value = jsonValue(get(key, '[]'), key)
      if (key === 'gallery') {
        data[key] = JSON.stringify(list(value, key).map(v => imageUrl(v, key)))
      } else if (key === 'faqs') {
        data[key] = JSON.stringify(list(value, key).map(v => {
          const faq = object(v, key)
          return { q: text(faq.q, 'FAQ question', true), a: text(faq.a, 'FAQ answer', true, 10_000) }
        }))
      } else if (key === 'itinerary') {
        data[key] = JSON.stringify(list(value, key).map(v => itinerary(v, key)))
      } else if (key === 'tierDetails') {
        data[key] = JSON.stringify(list(value, key).map(v => {
          const tier = object(v, key)
          return { name: text(tier.name, 'Tier name', true), vehicle: text(tier.vehicle, 'Vehicle'), meals: text(tier.meals, 'Meals'), feats: stringList(tier.feats, 'Tier features') }
        }))
      } else if (key === 'pricing') {
        if (type === 'andaman') {
          validateAndamanPricing(value)
          data[key] = JSON.stringify(value)
        } else {
          data[key] = JSON.stringify(list(value, key).map(row => list(row, 'Pricing row').map(n => integer(n, 'Price', 1))))
        }
      } else data[key] = JSON.stringify(stringList(value, key))
    }
    return data
  })
}

function validateAndamanPricing(value: unknown) {
  const pricing = object(value, 'Andaman pricing')
  const durations = list(pricing.durations, 'Durations')
  const tiers = list(pricing.tiers, 'Tiers')
  // Existing page initially selects index 1 and has five hardcoded itineraries.
  if (durations.length < 2 || durations.length > 5 || tiers.length < 2) fail('Andaman needs 2–5 durations and at least two tiers.')
  for (const entry of durations) {
    const d = object(entry, 'Duration')
    text(d.label, 'Duration label', true); text(d.sub, 'Duration subtitle'); imageUrl(d.image, 'Duration image')
  }
  for (const entry of tiers) {
    const tier = object(entry, 'Tier')
    for (const key of ['name', 'subtitle', 'ferry', 'meals']) text(tier[key], key, key === 'name')
    if (typeof tier.popular !== 'boolean') fail('Tier popular must be boolean.')
    stringList(tier.features, 'Tier features')
    const hotels = object(tier.hotels, 'Hotels')
    for (const key of ['portblair', 'havelock', 'neil']) text(hotels[key], key)
    for (const key of ['bufferPrice', 'price', 'promoPrice', 'discount']) {
      const numbers = list(tier[key], key)
      if (numbers.length !== durations.length) fail(`${key} must match duration count.`)
      for (const n of numbers) integer(n, key, key === 'price' || key === 'promoPrice' ? 1 : 0, key === 'discount' ? 100 : 10_000_000)
    }
  }
  stringList(pricing.promoCodes, 'Promo codes')
  // This existing field is a flat rupee discount, not a percentage.
  integer(pricing.promoDiscount, 'Promo discount', 0)
}

export function validateExperienceInput(input: unknown): Validation<Prisma.ExperienceCreateInput> {
  return validate(() => {
    const raw = object(input)
    allowedKeys(raw, ['slug', 'title', 'location', 'category', 'description', 'image', 'visited', 'status'])
    if (raw.visited !== undefined && typeof raw.visited !== 'boolean') fail('Visited must be boolean.')
    return {
      slug: slug(raw.slug), title: text(raw.title, 'Title', true, 200), location: text(raw.location, 'Location', true, 300),
      category: text(raw.category ?? '', 'Category'), description: text(raw.description ?? '', 'Description', false, 10_000),
      image: imageUrl(raw.image ?? '', 'Image'), visited: raw.visited === undefined ? true : raw.visited as boolean,
      status: publication(raw.status ?? 'published'),
    }
  })
}
