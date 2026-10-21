import { allowedKeys, imageUrl, integer, itinerary, jsonValue, object, publication, slug as validateSlug, stringList, text, validate, ContentError } from '@/lib/content-validation'
import { packageInputSchema } from '@/lib/trip-schemas'

export interface BookingInput {
  name: string
  phone: string
  email?: string
  tripSlug: string
  people?: number
  month?: string
  message?: string
  packageId?: number | null
}

export interface ValidatedBooking {
  name: string
  phone: string
  email: string
  tripSlug: string
  people: number
  month: string
  message: string
  packageId: number | null
}

export function validateBooking(input: unknown): { ok: true; data: ValidatedBooking } | { ok: false; error: string } {
  if (!input || typeof input !== 'object') return { ok: false, error: 'Invalid payload.' }
  const raw = input as Record<string, unknown>

  const name = str(raw.name).trim()
  const phoneRaw = str(raw.phone).trim()
  const email = str(raw.email).trim()
  const tripSlug = str(raw.tripSlug).trim()
  const month = str(raw.month).trim()
  const message = str(raw.message).trim().slice(0, 2000)
  const peopleRaw = raw.people

  if (name.length < 2) return { ok: false, error: 'Please enter your full name.' }
  if (name.length > 120) return { ok: false, error: 'Name is too long.' }

  const phone = phoneRaw.replace(/[\s\-()]/g, '')
  if (!/^\+?\d{7,15}$/.test(phone)) {
    return { ok: false, error: 'Please enter a valid phone number.' }
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: 'Please enter a valid email.' }
  }

  if (!tripSlug) return { ok: false, error: 'Please pick a trip.' }
  if (!/^[a-z0-9-]{1,80}$/i.test(tripSlug)) {
    return { ok: false, error: 'Invalid trip reference.' }
  }

  let people = 2
  if (peopleRaw !== undefined && peopleRaw !== null && peopleRaw !== '') {
    const n = typeof peopleRaw === 'number' ? peopleRaw : parseInt(String(peopleRaw), 10)
    if (!Number.isFinite(n) || n < 1 || n > 50) {
      return { ok: false, error: 'Enter group size between 1 and 50.' }
    }
    people = Math.floor(n)
  }

  let packageId: number | null = null
  if (raw.packageId !== undefined && raw.packageId !== null && raw.packageId !== '') {
    const n = typeof raw.packageId === 'number' ? raw.packageId : parseInt(String(raw.packageId), 10)
    if (!Number.isFinite(n) || n < 1) {
      return { ok: false, error: 'Invalid package selection.' }
    }
    packageId = Math.floor(n)
  }

  return {
    ok: true,
    data: { name, phone, email, tripSlug, people, month, message, packageId },
  }
}

export interface PackageInput {
  id?: number
  slug: string
  label: string
  days: number
  nights: number
  priceAdult: number
  priceBasis?: string
  priceOnRequest?: boolean
  image?: string
  sortOrder?: number
  status?: string
  itinerary?: string
  accommodation?: string
  inclusions?: string
  exclusions?: string
  notes?: string
}

export interface ValidatedPackage {
  id?: number
  slug: string
  label: string
  days: number
  nights: number
  priceAdult: number
  priceBasis: string
  priceOnRequest: boolean
  image: string
  sortOrder: number
  status: string
  itinerary: string
  accommodation: string
  inclusions: string
  exclusions: string
  notes: string
}

export function validateTripPackageInput(input: unknown): { ok: true; data: ValidatedPackage } | { ok: false; error: string } {
  const shape = packageInputSchema.safeParse(input)
  if (!shape.success) return { ok: false, error: `Invalid package field: ${shape.error.issues[0]?.path.join('.') || 'body'}. Check its value and format.` }
  return validate(() => {
    const raw = object(input, 'Package')
    allowedKeys(raw, ['id', 'slug', 'label', 'days', 'nights', 'priceAdult', 'priceBasis', 'priceOnRequest', 'image', 'sortOrder', 'status', 'itinerary', 'accommodation', 'inclusions', 'exclusions', 'notes'])
    const status = publication(raw.status ?? 'draft')
    if (raw.priceOnRequest !== undefined && ![true, false, 'true', 'false', 1, 0].includes(raw.priceOnRequest as boolean)) throw new ContentError('Price on request must be boolean.')
    const priceOnRequest = raw.priceOnRequest === true || raw.priceOnRequest === 'true' || raw.priceOnRequest === 1
    const priceAdult = integer(raw.priceAdult, 'Price')
    if (status === 'published' && priceAdult === 0 && !priceOnRequest) throw new ContentError('Cannot publish a package with ₹0 price. Set a price or mark it as price-on-request.')
    const days = integer(raw.days, 'Days', 1, 60)
    const nights = integer(raw.nights, 'Nights', 0, 60)
    if (nights >= days) throw new ContentError('Nights must be fewer than days.')
    return {
      id: raw.id === undefined ? undefined : integer(raw.id, 'Package ID', 1, 2_147_483_647),
      slug: validateSlug(raw.slug, 'Package slug'), label: text(raw.label, 'Package label', true, 120),
      days, nights, priceAdult, priceOnRequest, status,
      priceBasis: text(raw.priceBasis ?? 'per adult, twin sharing', 'Price basis', true, 300),
      image: imageUrl(raw.image ?? '', 'Package image'), sortOrder: integer(raw.sortOrder ?? 0, 'Sort order', 0, 10_000),
      accommodation: text(raw.accommodation ?? '', 'Accommodation'), notes: text(raw.notes ?? '', 'Notes'),
      itinerary: JSON.stringify(itinerary(jsonValue(raw.itinerary ?? '[]', 'Package itinerary'), 'Package itinerary', status === 'published')),
      inclusions: JSON.stringify(stringList(jsonValue(raw.inclusions ?? '[]', 'Inclusions'), 'Inclusions')),
      exclusions: JSON.stringify(stringList(jsonValue(raw.exclusions ?? '[]', 'Exclusions'), 'Exclusions')),
    }
  })
}

export function validatePackageArray(input: unknown): { ok: true; data: ValidatedPackage[] } | { ok: false; error: string } {
  if (input === undefined) return { ok: true, data: [] }
  if (!Array.isArray(input) || input.length > 100) return { ok: false, error: 'Packages must be an array (max 100).' }

  const out: ValidatedPackage[] = []
  const seenSlugs = new Set<string>()
  const seenIds = new Set<number>()
  for (let i = 0; i < input.length; i++) {
    const r = validateTripPackageInput(input[i])
    if (!r.ok) return { ok: false, error: `Package ${i + 1}: ${r.error}` }
    if (seenSlugs.has(r.data.slug)) return { ok: false, error: `Duplicate package slug "${r.data.slug}".` }
    seenSlugs.add(r.data.slug)
    if (r.data.id !== undefined) {
      if (seenIds.has(r.data.id)) return { ok: false, error: 'Duplicate package ID.' }
      seenIds.add(r.data.id)
    }
    out.push(r.data)
  }
  return { ok: true, data: out }
}

function str(v: unknown): string {
  if (v === undefined || v === null) return ''
  return typeof v === 'string' ? v : String(v)
}
