// Isolated loopback review only: updates an existing fixture draft, never creates/publishes a trek.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { chromium } from '@playwright/test'
import { PrismaClient } from '@prisma/client'
const config = JSON.parse(fs.readFileSync('/tmp/staylocal-phase2-local.json', 'utf8'))
const expected = 'postgresql://phase2_local@127.0.0.1:55482/staylocal_phase2_fixture'
assert.equal(config.url, expected); assert.equal(config.port, 3120)
const base = 'http://localhost:3120', out = 'artifacts/trek-experience'
fs.mkdirSync(out, { recursive: true })
const db = new PrismaClient({ datasources: { db: { url: expected } } }), browser = await chromium.launch({ headless: true })
const digest = data => createHash('sha256').update(JSON.stringify(data)).digest('hex')
const legacy = await db.trip.findMany({ where: { trekContent: null }, include: { packages: true }, orderBy: { id: 'asc' } })
const count = await db.trip.count(), oldHash = digest(legacy)
const report = { localOnly: true, productionChanges: false, published: false, screenshots: [], checks: [] }
const check = value => { report.checks.push(value); console.log(`PASS ${value}`) }
async function shot(page, name) {
  await page.evaluate(async () => { await document.fonts.ready; for (let y = 0; y < document.body.scrollHeight; y += 650) { scrollTo(0, y); await new Promise(r => setTimeout(r, 35)) } scrollTo(0, 0); await new Promise(r => setTimeout(r, 100)) })
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, name)
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: true }); report.screenshots.push(`${name}.png`)
}
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' })
  await context.route('**/*', route => { const r = route.request(), u = new URL(r.url()); return !['localhost', '127.0.0.1'].includes(u.hostname) && !['GET','HEAD'].includes(r.method()) ? route.abort() : route.continue() })
  const page = await context.newPage(), errors = []
  page.on('pageerror', e => errors.push(e.message))
  await page.goto(`${base}/admin/login`)
  await page.getByPlaceholder('Email', { exact: true }).fill(config.email)
  // Avoid logging the secret in a failed locator.fill call.
  await page.getByPlaceholder('Password', { exact: true }).evaluate((node, value) => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(node, value); node.dispatchEvent(new Event('input', { bubbles: true })) }, config.password)
  await page.getByRole('button', { name: 'Sign In', exact: true }).click(); await page.waitForURL('**/admin')
  const ready = await context.request.get(`${base}/api/admin/treks/readiness`)
  assert.equal(ready.status(), 200); assert.deepEqual(await ready.json(), { enabled: true, writable: true, isolatedFixtureReview: true })
  const existing = await db.trip.findFirst({ where: { slug: { contains: 'kedarkantha' } }, orderBy: { id: 'desc' } })
  assert.ok(existing, 'Refuse to create a duplicate: an existing local Kedarkantha fixture is required')
  let trek = await (await context.request.get(`${base}/api/admin/treks/${existing.id}`)).json()
  assert.equal(trek.content.fixture, true); assert.equal(trek.status, 'draft')
  const fixture = JSON.parse(fs.readFileSync('__tests__/fixtures/kedarkantha-design-draft.json', 'utf8'))
  const write = { ...fixture, slug: trek.slug, expectedUpdatedAt: trek.updatedAt }
  const saved = await context.request.put(`${base}/api/admin/treks/${existing.id}`, { data: write })
  assert.equal(saved.status(), 200, await saved.text()); trek = await saved.json()
  assert.equal(trek.status, 'draft'); assert.equal(trek.content.provisional, true)
  assert.equal(trek.startingPrice, null); assert.equal(trek.departures.length, 0); assert.equal(trek.content.preparation.operatorVerified, false)
  assert.equal(trek.options.length, 2); assert.ok(trek.options.every(o => o.sellingPrice === null && !o.priceVerified))
  assert.equal(await db.trip.count(), count)
  check('updated existing isolated Kedarkantha draft; no duplicate, prices, dates, operator confirmation or publication')
  for (const width of [1440, 360]) {
    await page.setViewportSize({ width, height: width === 1440 ? 1000 : 800 })
    await page.goto(`${base}/admin/trips/${trek.id}/edit`, { waitUntil: 'networkidle' })
    for (const [i, name] of ['Overview','Trek facts','Route & itinerary','Media','Departures & pricing','Preparation & safety','FAQs & SEO'].entries()) {
      await page.getByRole('button', { name: new RegExp(`^0${i + 1}.*${name}`) }).click()
      await shot(page, `admin-${i + 1}-${width}`)
    }
  }
  check('all seven existing builder sections and private option-cost editor render at desktop/360px without overflow')
  for (const width of [1440, 390, 360]) {
    await page.setViewportSize({ width, height: width === 1440 ? 1000 : 800 })
    await page.goto(`${base}/admin/trips/${trek.id}/preview`, { waitUntil: 'networkidle' })
    const card = page.getByRole('region', { name: 'Listing card preview' })
    await card.screenshot({ path: `${out}/card-${width}.png` }); report.screenshots.push(`card-${width}.png`)
    const photo = await card.locator('article > a').boundingBox(), title = await card.locator('h2').boundingBox()
    assert.ok(photo.x < title.x)
    await page.getByRole('button', { name: 'Open route illustration and zoom' }).click()
    await page.getByRole('slider', { name: 'Zoom' }).focus(); await page.keyboard.press('Home'); for (let n = 0; n < 4; n++) await page.keyboard.press('ArrowRight')
    assert.equal(await page.locator('dialog[open] img').evaluate(i => i.style.width), '200%')
    await page.screenshot({ path: `${out}/map-zoom-${width}.png` }); report.screenshots.push(`map-zoom-${width}.png`)
    await page.keyboard.press('Escape'); assert.equal(await page.locator('dialog[open]').count(), 0)
    await page.getByRole('button', { name: /02.*Juda Ka Talab/ }).click()
    assert.equal(await page.locator('details').filter({ has: page.getByText('Sankri to Juda Ka Talab', { exact: true }) }).getAttribute('open'), '')
    await shot(page, `detail-${width}`)
    assert.ok(await page.getByText('Private · Admin only', { exact: true }).count() === 0)
    assert.equal(await page.getByRole('button', { name: 'Enquiries disabled in preview' }).isDisabled(), true)
    assert.equal(await page.getByRole('link', { name: /Enquire on WhatsApp/ }).count(), 0)
    assert.ok((await page.locator('article img').evaluateAll(imgs => imgs.filter(i => i.closest('details')?.open !== false && !i.closest('dialog')).every(i => i.complete && i.naturalWidth > 0))))
  }
  check('horizontal cards, original map zoom/Escape, synchronized itinerary, gallery and disabled draft enquiry at desktop/390px/360px')
  const html = await (await context.request.get(`${base}/admin/trips/${trek.id}/preview`)).text()
  assert.match(html, /noindex/); assert.ok(!html.includes('application/ld+json')); assert.ok(html.includes('PROVISIONAL DRAFT'))
  const anonymous = await browser.newContext(), anon = await anonymous.newPage()
  assert.equal((await anonymous.request.get(`${base}/treks/${trek.slug}`)).status(), 404)
  const sitemap = await (await anonymous.request.get(`${base}/sitemap.xml`)).text(); assert.ok(!sitemap.includes(trek.slug))
  await anon.goto(`${base}/treks`, { waitUntil: 'networkidle' }); assert.ok(!(await anon.content()).includes(trek.slug))
  await anon.setViewportSize({ width: 360, height: 800 }); await shot(anon, 'public-listing-empty-360')
  const bookingCount = await db.booking.count()
  const rejected = await anonymous.request.post(`${base}/api/bookings`, { data: { name: 'Local fixture', phone: '9999999999', tripSlug: trek.slug, packageId: trek.packageId, people: 2 } })
  assert.ok(rejected.status() >= 400); assert.equal(await db.booking.count(), bookingCount)
  assert.equal(digest(await db.trip.findMany({ where: { trekContent: null }, include: { packages: true }, orderBy: { id: 'asc' } })), oldHash)
  assert.deepEqual(errors, [])
  check('private preview noindex; fixture absent from public route/listing/sitemap and rejected by enquiries; all legacy tours unchanged')
  report.previewUrl = `${base}/admin/trips/${trek.id}/preview`; report.draftId = trek.id; report.browserErrors = errors
  fs.writeFileSync(`${out}/review.json`, JSON.stringify(report, null, 2) + '\n')
  console.log(JSON.stringify({ checks: report.checks.length, screenshots: report.screenshots.length, preview: report.previewUrl }))
  await context.close(); await anonymous.close()
} finally { await browser.close(); await db.$disconnect() }
