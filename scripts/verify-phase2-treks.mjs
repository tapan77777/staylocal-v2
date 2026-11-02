// Real authenticated integration tests against one disposable loopback DB only.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { randomBytes, createHash } from 'node:crypto'
import { chromium } from '@playwright/test'
import { PrismaClient } from '@prisma/client'
const config = JSON.parse(fs.readFileSync('/tmp/staylocal-phase2-local.json', 'utf8'))
const expected = 'postgresql://phase2_local@127.0.0.1:55482/staylocal_phase2_fixture'
assert.equal(config.url, expected)
assert.equal(config.port, 3120)
const base = 'http://localhost:3120'
const db = new PrismaClient({ datasources: { db: { url: expected } } })
const browser = await chromium.launch({ headless: true })
const out = 'artifacts/phase2'
fs.mkdirSync(out, { recursive: true })
const fixture = JSON.parse(fs.readFileSync('__tests__/fixtures/trek-system.json', 'utf8'))
const catalogue = JSON.parse(fs.readFileSync('artifacts/homepage-restoration/reference-data.json', 'utf8')).trips
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex')
const baseline = await db.trip.findMany({ where: { slug: { in: catalogue.map(t => t.slug) } }, include: { packages: true }, orderBy: { id: 'asc' } })
const baselineHash = hash(baseline)
const report = { target: base, database: 'isolated loopback fixture only', fixturesAreSynthetic: true, screenshots: [], checks: [] }
function check(name) { report.checks.push(name); console.log(`PASS ${name}`) }
async function screenshot(page, name, fullPage = true) {
  await page.evaluate(async () => { await document.fonts.ready; for (let y = 0; y < document.body.scrollHeight; y += 650) { scrollTo(0, y); await new Promise(r => setTimeout(r, 50)) } scrollTo(0, 0); await new Promise(r => setTimeout(r, 120)) })
  await page.screenshot({ path: `${out}/${name}.png`, fullPage })
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
  assert.equal(overflow, false, `${name}: overflow`)
  report.screenshots.push(`${name}.png`)
}
function asWrite(t, patch = {}) { return { title: t.title, slug: t.slug, summary: t.summary, destination: t.destination, status: t.status, startingPrice: t.startingPrice, content: t.content, departures: t.departures, expectedUpdatedAt: t.updatedAt, publishConfirmed: false, ...patch } }
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' })
  // Refuse any browser write or navigation to a remote origin.
  await context.route('**/*', route => {
    const request = route.request(), url = new URL(request.url())
    if (!['127.0.0.1', 'localhost'].includes(url.hostname) && !['GET', 'HEAD'].includes(request.method())) return route.abort()
    return route.continue()
  })
  const page = await context.newPage()
  await page.goto(`${base}/admin/login`)
  await page.getByPlaceholder('Email', { exact: true }).fill(config.email)
  await page.getByPlaceholder('Password', { exact: true }).fill(config.password)
  await page.getByRole('button', { name: 'Sign In', exact: true }).click()
  await page.waitForURL('**/admin')
  const readinessResponse = await context.request.get(`${base}/api/admin/treks/readiness`)
  assert.equal(readinessResponse.status(), 200)
  assert.deepEqual(await readinessResponse.json(), { enabled: true, writable: true, isolatedFixtureReview: true })
  check('authenticated independent server confirmation of isolated fixture database before writes')

  // Previous run's synthetic examples may be unpublished, never deleted; no production data is involved.
  const prior = await db.trekContent.findMany({ where: { config: { path: ['fixture'], equals: true } }, include: { trip: true } })
  for (const row of prior.filter(r => r.trip.status === 'published')) {
    const t = await (await context.request.get(`${base}/api/admin/treks/${row.tripId}`)).json()
    const response = await context.request.put(`${base}/api/admin/treks/${row.tripId}`, { data: asWrite(t, { status: 'draft' }) })
    assert.equal(response.status(), 200)
  }
  await page.goto(`${base}/admin/trips/new`)
  await screenshot(page, 'admin-choice-desktop')
  assert.equal(await page.getByRole('link', { name: /Create Trek/ }).count(), 1)
  assert.equal(await page.getByRole('link', { name: /Create Tour/ }).count(), 1)
  await page.getByRole('link', { name: /Create Trek/ }).click()
  await page.waitForURL('**/admin/trips/new?kind=trek')
  await screenshot(page, 'admin-create-trek-desktop')
  await page.getByLabel('Title', { exact: true }).fill(fixture.title)
  fixture.slug += `-${randomBytes(3).toString('hex')}`
  await page.getByLabel(/^Slug/).fill(fixture.slug)
  const draftSaved = page.waitForResponse(r => r.url().endsWith('/api/admin/treks') && r.request().method() === 'POST')
  await page.getByRole('button', { name: 'Save draft', exact: true }).click()
  const firstResponse = await draftSaved
  assert.equal(firstResponse.status(), 200, await firstResponse.text())
  let trek = await firstResponse.json()
  const id = trek.id
  const firstUpdatedAt = trek.updatedAt
  await page.waitForURL(`**/admin/trips/${id}/edit`)
  check('real UI Create Trek → authenticated shared-identity draft save')
  assert.equal((await context.request.get(`${base}/treks/${fixture.slug}`)).status(), 404)
  check('draft trek is not publicly accessible')
  const imported = await context.request.put(`${base}/api/admin/treks/${id}`, { data: { ...fixture, expectedUpdatedAt: trek.updatedAt } })
  assert.equal(imported.status(), 200, await imported.text())
  trek = await imported.json()
  await page.goto(`${base}/admin/trips/${id}/edit`)
  await page.getByRole('button', { name: 'Preview trek', exact: true }).click()
  await page.getByText('Unpublished editor preview', { exact: false }).waitFor()
  assert.equal(await page.getByRole('button', { name: 'Enquiries disabled in preview', exact: true }).isDisabled(), true)
  await screenshot(page, 'admin-trek-preview-desktop')
  await page.getByRole('button', { name: 'Back to Trek Builder', exact: false }).click()
  const savedPreview = await context.request.get(`${base}/admin/trips/${id}/preview`)
  assert.equal(savedPreview.status(), 200)
  assert.match(await savedPreview.text(), /noindex/)
  check('unsaved and authenticated saved previews are private and cannot submit enquiries')
  await page.getByRole('button', { name: /FAQs & SEO/ }).click()
  await page.getByLabel('I reviewed the route, price, dates, media and operator information for publication.').check()
  const publishResponse = page.waitForResponse(r => r.url().endsWith(`/api/admin/treks/${id}`) && r.request().method() === 'PUT')
  await page.getByRole('button', { name: 'Publish trek', exact: true }).click()
  const published = await publishResponse
  assert.equal(published.status(), 200, await published.text())
  trek = await published.json()
  check('reviewed publication through Trek Builder')
  const stale = await context.request.put(`${base}/api/admin/treks/${id}`, { data: { ...fixture, expectedUpdatedAt: firstUpdatedAt } })
  assert.equal(stale.status(), 409)
  const protectedTrip = await db.trip.findUnique({ where: { id } })
  assert.equal((await context.request.put(`${base}/api/admin/trips/${id}`, { data: { expectedUpdatedAt: protectedTrip.updatedAt.toISOString(), title: 'Bypass attempt' } })).status(), 409)
  check('stale edit and legacy Tour Builder bypass rejected')
  const oldSlug = await context.request.put(`${base}/api/admin/treks/${id}`, { data: asWrite(trek, { slug: 'changed-public-url', status: 'draft' }) })
  assert.equal(oldSlug.status(), 409)
  check('existing public slug protected')
  const forbiddenRemoval = await context.request.put(`${base}/api/admin/treks/${id}`, { data: asWrite(trek, { status: 'draft', departures: trek.departures.slice(1) }) })
  assert.equal(forbiddenRemoval.status(), 409)
  assert.equal((await db.trip.findUnique({ where: { id } })).status, 'published')
  check('departure removal rejected and transaction rollback preserves publication')

  await page.goto(`${base}/admin/trips/new?kind=tour`)
  await screenshot(page, 'admin-create-tour-desktop')
  const createdTourPayload = { slug: `tour-builder-test-${randomBytes(4).toString('hex')}`, title: 'Local Tour Builder draft', location: 'Local test destination', category: 'Other', duration: '', price: 0, status: 'draft', type: 'calculator', productKind: 'TOUR' }
  const tourResponse = await context.request.post(`${base}/api/admin/trips`, { data: createdTourPayload })
  assert.equal(tourResponse.status(), 200, await tourResponse.text())
  assert.equal((await db.tripClassification.findUnique({ where: { tripId: (await tourResponse.json()).id } })).kind, 'TOUR')
  check('existing Tour Builder/API still creates an explicitly classified TOUR draft')
  const storage = await context.storageState()
  const mobileAdmin = await browser.newContext({ viewport: { width: 360, height: 800 }, storageState: storage, reducedMotion: 'reduce' })
  const mobile = await mobileAdmin.newPage()
  for (const [name, path] of [['admin-choice-360', '/admin/trips/new'], ['admin-create-trek-360', '/admin/trips/new?kind=trek'], ['admin-create-tour-360', '/admin/trips/new?kind=tour'], ['admin-trek-edit-360', `/admin/trips/${id}/edit`]]) {
    await mobile.goto(`${base}${path}`, { waitUntil: 'networkidle' }); await screenshot(mobile, name)
  }
  for (const [name, button] of [['admin-route-360', /Route & itinerary/], ['admin-media-360', /^04.*Media/], ['admin-departures-360', /Departures & pricing/]]) {
    await mobile.getByRole('button', { name: button }).click(); await screenshot(mobile, name)
  }
  await mobileAdmin.close()

  const publicContext = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' })
  const publicPage = await publicContext.newPage()
  const errors = []
  publicPage.on('pageerror', e => errors.push(e.message))
  await publicPage.goto(`${base}/treks`, { waitUntil: 'networkidle' })
  await screenshot(publicPage, 'treks-desktop')
  await publicPage.getByRole('link', { name: fixture.title, exact: true }).click()
  await publicPage.waitForURL(`**/treks/${fixture.slug}`)
  assert.equal(await publicPage.locator('dialog').count(), 0)
  await publicPage.getByRole('button', { name: /02.*Forest clearing/ }).click()
  const second = publicPage.locator('details').filter({ has: publicPage.getByText(fixture.content.stages[1].title, { exact: true }) })
  assert.equal(await second.getAttribute('open'), '')
  check('interactive route sequence selects the matching itinerary stage')
  await screenshot(publicPage, 'trek-detail-desktop')
  const html = await (await publicContext.request.get(`${base}/treks/${fixture.slug}`)).text()
  for (const stage of fixture.content.stages) assert.ok(html.includes(stage.description), 'Closed-day text present in server HTML')
  assert.match(html, /rel="canonical"/); assert.match(html, /noindex/)
  assert.match(html, /A geographic map is not available/)
  assert.equal((await publicContext.request.get(`${base}/trip/${fixture.slug}`, { maxRedirects: 0 })).status(), 308)
  const sitemap = await (await publicContext.request.get(`${base}/sitemap.xml`)).text()
  assert.ok(!sitemap.includes(fixture.slug), 'Fixtures never enter sitemap')
  assert.ok(sitemap.includes('/trip/kashmir-valleys-lakes-mountain-escapes'))
  check('SSR itinerary, fallback map, fixture noindex/exclusion, canonical alias and Kashmir sitemap')

  for (const width of [360, 390]) {
    await publicPage.setViewportSize({ width, height: 800 })
    await publicPage.goto(`${base}/treks`, { waitUntil: 'networkidle' }); await screenshot(publicPage, `treks-${width}`)
    const card = publicPage.locator('article').filter({ has: publicPage.getByRole('link', { name: fixture.title, exact: true }) }).first()
    const links = card.locator(':scope > a').first()
    const image = await links.boundingBox(), title = await card.locator('h2').boundingBox()
    assert.ok(image.x < title.x && image.width < (await card.boundingBox()).width / 2, 'Image stays LEFT of title')
    await publicPage.goto(`${base}/treks/${fixture.slug}`, { waitUntil: 'networkidle' }); await screenshot(publicPage, `trek-detail-${width}`)
    await publicPage.getByRole('link', { name: 'Enquire about this trek', exact: false }).click()
    const box = await publicPage.locator('#trek-enquiry').boundingBox()
    assert.ok(box.y < 200, 'Mobile action reaches inline enquiry')
  }
  check('360px and 390px horizontal cards, no document overflow, touch-friendly sticky enquiry')
  const noJs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 360, height: 800 } })
  const noJsPage = await noJs.newPage()
  await noJsPage.goto(`${base}/treks?difficulty=Moderate`)
  await noJsPage.getByRole('link', { name: fixture.title, exact: true }).click()
  assert.ok(await noJsPage.locator('h1').isVisible())
  assert.match(await noJsPage.content(), /LOCAL DESIGN FIXTURE/)
  await noJs.close()
  check('GET filters and essential detail content work without JavaScript')

  const confirmed = trek.departures.find(d => d.status === 'CONFIRMED')
  await publicPage.goto(`${base}/treks/${fixture.slug}?departure=${confirmed.id}#trek-enquiry`)
  const form = publicPage.locator('#trek-enquiry')
  await form.getByLabel('Your name', { exact: true }).fill('Local Phase 2 test')
  const phone = `99${Date.now().toString().slice(-8)}`
  await form.getByLabel('Phone / WhatsApp', { exact: true }).fill(phone)
  await form.getByLabel('Travellers', { exact: true }).fill('3')
  assert.match(await form.textContent(), /21,600/)
  const enquiryResponse = publicPage.waitForResponse(r => r.url().endsWith('/api/bookings') && r.request().method() === 'POST')
  await form.getByRole('button', { name: 'Send test enquiry', exact: true }).click()
  const saved = await enquiryResponse
  assert.equal(saved.status(), 200, await saved.text())
  const booking = await saved.json()
  assert.equal(booking.estimatedPrice, 21600)
  const persisted = await db.booking.findUnique({ where: { id: booking.id }, include: { trekEnquiry: true } })
  assert.equal(persisted.packageId, trek.packageId)
  assert.equal(persisted.trekEnquiry.departureId, confirmed.id)
  assert.equal(persisted.trekEnquiry.priceAdult, 7200)
  check('real local enquiry persistence, per-departure server price, shared Booking and selection snapshot')
  await page.goto(`${base}/admin/bookings`)
  const adminRow = page.locator('tr').filter({ hasText: phone })
  assert.match(await adminRow.textContent(), /2027-03-10/)
  assert.match(await adminRow.textContent(), /7,200/)
  assert.match(await adminRow.textContent(), /21,600/)
  await screenshot(page, 'admin-trek-enquiry-desktop')
  check('existing admin Bookings shows selected departure and authoritative price snapshot')
  const enquiryBody = { name: 'Local Phase 2 test', phone, tripSlug: trek.slug, packageId: trek.packageId, people: 3, trekDepartureId: confirmed.id, estimatedPrice: 1 }
  const duplicate = await (await publicContext.request.post(`${base}/api/bookings`, { data: enquiryBody })).json()
  assert.equal(duplicate.duplicate, true); assert.equal(duplicate.estimatedPrice, 21600)
  const full = trek.departures.find(d => d.status === 'FULL')
  assert.equal((await publicContext.request.post(`${base}/api/bookings`, { data: { ...enquiryBody, trekDepartureId: full.id } })).status(), 409)
  const other = await (await context.request.post(`${base}/api/admin/treks`, { data: { ...fixture, title: 'Other private selection fixture', slug: `other-fixture-${randomBytes(4).toString('hex')}` } })).json()
  assert.equal((await publicContext.request.post(`${base}/api/bookings`, { data: { ...enquiryBody, trekDepartureId: other.departures[0].id } })).status(), 400)
  check('tampered estimate ignored; duplicate, full and cross-trip departure protection')

  const beforeEnd = await db.trip.findMany({ where: { slug: { in: catalogue.map(t => t.slug) } }, include: { packages: true }, orderBy: { id: 'asc' } })
  assert.equal(hash(beforeEnd), baselineHash, 'Legacy tour records and packages must remain unchanged')
  assert.equal(await db.tripClassification.count({ where: { tripId: { in: baseline.map(t => t.id) } } }), 0, 'Legacy tours are not automatically classified')
  assert.deepEqual(errors, [])
  report.exampleUrl = `${base}/treks/${trek.slug}`
  report.exampleTripId = id
  report.legacyTourSnapshotUnchanged = true
  report.browserErrors = errors
  check('all copied legacy tour scalars/packages unchanged; ambiguous records remain unclassified')
  await publicPage.goto(`${base}/treks?region=unavailable-region`)
  await publicPage.getByText('No published treks match these filters.', { exact: false }).waitFor()
  await screenshot(publicPage, 'treks-empty-390')
  assert.equal((await publicContext.request.get(`${base}/tours`)).status(), 200)
  for (const trip of baseline.filter(t => t.status === 'published')) assert.equal((await publicContext.request.get(`${base}/trip/${trip.slug}`)).status(), 200)
  await publicPage.goto(`${base}/tours`)
  await screenshot(publicPage, 'tours-preserved-390')
  check('tour discovery and every copied published tour URL still respond successfully')
  await context.close(); await publicContext.close()
  fs.writeFileSync(`${out}/workflow-verification.json`, JSON.stringify(report, null, 2) + '\n')
  console.log(JSON.stringify({ checks: report.checks.length, exampleUrl: report.exampleUrl, screenshots: report.screenshots.length }))
} finally { await browser.close(); await db.$disconnect() }
