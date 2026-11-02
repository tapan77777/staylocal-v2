// Acceptance harness: loopback fixture DB only; creates drafts, never publishes any record.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import { randomBytes, createHash } from 'node:crypto'
import { chromium } from '@playwright/test'
import { PrismaClient } from '@prisma/client'
const config = JSON.parse(fs.readFileSync('/tmp/staylocal-phase2-local.json', 'utf8'))
const url = 'postgresql://phase2_local@127.0.0.1:55482/staylocal_phase2_fixture'
assert.equal(config.url, url); assert.equal(config.port, 3120)
const base = 'http://localhost:3120', out = 'artifacts/kedarkantha-acceptance'
fs.mkdirSync(out, { recursive: true })
const db = new PrismaClient({ datasources: { db: { url } } })
const browser = await chromium.launch({ headless: true })
let debugPage
const report = { target: base, database: 'isolated loopback fixture database', publishedAnyRecord: false, screenshots: [], checks: [], accessibility: [], performance: [], links: [] }
const hash = x => createHash('sha256').update(JSON.stringify(x)).digest('hex')
const baseline = await db.trip.findMany({ where: { trekContent: null }, include: { packages: true }, orderBy: { id: 'asc' } })
const baselineHash = hash(baseline), initialPublished = await db.trip.findMany({ where: { status: 'published' }, select: { id: true }, orderBy: { id: 'asc' } })
function check(s) { report.checks.push(s); console.log(`PASS ${s}`) }
async function shot(page, name) {
  await page.evaluate(async () => { await document.fonts.ready; for (let y = 0; y < document.body.scrollHeight; y += 650) { scrollTo(0, y); await new Promise(r => setTimeout(r, 35)) } scrollTo(0, 0); await new Promise(r => setTimeout(r, 100)) })
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `overflow: ${name}`)
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: true }); report.screenshots.push(`${name}.png`)
}
async function axe(page, name, selector) {
  await page.addScriptTag({ path: createRequire(import.meta.url).resolve('axe-core/axe.min.js') })
  const result = await page.evaluate(async selector => { const r = await window.axe.run({ include: [selector] }, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } }); return { violations: r.violations.map(v => ({ id: v.id, impact: v.impact, description: v.description, nodes: v.nodes.map(n => ({ target: n.target, summary: n.failureSummary })) })), incomplete: r.incomplete.map(v => v.id), passedRules: r.passes.length } }, selector)
  report.accessibility.push({ page: name, ...result })
  fs.writeFileSync(`${out}/accessibility-progress.json`, JSON.stringify(report.accessibility, null, 2))
}
const steps = ['Overview', 'Trek facts', 'Route & itinerary', 'Media', 'Departures & pricing', 'Preparation & safety', 'FAQs & SEO']
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' })
  let writes = 0
  // Browser cannot publish or send anything to an external service. Mark the first UI draft as a fixture.
  await context.route('**/*', async route => {
    const req = route.request(), target = new URL(req.url())
    if (!['localhost', '127.0.0.1'].includes(target.hostname) && !['GET', 'HEAD'].includes(req.method())) return route.abort()
    if (/\/api\/admin\/treks(?:\/\d+)?$/.test(target.pathname) && ['POST', 'PUT'].includes(req.method())) {
      const payload = req.postDataJSON(); assert.equal(payload.status, 'draft', 'Acceptance browser must never publish')
      payload.content.fixture = true; writes++
      return route.continue({ postData: JSON.stringify(payload) })
    }
    return route.continue()
  })
  const page = await context.newPage(), errors = []
  debugPage = page; page.setDefaultTimeout(12000)
  page.on('pageerror', e => errors.push(e.message))
  await context.addInitScript(() => { window.__metrics = { lcp: null, cls: 0 }; try { new PerformanceObserver(list => { for (const e of list.getEntries()) window.__metrics.lcp = e.startTime }).observe({ type: 'largest-contentful-paint', buffered: true }); new PerformanceObserver(list => { for (const e of list.getEntries()) if (!e.hadRecentInput) window.__metrics.cls += e.value }).observe({ type: 'layout-shift', buffered: true }) } catch {} })
  await page.goto(`${base}/admin/login`)
  await page.getByPlaceholder('Email', { exact: true }).fill(config.email); await page.getByPlaceholder('Password', { exact: true }).fill(config.password)
  await page.getByRole('button', { name: 'Sign In', exact: true }).click(); await page.waitForURL('**/admin')
  const readiness = await context.request.get(`${base}/api/admin/treks/readiness`)
  assert.deepEqual(await readiness.json(), { enabled: true, writable: true, isolatedFixtureReview: true })
  assert.equal((await (await context.request.get(`${base}/api/admin/media`)).json()).uploadsEnabled, false)
  check('independent authenticated fixture isolation and disabled external uploads')
  await page.goto(`${base}/admin/trips/new`); await shot(page, 'create-choice-desktop')
  await page.getByRole('link', { name: /Create Trek/ }).click(); await page.waitForURL('**/admin/trips/new?kind=trek')
  await page.getByRole('button', { name: 'Save draft', exact: true }).click(); await page.locator('p[role=alert]').waitFor(); assert.equal(writes, 0)
  check('empty title fails client validation without a write')
  const title = 'Kedarkantha — acceptance draft (not offered)', slug = `kedarkantha-acceptance-draft-${randomBytes(3).toString('hex')}`
  const fill = async (label, value) => { const exact = page.getByLabel(label, { exact: true }); const target = await exact.count() ? exact : page.getByLabel(label); await target.fill(value) }
  const step = async i => page.getByRole('button', { name: new RegExp(`^0${i + 1}.*${steps[i].replace('&', '&')}`) }).click()
  await fill('Title', title); await page.getByLabel(/^Slug/).fill(slug)
  await fill('Region', 'Uttarakhand · acceptance draft'); await fill('Destination', 'Sankri / Kedarkantha · review only')
  await fill('Short summary', 'A draft journey above Sankri, written for acceptance testing. No departure, price or operator service is offered.')
  await fill('Description', 'Kedarkantha is a Himalayan trekking destination approached from Sankri in Uttarakhand. This proposed six-day outline is test content, not an operator itinerary. Camps, timing, permissions and arrangements still require review. Photographs are existing illustrative assets, not documentation of this route.')
  await fill('Duration in days', '6'); await fill('Highlights', 'Sankri approach\nProposed day-wise story · draft only\nNo confirmed departures or price')
  await step(1); await fill('Basecamp', 'Sankri (approach village; camp arrangements unverified)')
  await fill('Suitability & difficulty context', 'Not assessed by an operator. Difficulty, fitness suitability and season-specific demands require review before publication.')
  await fill('Maximum altitude (metres)', '99999'); await page.getByRole('button', { name: 'Save draft', exact: true }).click(); await page.locator('p[role=alert]').waitFor(); assert.equal(writes, 0); await fill('Maximum altitude (metres)', '')
  check('out-of-range altitude rejected; unknown facts remain empty')
  await step(2); await fill('Textual route overview', 'Proposed review sequence: Sankri → Juda ka Talab → higher camp → Kedarkantha summit attempt → return towards Sankri. Day allocation below is illustrative, not a surveyed route. Coordinates, distances, times and elevations are deliberately absent.')
  const stages = [
    ['Arrive in Sankri — proposed day', 'Sankri', 'TRAVEL', 'Draft arrival day. Transport, accommodation and pickup arrangements have not been contracted.'],
    ['Towards Juda ka Talab — proposed stage', 'Juda ka Talab · proposed stop', 'WALK', 'Draft forest approach stage for reviewing the itinerary interface. Campsite permission, distance and walking time are not confirmed.'],
    ['Towards a higher camp — proposed stage', 'Higher camp · unverified', 'WALK', 'Proposed staging day. Exact campsite and altitude must be supplied by the operator. No route coordinates are available.'],
    ['Kedarkantha summit attempt — proposed stage', 'Return camp · unverified', 'WALK', 'Illustrative summit-attempt day. This is not a summit promise or navigation instruction; the operator must determine the actual plan.'],
    ['Return towards Sankri — proposed stage', 'Sankri · proposed stop', 'WALK', 'Illustrative return stage. The descent route and walking duration remain unverified.'],
    ['Onward journey — proposed day', '', 'TRAVEL', 'Draft departure day. No onward transport or service is included or priced.'],
  ]
  for (let i = 0; i < stages.length; i++) {
    await page.getByRole('button', { name: '+ Add day', exact: true }).click()
    const group = page.locator('fieldset').filter({ has: page.locator('legend', { hasText: new RegExp(`^Day ${i + 1} ·`) }) }).last()
    await group.getByLabel('Stage title', { exact: true }).fill(stages[i][0]); await group.getByLabel('Campsite / overnight stop', { exact: true }).fill(stages[i][1]); await group.locator('select').selectOption(stages[i][2]); await group.getByLabel('Stage description', { exact: true }).fill(stages[i][3])
  }
  await page.getByLabel('Verified latitude', { exact: true }).first().fill('28')
  await page.getByRole('button', { name: 'Save draft', exact: true }).click(); await page.locator('p[role=alert]').waitFor(); assert.equal(writes, 0)
  await page.getByLabel('Verified latitude', { exact: true }).first().fill('')
  check('all six proposed days authored in UI; unpaired coordinate rejected and removed')
  await step(3)
  const photo = async (legend, src, alt) => {
    const group = page.getByRole('group', { name: legend, exact: true })
    await group.getByLabel('Image URL', { exact: true }).fill(src); await group.getByLabel('Alt text', { exact: true }).fill(alt); await group.getByLabel('Caption', { exact: true }).fill('Illustrative existing StayLocal asset · not a verified Kedarkantha photograph.')
  }
  await photo('Hero photograph', '/images/mountain-trail.jpg', 'Illustrative mountain landscape, not a verified Kedarkantha photograph')
  await page.getByRole('button', { name: '+ Add gallery photo', exact: true }).click(); await photo('Gallery photo 1', '/images/himalayan-peaks.jpg', 'Illustrative snowy Himalayan peaks')
  await page.getByRole('button', { name: '+ Add gallery photo', exact: true }).click(); await photo('Gallery photo 2', '/images/mountain-trail.jpg', 'Illustrative mountain forest landscape')
  await page.getByRole('button', { name: '+ Add day photograph', exact: true }).nth(1).click(); await photo('Day 2 photo 1', '/images/mountain-trail.jpg', 'Illustrative forest approach, not a documented trail photo')
  await step(4); await fill('Starting price per person (INR)', '-1'); await page.getByRole('button', { name: 'Save draft', exact: true }).click(); await page.locator('p[role=alert]').waitFor(); assert.equal(writes, 0); await fill('Starting price per person (INR)', '')
  await page.getByRole('button', { name: '+ Add departure', exact: true }).click()
  await fill('Start date', '2030-02-12'); await fill('End date', '2030-02-10')
  await page.getByRole('button', { name: 'Save draft', exact: true }).click(); await page.locator('p[role=alert]').waitFor(); assert.equal(writes, 0)
  await page.getByRole('button', { name: 'Remove unsaved departure', exact: true }).click()
  await fill('Inclusions', 'Draft only: no services have been contracted or included.'); await fill('Exclusions', 'No transport, accommodation, permits or equipment have been quoted.')
  check('invalid price and reversed departure dates rejected; no prices or departures retained')
  await step(5)
  for (const label of ['Fitness requirements', 'Weather & seasons', 'Altitude considerations', 'Terrain & technical demands', 'Emergency arrangements', 'Operator-verified safety details']) await fill(label, `DRAFT — ${label.toLowerCase()} have not been supplied or reviewed by an operator. This entry tests the editor only and is not operational advice.`)
  await fill('Packing list', 'Draft checklist pending operator review; no equipment specification is asserted.')
  await step(6); await page.getByRole('button', { name: '+ Add FAQ', exact: true }).click()
  await fill('Question', 'Can I book this Kedarkantha draft?'); await fill('Answer', 'No. This is a private acceptance-test draft. No price, departure or operator service is offered.')
  await fill('SEO title', 'Kedarkantha acceptance draft · private review'); await fill('Meta description', 'Private test draft for StayLocal trekking acceptance. Not a published or bookable trek.'); await fill('Social preview image URL', '/images/himalayan-peaks.jpg')
  const save = page.waitForResponse(r => /\/api\/admin\/treks$/.test(new URL(r.url()).pathname) && r.request().method() === 'POST')
  await page.getByRole('button', { name: 'Save draft', exact: true }).click(); const saved = await save
  assert.equal(saved.status(), 200, await saved.text()); let trek = await saved.json(); const id = trek.id
  await page.waitForURL(`**/admin/trips/${id}/edit`); assert.equal(trek.status, 'draft'); assert.equal(trek.content.fixture, true)
  assert.equal(trek.startingPrice, null); assert.deepEqual(trek.departures, []); assert.equal(trek.content.preparation.operatorVerified, false)
  check('all seven sections saved through real UI as an explicitly marked, unpriced, departure-free draft')
  await page.goto(`${base}/admin/trips/${id}/edit`); await fill('Short summary', 'Acceptance edit saved: a proposed journey above Sankri. No price, date or operator service is offered.')
  const edit = page.waitForResponse(r => r.url().endsWith(`/api/admin/treks/${id}`) && r.request().method() === 'PUT'); await page.getByRole('button', { name: 'Save draft', exact: true }).click(); const edited = await edit; assert.equal(edited.status(), 200); trek = await edited.json()
  await page.reload(); await page.getByLabel('Short summary').waitFor(); assert.match(await page.getByLabel('Short summary').inputValue(), /Acceptance edit saved/)
  check('edit, save and reload retain draft data')
  for (const width of [1440, 360]) {
    await page.setViewportSize({ width, height: width === 1440 ? 1000 : 800 })
    for (let i = 0; i < steps.length; i++) {
      await step(i); await shot(page, `builder-${String(i + 1).padStart(2, '0')}-${width}`)
      if (width === 1440) { await page.evaluate(() => document.querySelector('nav[aria-label="Trek Builder sections"]').parentElement.setAttribute('data-acceptance-builder', '')); await axe(page, `builder-section-${i + 1}`, '[data-acceptance-builder]') }
    }
  }
  await page.setViewportSize({ width: 1440, height: 1000 }); await step(6)
  await page.evaluate(() => document.querySelector('nav[aria-label="Trek Builder sections"]').parentElement.setAttribute('data-acceptance-builder', ''))
  await axe(page, 'builder-seo', '[data-acceptance-builder]')
  const countBeforePublish = writes
  await page.getByLabel('I reviewed the route, price, dates, media and operator information for publication.', { exact: true }).check()
  await page.getByRole('button', { name: 'Publish trek', exact: true }).click(); await page.locator('p[role=alert]').waitFor(); assert.equal(writes, countBeforePublish)
  await shot(page, 'publication-blocked-desktop')
  await page.getByLabel('I reviewed the route, price, dates, media and operator information for publication.', { exact: true }).uncheck()
  const payload = { title: trek.title, slug: trek.slug, summary: trek.summary, destination: trek.destination, status: 'published', startingPrice: null, content: trek.content, departures: [], expectedUpdatedAt: trek.updatedAt, publishConfirmed: false }
  const blocked = await context.request.put(`${base}/api/admin/treks/${id}`, { data: payload }); assert.equal(blocked.status(), 409)
  const promotion = await context.request.put(`${base}/api/admin/treks/${id}`, { data: { ...payload, status: 'draft', content: { ...trek.content, fixture: false } } }); assert.equal(promotion.status(), 409)
  const stale = await context.request.put(`${base}/api/admin/treks/${id}`, { data: { ...payload, status: 'draft', expectedUpdatedAt: '2020-01-01T00:00:00.000Z' } }); assert.equal(stale.status(), 409)
  check('client publication readiness, server review confirmation, fixture promotion and stale editing fail closed; no publication')
  await page.goto(`${base}/admin/trips/${id}/preview`, { waitUntil: 'networkidle' })
  const previewResponse = await context.request.get(`${base}/admin/trips/${id}/preview`), html = await previewResponse.text()
  assert.match(html, /noindex/); assert.ok(!html.includes('application/ld+json')); for (const [, , , description] of stages) assert.ok(html.includes(description))
  for (const width of [1440, 390, 360]) {
    await page.setViewportSize({ width, height: width === 1440 ? 1000 : 800 }); await page.reload({ waitUntil: 'networkidle' })
    await page.getByRole('button', { name: /02.*Juda ka Talab/ }).click()
    assert.equal(await page.locator('details').nth(1).getAttribute('open'), '')
    await page.locator('details').nth(1).locator('summary').focus(); await page.keyboard.press('Enter')
    assert.equal(await page.locator('details').nth(1).getAttribute('open'), null)
    await page.getByRole('button', { name: /02.*Juda ka Talab/ }).click()
    await shot(page, `kedarkantha-preview-${width}`)
    await page.screenshot({ path: `${out}/kedarkantha-hero-${width}.png`, fullPage: false }); report.screenshots.push(`kedarkantha-hero-${width}.png`)
    assert.equal(await page.getByRole('button', { name: 'Enquiries disabled in preview', exact: true }).isDisabled(), true)
    assert.match(await page.locator('article').textContent(), /A geographic map is not available/)
    assert.equal(await page.locator('svg[aria-label="Interactive route waypoint overview"]').count(), 0)
    const images = await page.locator('article img').evaluateAll(imgs => imgs.map(i => ({ src: i.getAttribute('src'), alt: i.alt, loaded: i.complete && i.naturalWidth > 0 })))
    assert.ok(images.every(i => i.loaded && i.alt), JSON.stringify(images))
    if (width === 360) await axe(page, 'draft-preview-360', 'article')
    report.performance.push({ view: `draft-preview-${width}`, ...(await page.evaluate(() => ({ ...window.__metrics, domContentLoadedMs: performance.getEntriesByType('navigation')[0]?.domContentLoadedEventEnd, resources: performance.getEntriesByType('resource').length, transferBytes: performance.getEntriesByType('resource').reduce((sum, r) => sum + r.transferSize, 0) }))) })
  }
  check('desktop/390px/360px preview, keyboard itinerary, truthful map fallback, gallery images and disabled enquiry')
  const hrefs = await page.locator('article a[href]').evaluateAll(as => as.map(a => a.getAttribute('href')))
  for (const href of [...new Set(hrefs)]) {
    if (href.startsWith('#')) { assert.equal(await page.locator(href).count(), 1); continue }
    if (!href.startsWith('/')) continue
    const response = await context.request.get(`${base}${href}`); report.links.push({ href, status: response.status() }); assert.ok(response.status() < 400)
  }
  const publicContext = await browser.newContext({ viewport: { width: 390, height: 800 } }), pub = await publicContext.newPage()
  assert.equal((await publicContext.request.get(`${base}/treks/${slug}`)).status(), 404)
  assert.equal((await publicContext.request.get(`${base}/api/trips/${slug}`)).status(), 404)
  assert.notEqual((await publicContext.request.get(`${base}/admin/trips/${id}/preview`, { maxRedirects: 0 })).status(), 200)
  const sitemap = await (await publicContext.request.get(`${base}/sitemap.xml`)).text(); assert.ok(!sitemap.includes(slug)); assert.ok(sitemap.includes('/trip/kashmir-valleys-lakes-mountain-escapes'))
  const inventory = await (await publicContext.request.get(`${base}/api/trips`)).json(); const fixtures = await db.trekContent.findMany({ where: { config: { path: ['fixture'], equals: true } }, select: { tripId: true } }); assert.ok(inventory.every(t => !fixtures.some(f => f.tripId === t.id)))
  for (const fixture of fixtures.filter(f => initialPublished.some(t => t.id === f.tripId))) { const t = await db.trip.findUnique({ where: { id: fixture.tripId } }); assert.equal((await publicContext.request.get(`${base}/api/trips/${t.slug}`)).status(), 404) }
  check('public draft/JSON/private-preview isolation, Kashmir sitemap and legacy API fixture exclusion')
  const bookingCount = await db.booking.count()
  const rejectedEnquiry = await publicContext.request.post(`${base}/api/bookings`, { data: { name: 'Draft acceptance', phone: '9999999999', tripSlug: slug, packageId: trek.packageId, people: 2 } }); assert.ok(rejectedEnquiry.status() >= 400); assert.equal(await db.booking.count(), bookingCount)
  check('direct draft enquiry rejected without writing Booking')
  for (const width of [390, 360]) {
    await pub.setViewportSize({ width, height: 800 }); await pub.goto(`${base}/treks`, { waitUntil: 'networkidle' }); assert.ok(!(await pub.content()).includes(slug)); await shot(pub, `listing-${width}`)
    assert.equal(await pub.locator('dialog[open], [role=dialog]').count(), 0)
    report.performance.push({ view: `public-listing-${width}`, profile: 'unthrottled localhost, warm server', ...(await pub.evaluate(() => ({ domContentLoadedMs: performance.getEntriesByType('navigation')[0]?.domContentLoadedEventEnd, resources: performance.getEntriesByType('resource').length, transferBytes: performance.getEntriesByType('resource').reduce((sum, r) => sum + r.transferSize, 0) }))) })
    const card = pub.locator('article').first(); if (await card.count()) { const image = await card.locator(':scope > a').first().boundingBox(), title = await card.locator('h2').boundingBox(); assert.ok(image.x < title.x && image.width < (await card.boundingBox()).width / 2) }
    await pub.getByLabel('Region').selectOption({ index: 1 }); await pub.getByRole('button', { name: 'Find treks', exact: true }).click(); await pub.waitForURL('**/treks?**'); assert.match(pub.url(), /region=/)
  }
  await axe(pub, 'listing-360', 'main')
  await pub.goto(`${base}/treks?region=unavailable-region`, { waitUntil: 'networkidle' }); await pub.getByText('No published treks match these filters.', { exact: false }).waitFor(); await shot(pub, 'listing-empty-360')
  const noJs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 360, height: 800 }, storageState: await context.storageState() })
  const noJsPage = await noJs.newPage(); await noJsPage.goto(`${base}/admin/trips/${id}/preview`); assert.equal(await noJsPage.locator('h1').textContent(), title); assert.ok(await noJsPage.locator('details').count() >= 6); await noJs.close()
  check('horizontal listing cards, GET filters, empty state and no-JavaScript draft preview')
  const liveFixture = await db.trekContent.findFirst({ where: { trip: { status: 'published' }, config: { path: ['fixture'], equals: true } }, include: { trip: true } })
  if (liveFixture) {
    await pub.goto(`${base}/treks/${liveFixture.trip.slug}`, { waitUntil: 'networkidle' })
    await pub.getByLabel('Departure').selectOption({ index: 1 }); await pub.getByLabel('Travellers', { exact: true }).fill('3'); assert.match(await pub.locator('#trek-enquiry').textContent(), /21,600/)
    await pub.getByLabel('Your name', { exact: true }).fill('Isolated acceptance enquiry'); await pub.getByLabel('Phone / WhatsApp', { exact: true }).fill(`98${Date.now().toString().slice(-8)}`)
    const sent = pub.waitForResponse(r => r.url().endsWith('/api/bookings') && r.request().method() === 'POST'); await pub.getByRole('button', { name: 'Send test enquiry', exact: true }).click(); const response = await sent; assert.equal(response.status(), 200); const booking = await response.json(); assert.equal(booking.estimatedPrice, 21600)
    const snapshot = await db.trekEnquiry.findUnique({ where: { bookingId: booking.id } }); assert.equal(snapshot.priceAdult, 7200)
    check('existing labelled local fixture enquiry uses server departure pricing and shared snapshot (Kedarkantha stays draft)')
  }
  for (const t of baseline.filter(t => t.status === 'published')) assert.equal((await publicContext.request.get(`${base}/trip/${t.slug}`)).status(), 200)
  assert.equal((await publicContext.request.get(`${base}/tours`)).status(), 200)
  assert.equal(hash(await db.trip.findMany({ where: { trekContent: null }, include: { packages: true }, orderBy: { id: 'asc' } })), baselineHash)
  assert.deepEqual(await db.trip.findMany({ where: { status: 'published' }, select: { id: true }, orderBy: { id: 'asc' } }), initialPublished)
  assert.equal((await db.trip.findUnique({ where: { id } })).status, 'draft')
  assert.deepEqual(errors, [])
  check('tour records/packages/public URLs unchanged; published ID set unchanged; Kedarkantha remains draft')
  report.draft = { id, slug, title, status: 'draft', preview: `${base}/admin/trips/${id}/preview`, edit: `${base}/admin/trips/${id}/edit`, hasPrice: false, departures: 0, operatorVerified: false }
  report.browserErrors = errors; report.legacyTourSnapshotUnchanged = true
  fs.writeFileSync(`${out}/results.json`, JSON.stringify(report, null, 2) + '\n')
  await context.close(); await publicContext.close()
  console.log(JSON.stringify({ checks: report.checks.length, screenshots: report.screenshots.length, draft: report.draft }))
} catch (error) {
  if (debugPage && !debugPage.isClosed()) { await debugPage.screenshot({ path: `${out}/failure.png`, fullPage: true }); fs.writeFileSync(`${out}/failure-controls.json`, JSON.stringify(await debugPage.locator('label,legend').allTextContents(), null, 2)) }
  throw error
} finally { await browser.close(); await db.$disconnect() }
