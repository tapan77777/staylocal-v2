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
  if (!input || typeof input !== 'object') return { ok: false, error: 'Invalid package.' }
  const raw = input as Record<string, unknown>

  const label = str(raw.label).trim()
  if (label.length < 1 || label.length > 120) return { ok: false, error: 'Package label is required (max 120 chars).' }

  const slug = str(raw.slug).trim().toLowerCase()
  if (!/^[a-z0-9][a-z0-9-]{0,80}$/.test(slug)) return { ok: false, error: `Package slug invalid: "${slug}"` }

  const days = toInt(raw.days)
  if (days === null || days < 1 || days > 60) return { ok: false, error: `Days must be 1–60 (got ${raw.days})` }

  const nights = toInt(raw.nights)
  if (nights === null || nights < 0 || nights > 60) return { ok: false, error: `Nights must be 0–60 (got ${raw.nights})` }

  const priceAdult = toInt(raw.priceAdult)
  if (priceAdult === null || priceAdult < 0 || priceAdult > 10_000_000) return { ok: false, error: 'Price must be between ₹0 and ₹1,00,00,000.' }

  const sortOrder = toInt(raw.sortOrder) ?? 0

  const priceOnRequest = raw.priceOnRequest === true || raw.priceOnRequest === 'true' || raw.priceOnRequest === 1

  const status = str(raw.status).trim() || 'draft'
  if (status !== 'published' && status !== 'draft') return { ok: false, error: 'Package status must be draft or published.' }
  // Safeguard: never publish a zero-priced package unless it's an enquiry-only (price-on-request) listing.
  if (status === 'published' && priceAdult === 0 && !priceOnRequest) {
    return { ok: false, error: 'Cannot publish a package with ₹0 price. Save as draft, set a non-zero price, or mark it as price-on-request.' }
  }

  const priceBasis = str(raw.priceBasis).trim() || 'per adult, twin sharing'
  const image = str(raw.image).trim()
  const accommodation = str(raw.accommodation).trim()
  const notes = str(raw.notes).trim().slice(0, 2000)

  const itinerary = normalizeJsonString(raw.itinerary, '[]')
  const inclusions = normalizeJsonString(raw.inclusions, '[]')
  const exclusions = normalizeJsonString(raw.exclusions, '[]')

  const idRaw = raw.id
  const id = idRaw === undefined || idRaw === null || idRaw === '' ? undefined : toInt(idRaw) ?? undefined

  return {
    ok: true,
    data: {
      id,
      slug,
      label,
      days,
      nights,
      priceAdult,
      priceBasis,
      priceOnRequest,
      image,
      sortOrder,
      status,
      itinerary,
      accommodation,
      inclusions,
      exclusions,
      notes,
    },
  }
}

export function validatePackageArray(input: unknown): { ok: true; data: ValidatedPackage[] } | { ok: false; error: string } {
  if (input === undefined || input === null) return { ok: true, data: [] }
  if (!Array.isArray(input)) return { ok: false, error: 'Packages must be an array.' }

  const out: ValidatedPackage[] = []
  const seenSlugs = new Set<string>()
  for (let i = 0; i < input.length; i++) {
    const r = validateTripPackageInput(input[i])
    if (!r.ok) return { ok: false, error: `Package ${i + 1}: ${r.error}` }
    if (seenSlugs.has(r.data.slug)) return { ok: false, error: `Duplicate package slug "${r.data.slug}".` }
    seenSlugs.add(r.data.slug)
    out.push(r.data)
  }
  return { ok: true, data: out }
}

function str(v: unknown): string {
  if (v === undefined || v === null) return ''
  return typeof v === 'string' ? v : String(v)
}

function toInt(v: unknown): number | null {
  if (v === undefined || v === null || v === '') return null
  const n = typeof v === 'number' ? v : parseInt(String(v), 10)
  return Number.isFinite(n) ? Math.floor(n) : null
}

function normalizeJsonString(v: unknown, fallback: string): string {
  if (v === undefined || v === null || v === '') return fallback
  if (typeof v === 'string') {
    try {
      JSON.parse(v)
      return v
    } catch {
      return fallback
    }
  }
  try {
    return JSON.stringify(v)
  } catch {
    return fallback
  }
}
