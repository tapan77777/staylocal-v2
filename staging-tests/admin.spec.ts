import { test, expect, type APIRequestContext, type BrowserContext } from '@playwright/test'
import { randomUUID } from 'node:crypto'

// No default target and no default credentials. No .env.local loading.
let base: string
const slug = `staging-${randomUUID()}`
let admin: BrowserContext
let editor: BrowserContext
let trip: Record<string, any>
let second: Record<string, any>
let universalTrip: Record<string, any>
let bookingId: number | undefined
const fixture = (tripSlug: string) => ({
  slug: tripSlug, title: 'Isolated staging fixture', location: 'Test destination', category: 'Mountains',
  duration: '1 day', price: 10000, image: '/travel/cover.jpg', status: 'draft',
  packages: [{ slug: 'standard', label: 'Standard', days: 1, nights: 0, priceAdult: 10000, status: 'published',
    itinerary: JSON.stringify([{ day: 'Day 1', title: 'Fixture day', desc: 'Staging only itinerary.' }]) }],
})
async function login(context: BrowserContext, role: 'ADMIN' | 'EDITOR') {
  const email = process.env[`STAGING_${role}_EMAIL`]
  const password = process.env[`STAGING_${role}_PASSWORD`]
  if (!email || !password) throw new Error('Dedicated staging credentials are required.')
  const page = await context.newPage()
  await page.goto(`${base}/admin/login`)
  await page.getByPlaceholder('Email', { exact: true }).fill(email)
  // Avoid a fill(secret) call whose argument can appear in locator failure logs.
  await page.getByPlaceholder('Password', { exact: true }).evaluate((element, value) => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
    if (!(element instanceof HTMLInputElement) || !setter) throw new Error('Login input unavailable.')
    setter.call(element, value)
    element.dispatchEvent(new Event('input', { bubbles: true }))
  }, password)
  await page.getByRole('button', { name: 'Sign In', exact: true }).click()
  await page.waitForURL(`${base}/admin`)
  const session = await context.request.get(`${base}/api/auth/session`)
  expect((await session.json()).user.role).toBe(role.toLowerCase())
  await page.close()
}
async function write(request: APIRequestContext, path: string, method: string, data?: unknown) {
  return request.fetch(`${base}${path}`, { method, data, headers: { origin: base }, maxRedirects: 0 })
}
test.beforeAll(async ({ browser, request }) => {
  const raw = process.env.STAGING_BASE_URL
  const approvedHost = process.env.STAGING_APPROVED_HOST
  if (!raw || process.env.STAGING_ALLOW_WRITES !== 'yes') throw new Error('Explicit isolated staging target and write approval are required.')
  const url = new URL(raw)
  if (url.protocol !== 'https:' || url.hostname !== approvedHost || url.username || url.password || url.pathname !== '/' || url.search || url.hash || url.hostname === 'staylocal-v2.vercel.app') {
    throw new Error('Unsafe staging target refused.')
  }
  base = url.origin
  // This must pass BEFORE any login or write. Production returns 404.
  const preflight = await request.get(`${base}/api/preview-readiness`, { maxRedirects: 0 })
  expect(preflight.status()).toBe(200)
  const identity = await preflight.json()
  if (!process.env.STAGING_DATABASE_ID || identity.environment !== 'preview' || identity.databaseId !== process.env.STAGING_DATABASE_ID) throw new Error('Staging database identity mismatch.')
  admin = await browser.newContext()
  editor = await browser.newContext()
  await login(admin, 'ADMIN')
  await login(editor, 'EDITOR')
})
test.afterAll(async () => {
  // Delete only fixtures created by this run. Enquiries are retained for inspection.
  if (admin) for (const row of [trip, second, universalTrip]) {
    if (row?.id && String(row.slug).startsWith(slug)) {
      const response = await write(admin.request, `/api/admin/trips/${row.id}`, 'DELETE')
      expect(response.status()).toBe(200)
    }
  }
  await admin?.close(); await editor?.close()
})

