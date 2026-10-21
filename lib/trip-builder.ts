import type { Trip } from '@prisma/client'
import type { PackageDraft } from '@/components/admin/PackagesEditor'
import { validateTripInput } from '@/lib/content-validation'
import { validatePackageArray } from '@/lib/validation'
import { publishProblems } from '@/lib/trip-publish'
import { universalProblems, universalSchema, type UniversalConfig } from '@/lib/universal-trip'

export type TripBuilderForm = Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>
export type TripBuilderRecord = TripBuilderForm & { id: number; updatedAt?: Date | string; packages?: (Partial<PackageDraft> & Pick<PackageDraft, 'slug' | 'label' | 'days' | 'nights' | 'priceAdult'>)[] }
export interface BuilderState { form: TripBuilderForm; packages: PackageDraft[]; universal?: { config: UniversalConfig; enabled: boolean; expectedUpdatedAt: string | null; migrationConfirmed?: boolean } }
export const builderSteps = ['Basics', 'Photos', 'Packages & Itinerary', 'Trip Details', 'Review & Publish']

export function slugify(title: string) {
  return title.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80).replace(/-$/, '')
}

export function readJson<T>(value: string, fallback: T): T {
  try { return JSON.parse(value) as T } catch { return fallback }
}

export function initialBuilder(trip?: TripBuilderRecord): BuilderState {
  return {
    form: {
      slug: trip?.slug ?? '', title: trip?.title ?? '', subtitle: trip?.subtitle ?? '', location: trip?.location ?? '',
      category: trip?.category ?? 'Mountains', duration: trip?.duration ?? '', difficulty: trip?.difficulty ?? 'Easy',
      price: trip?.price ?? 0, status: trip?.status ?? 'draft', image: trip?.image ?? '', gallery: trip?.gallery ?? '[]',
      route: trip?.route ?? '', highlights: trip?.highlights ?? '[]', included: trip?.included ?? '[]',
      notIncluded: trip?.notIncluded ?? '[]', faqs: trip?.faqs ?? '[]', type: trip?.type ?? 'calculator',
      pricing: trip?.pricing ?? '[]', itinerary: trip?.itinerary ?? '[]', tierDetails: trip?.tierDetails ?? '[]',
      durLabels: trip?.durLabels ?? '[]', durSubLabels: trip?.durSubLabels ?? '[]',
    },
    packages: (trip?.packages ?? []).map((p, i) => ({
      id: p.id, slug: p.slug, label: p.label, days: p.days, nights: p.nights, priceAdult: p.priceAdult,
      priceBasis: p.priceBasis ?? 'per adult, twin sharing', priceOnRequest: p.priceOnRequest ?? false,
      image: p.image ?? '', sortOrder: p.sortOrder ?? i, status: p.status ?? 'draft', itinerary: p.itinerary ?? '[]',
      accommodation: p.accommodation ?? '', inclusions: p.inclusions ?? '[]', exclusions: p.exclusions ?? '[]', notes: p.notes ?? '',
    })),
  }
}

export function builderPayload(state: BuilderState, status: 'draft' | 'published', original?: TripBuilderRecord, confirmed = false) {
  return {
    ...state.form, status, publishConfirmed: confirmed,
    ...(state.universal ? { universal: state.universal } : {}),
    ...(original?.updatedAt ? { expectedUpdatedAt: new Date(original.updatedAt).toISOString() } : {}),
    ...(state.form.type === 'andaman' ? {} : {
      packages: state.packages,
      removedPackageIds: (original?.packages ?? []).flatMap(p => p.id && !state.packages.some(current => current.id === p.id) ? [p.id] : []),
    }),
  }
}

export function builderIssues(state: BuilderState, status: 'draft' | 'published', original?: TripBuilderRecord) {
  const errors: string[] = []
  const trip = validateTripInput({ ...state.form, status })
  const packages = validatePackageArray(state.packages)
  if (!trip.ok) errors.push(trip.error)
  if (!packages.ok) errors.push(packages.error)
  if (status === 'published' && trip.ok && packages.ok) errors.push(...publishProblems(trip.data, packages.data, original))
  if (state.universal) {
    if (!original && status === 'published' && !state.universal.enabled) errors.push('An administrator must activate the universal experience before this new trip is published.')
    const config = universalSchema.safeParse(state.universal.config)
    if (!config.success) errors.push(`Check universal trip fields: ${config.error.issues[0]?.path.join(' → ') || 'content size'}.`)
    else errors.push(...universalProblems(config.data, state.packages, status === 'published' && state.universal.enabled))
  }
  return errors
}

export function durationSummary(packages: Pick<PackageDraft, 'days' | 'nights'>[]) {
  if (!packages.length) return ''
  const days = packages.map(p => p.days)
  if (Math.min(...days) === Math.max(...days)) return `${packages[0].days} ${packages[0].days === 1 ? 'day' : 'days'} · ${packages[0].nights} ${packages[0].nights === 1 ? 'night' : 'nights'}`
  return `${Math.min(...days)}–${Math.max(...days)} days`
}

export function moveItem<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const to = index + direction
  if (to < 0 || to >= items.length) return items
  const next = [...items]
  ;[next[index], next[to]] = [next[to], next[index]]
  return next
}
