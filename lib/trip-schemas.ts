import { z } from 'zod'

export const safeImageUrl = z.string().max(2048).refine(value => {
  if (!value) return true
  if (/^\/(?!\/)/.test(value) && !value.includes('\\')) return true
  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password
  } catch { return false }
}, 'Use an HTTP(S) image URL or a local image path.')

const numberInput = z.union([z.number().int(), z.string().regex(/^\d+$/)]).refine(v => Number(v) >= 0 && Number(v) <= 10_000_000, 'Use a whole number between 0 and 10,000,000.')
const json = z.string().max(100_000)
const optionalText = z.string().max(2000).optional()
export const tripInputSchema = z.strictObject({
  slug: z.string().max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  title: z.string().max(200).optional(), subtitle: optionalText, location: z.string().max(300).optional(),
  category: z.string().max(120).optional(), duration: z.string().max(120).optional(), difficulty: optionalText,
  route: optionalText, price: numberInput.optional(), status: z.enum(['draft', 'published']).optional(),
  type: z.enum(['calculator', 'enquiry', 'andaman']).optional(), image: safeImageUrl.optional(),
  gallery: json.optional(), highlights: json.optional(), included: json.optional(), notIncluded: json.optional(),
  faqs: json.optional(), pricing: json.optional(), itinerary: json.optional(), tierDetails: json.optional(),
  durLabels: json.optional(), durSubLabels: json.optional(), packages: z.array(z.unknown()).max(100).optional(),
})
export const packageInputSchema = z.strictObject({
  id: numberInput.optional(), slug: z.string().max(80), label: z.string().min(1).max(120),
  days: numberInput, nights: numberInput, priceAdult: numberInput, priceBasis: z.string().max(300).optional(),
  priceOnRequest: z.union([z.boolean(), z.literal('true'), z.literal('false'), z.literal(0), z.literal(1)]).optional(),
  image: safeImageUrl.optional(), sortOrder: numberInput.optional(), status: z.enum(['draft', 'published']).optional(),
  itinerary: json.optional(), inclusions: json.optional(), exclusions: json.optional(),
  accommodation: optionalText, notes: optionalText,
})
export const daySchema = z.strictObject({ day: z.string().trim().min(1).max(120), title: z.string().trim().min(1).max(300), desc: z.string().max(10_000) })
export const faqSchema = z.strictObject({ q: z.string().trim().min(1).max(2000), a: z.string().trim().min(1).max(10_000) })
export const writeMetadataSchema = z.strictObject({
  expectedUpdatedAt: z.iso.datetime().optional(),
  removedPackageIds: z.array(z.number().int().positive()).max(100).default([]),
  publishConfirmed: z.boolean().default(false),
  universal: z.unknown().optional(),
})

export function splitWriteMetadata(input: unknown) {
  const record = z.record(z.string(), z.unknown()).safeParse(input)
  if (!record.success) return { ok: false as const, error: 'Body must be an object.' }
  const { expectedUpdatedAt, removedPackageIds, publishConfirmed, universal, ...body } = record.data
  const metadata = writeMetadataSchema.safeParse({ expectedUpdatedAt, removedPackageIds, publishConfirmed, universal })
  if (!metadata.success) return { ok: false as const, error: 'Invalid save confirmation or edit version. Reload the builder.' }
  return { ok: true as const, body, metadata: metadata.data }
}