test('universal draft, administrator activation, public server quote and enquiry', async ({ request }) => {
  const availability = await admin.request.get(`${base}/api/admin/trips/new/universal`)
  expect(availability.status()).toBe(200)
  expect((await availability.json()).available).toBe(true)
  const config = {
    version: 1, maxPeople: 50, defaultPackageSlug: 'standard',
    durations: [{ id: 'one-day', label: '1D/0N', sub: '', image: '' }], tiers: [],
    offers: [{ packageSlug: 'standard', durationId: 'one-day', tierId: null, comparison: null, rules: [], stays: [], rounding: 'total', promo: null }],
  }
  const created = await write(editor.request, '/api/admin/trips', 'POST', {
    ...fixture(`${slug}-universal`), universal: { config, enabled: false, expectedUpdatedAt: null },
  })
  expect(created.status()).toBe(200); universalTrip = await created.json()
  const metadata = await (await admin.request.get(`${base}/api/admin/trips/${universalTrip.id}/universal`)).json()
  const edit = { status: 'published', publishConfirmed: true, expectedUpdatedAt: universalTrip.updatedAt, universal: { config, enabled: true, expectedUpdatedAt: metadata.expectedUpdatedAt } }
  expect((await write(editor.request, `/api/admin/trips/${universalTrip.id}`, 'PUT', edit)).status()).toBe(403)
  const activated = await write(admin.request, `/api/admin/trips/${universalTrip.id}`, 'PUT', edit)
  expect(activated.status()).toBe(200); universalTrip = await activated.json()
  expect((await request.get(`${base}/trip/${universalTrip.slug}`)).status()).toBe(200)
  const quoted = await write(request, `/api/trips/${universalTrip.slug}/quote`, 'POST', { packageSlug: 'standard', people: 4, promoCode: '' })
  expect(quoted.status()).toBe(200)
  expect((await quoted.json()).total).toBe(40000)
  const enquiry = await write(request, '/api/bookings', 'POST', {
    name: 'Isolated universal fixture', phone: '9999999999', tripSlug: universalTrip.slug,
    packageId: universalTrip.packages[0].id, people: 4, estimatedPrice: 1,
    universalSelection: { packageSlug: 'standard', promoCode: '' },
  })
  expect(enquiry.status()).toBe(200)
  expect((await enquiry.json()).estimatedPrice).toBe(40000)
})
test('authenticated roles, wizard, trip lifecycle, ownership and booking transitions', async ({ request }) => {
  expect((await write(request, '/api/admin/trips', 'POST', fixture(slug))).status()).toBe(401)
  expect((await editor.request.get(`${base}/api/bookings`)).status()).toBe(403)
  const page = await editor.newPage()
  await page.goto(`${base}/admin/trips/new`)
  await page.getByLabel(/Trip title/).fill('Unsaved staging wizard')
  await page.getByRole('button', { name: /Photos/ }).click()
  await page.getByRole('button', { name: /Basics/ }).click()
  await expect(page.getByLabel(/Trip title/)).toHaveValue('Unsaved staging wizard')
  await page.close()

  const create = await write(editor.request, '/api/admin/trips', 'POST', fixture(slug))
  expect(create.status()).toBe(200); trip = await create.json()
  expect((await request.get(`${base}/trip/${slug}`)).status()).toBe(404)
  const createSecond = await write(editor.request, '/api/admin/trips', 'POST', fixture(`${slug}-other`))
  expect(createSecond.status()).toBe(200); second = await createSecond.json()
  expect((await write(editor.request, `/api/admin/trips/${trip.id}`, 'DELETE')).status()).toBe(403)
  const edit = async (data: unknown) => write(editor.request, `/api/admin/trips/${trip.id}`, 'PUT', data)
  const version = trip.updatedAt
  const update = await edit({ title: 'Edited staging fixture', expectedUpdatedAt: version })
  expect(update.status()).toBe(200); trip = await update.json()
  expect((await edit({ title: 'Stale edit', expectedUpdatedAt: version })).status()).toBe(409)
  expect((await edit({ price: -1, expectedUpdatedAt: trip.updatedAt })).status()).toBe(400)
  const foreignPackage = { ...fixture(slug).packages[0], id: second.packages[0].id }
  expect((await edit({ packages: [foreignPackage], expectedUpdatedAt: trip.updatedAt })).status()).toBe(400)
  const packages = trip.packages.map((p: any) => ({ ...fixture(slug).packages[0], id: p.id, label: 'Updated package' }))
  const published = await edit({ packages, status: 'published', publishConfirmed: true, expectedUpdatedAt: trip.updatedAt })
  expect(published.status()).toBe(200); trip = await published.json()
  expect(trip.packages[0].label).toBe('Updated package')
  const publicPage = await request.get(`${base}/trip/${slug}`)
  expect(publicPage.status()).toBe(200)
  expect(await publicPage.text()).toContain('Updated package')
  const enquiry = await write(request, '/api/bookings', 'POST', {
    name: 'Staging fixture', phone: '9999999999', email: 'fixture@example.test', people: 2,
    tripSlug: slug, packageId: trip.packages[0].id, message: 'Isolated staging test only',
  })
  expect(enquiry.status()).toBe(200); bookingId = (await enquiry.json()).id
  if (!bookingId) throw new Error('Fixture booking was not created.')
  expect((await write(editor.request, `/api/admin/bookings/${bookingId}`, 'PATCH', { status: 'confirmed' })).status()).toBe(403)
  expect((await write(admin.request, `/api/admin/bookings/${bookingId}`, 'PATCH', { status: 'invalid' })).status()).toBe(400)
  expect((await write(admin.request, `/api/admin/bookings/${bookingId}`, 'PATCH', { status: 'confirmed' })).status()).toBe(200)
  expect((await write(admin.request, `/api/admin/bookings/${bookingId}`, 'PATCH', { status: 'pending' })).status()).toBe(409)
  expect((await write(admin.request, `/api/admin/bookings/${bookingId}`, 'PATCH', { status: 'cancelled' })).status()).toBe(200)
  const draft = await edit({ status: 'draft', expectedUpdatedAt: trip.updatedAt })
  expect(draft.status()).toBe(200); trip = await draft.json()
  expect((await request.get(`${base}/trip/${slug}`)).status()).toBe(404)
  const noPackages = await edit({ packages: [], removedPackageIds: trip.packages.map((p: any) => p.id), expectedUpdatedAt: trip.updatedAt })
  expect(noPackages.status()).toBe(200); trip = await noPackages.json()
  expect(trip.packages).toHaveLength(0)
  expect((await edit({ status: 'published', publishConfirmed: true, expectedUpdatedAt: trip.updatedAt })).status()).toBe(422)
})
