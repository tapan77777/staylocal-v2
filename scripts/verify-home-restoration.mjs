// Local production-server review only. All browser API writes are intercepted.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { chromium } from '@playwright/test'

const base = process.argv[2] || 'http://127.0.0.1:3116'
assert.ok(['127.0.0.1', 'localhost'].includes(new URL(base).hostname), 'Review must target localhost')
const output = 'artifacts/homepage-restoration'
fs.mkdirSync(output, { recursive: true })
const trips = await (await fetch(`${base}/api/trips`)).json()
assert.ok(Array.isArray(trips) && trips.length, 'Published catalogue must be readable')
const sitemapResponse = await fetch(`${base}/sitemap.xml`)
assert.equal(sitemapResponse.status, 200)
const sitemap = await sitemapResponse.text()
for (const path of ['/treks', '/tours', ...trips.map(t => `/trip/${t.slug}`)]) assert.ok(sitemap.includes(path), `Sitemap: ${path}`)
const routes = []
for (const path of ['/', '/treks', '/tours', '/trips', ...trips.map(t => `/trip/${t.slug}`), '/trip/staylocal-nonexistent-trip']) {
  const response = await fetch(`${base}${path}`)
  const html = await response.text()
  const missing = path.endsWith('/staylocal-nonexistent-trip')
  assert.equal(response.status, missing ? 404 : 200, path)
  if (!missing) {
    assert.equal((html.match(/<h1[\s>]/g) || []).length, 1, `${path}: server-rendered H1`)
    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1]
    assert.ok(canonical, `${path}: canonical`)
    assert.equal(new URL(canonical).pathname, path, `${path}: self canonical`)
    assert.ok(html.includes('name="description"'), `${path}: description`)
    assert.ok(html.includes('name="robots" content="index, follow"'), `${path}: indexable`)
  }
  routes.push({ path, status: response.status, title: html.match(/<title>(.*?)<\/title>/)?.[1], canonical: html.match(/<link rel="canonical" href="([^"]+)"/)?.[1] })
}
const browser = await chromium.launch({ headless: true })
const checks = []
try {
  for (const [device, width, height] of [['desktop', 1440, 1000], ['mobile', 390, 844]]) {
    const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 })
    await context.route('**/api/**', route => ['GET', 'HEAD'].includes(route.request().method()) ? route.continue() : route.abort())
    for (const [name, path] of [['home', '/'], ['treks', '/treks'], ['tours', '/tours']]) {
      const page = await context.newPage()
      await page.emulateMedia({ reducedMotion: 'reduce' })
      const errors = []
      page.on('pageerror', error => errors.push(error.message))
      await page.goto(`${base}${path}`, { waitUntil: 'domcontentloaded' })
      if (name === 'home') {
        const bounds = await page.locator('main > section').first().boundingBox()
        const welcome = page.getByRole('dialog', { name: 'What would you like to explore?' })
        await welcome.waitFor({ state: 'visible' })
        await page.evaluate(() => document.fonts.ready)
        assert.equal(await welcome.evaluate(d => d.matches(':modal')), true)
        const after = await page.locator('main > section').first().boundingBox()
        assert.equal(bounds.x, after.x, 'Popup must not shift hero horizontally')
        assert.equal(bounds.width, after.width, 'Popup must not resize content')
        const close = welcome.getByRole('button', { name: 'Close welcome popup' })
        await close.focus()
        for (let tab = 0; tab < 8; tab++) {
          await page.keyboard.press('Tab')
          assert.equal(await welcome.evaluate(d => d.contains(document.activeElement)), true, 'Focus stays inside the dialog')
        }
        await page.screenshot({ path: `${output}/welcome-${device}.png` })
        await welcome.getByRole('button', { name: 'Explore Everything' }).click()
        assert.equal(new URL(page.url()).pathname, '/', 'Everything stays on homepage')
        await welcome.waitFor({ state: 'hidden' })
        await page.waitForFunction(() => document.documentElement.style.overflow === '')
      }
      await page.waitForLoadState('networkidle')
      await page.evaluate(async () => { await document.fonts.ready; for (let y = 0; y < document.body.scrollHeight; y += 650) { window.scrollTo(0, y); await new Promise(resolve => setTimeout(resolve, 60)) } window.scrollTo(0, 0) })
      await page.waitForTimeout(300)
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
      const brokenImages = await page.locator('img').evaluateAll(images => images.filter(i => !i.complete || !i.naturalWidth).map(i => i.currentSrc))
      assert.equal(overflow, false, `${name}/${device}: horizontal overflow`)
      assert.deepEqual(errors, [], `${name}/${device}: browser errors`)
      assert.deepEqual(brokenImages, [], `${name}/${device}: images`)
      assert.equal(await page.locator('dialog[open]').count(), 0, 'No unexpected open welcome dialog')
      if (width < 768) await page.getByRole('button', { name: 'Open menu', exact: true }).click()
      for (const label of ['Home', 'Treks', 'Tours', 'About', 'Contact']) assert.equal(await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: label, exact: true }).isVisible(), true)
      if (width < 768) await page.getByRole('button', { name: 'Close menu', exact: true }).click()
      await page.screenshot({ path: `${output}/${name}-${device}.png`, fullPage: true })
      if (name === 'home') {
        for (const slug of ['billing', 'rishikesh', 'simlipal', 'jibhi-waterfalls']) assert.equal(await page.locator(`a[href="/trip/${slug}"]`).count(), 0)
        await page.getByRole('navigation', { name: 'Explore journeys' }).getByRole('link', { name: /Explore Treks/ }).click()
        await page.waitForURL('**/treks')
        assert.equal(await page.locator('dialog').count(), 0)
        await page.goto(base)
        await page.waitForTimeout(1000)
        assert.equal(await page.locator('dialog[open]').count(), 0, 'Same session must not reopen welcome')
      }
      checks.push({ name, device, width, overflow, errors, brokenImages, screenshot: `${name}-${device}.png` })
      await page.close()
    }
    await context.close()
  }
  const narrow = await browser.newContext({ viewport: { width: 320, height: 740 } })
  await narrow.addInitScript(() => sessionStorage.setItem('staylocal:welcome-seen:v1', '1'))
  const narrowPage = await narrow.newPage()
  for (const path of ['/', '/treks', '/tours']) {
    await narrowPage.goto(`${base}${path}`, { waitUntil: 'domcontentloaded' })
    assert.equal(await narrowPage.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${path}: 320px overflow`)
  }
  await narrow.close()
  // With JavaScript disabled, content, navigation and package links must still work.
  const noJs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } })
  const page = await noJs.newPage()
  for (const path of ['/', '/treks', '/tours']) {
    await page.goto(`${base}${path}`)
    assert.equal(await page.locator('h1').isVisible(), true)
    assert.ok(await page.locator('a[href="/tours"]').count())
    assert.equal(await page.locator('dialog[open]').count(), 0)
    if (path !== '/') assert.ok(await page.locator('a[href^="/trip/"]').count(), `${path}: package links without JS`)
  }
  await page.goto(base)
  await page.getByRole('navigation', { name: 'Explore journeys' }).getByRole('link', { name: /Explore Treks/ }).click()
  assert.equal(new URL(page.url()).pathname, '/treks')
  await noJs.close()

  // Test the existing enquiry UI against an intercepted success, never a database write.
  const enquiry = await browser.newContext({ viewport: { width: 390, height: 844 } })
  await enquiry.addInitScript(() => sessionStorage.setItem('staylocal:welcome-seen:v1', '1'))
  let payload
  await enquiry.route('**/api/**', route => {
    if (route.request().method() === 'POST' && new URL(route.request().url()).pathname === '/api/bookings') {
      payload = route.request().postDataJSON()
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, id: 'local-ui-review' }) })
    }
    return ['GET', 'HEAD'].includes(route.request().method()) ? route.continue() : route.abort()
  })
  const form = await enquiry.newPage()
  await form.goto(`${base}/#enquiry`)
  const section = form.locator('#enquiry')
  await section.locator('input').nth(0).fill('Local UI review')
  await section.locator('input').nth(1).fill('9999999999')
  await section.locator('select').nth(0).selectOption(trips[0].slug)
  await section.getByRole('button', { name: /Submit enquiry/ }).click()
  await form.getByText('Enquiry received', { exact: true }).waitFor()
  assert.equal(payload.tripSlug, trips[0].slug)
  assert.equal(payload.people, 2)
  await enquiry.close()
  const welcomeActions = []
  for (const action of ['Explore Treks', 'Explore Tours', 'Close welcome popup', 'Escape', 'Backdrop']) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
    await context.route('**/api/**', route => ['GET', 'HEAD'].includes(route.request().method()) ? route.continue() : route.abort())
    const page = await context.newPage()
    await page.goto(base, { waitUntil: 'domcontentloaded' })
    const dialog = page.getByRole('dialog', { name: 'What would you like to explore?' })
    await dialog.waitFor({ state: 'visible' })
    if (action === 'Escape') await page.keyboard.press('Escape')
    else if (action === 'Backdrop') await page.mouse.click(4, 4)
    else if (action.startsWith('Explore')) await dialog.getByRole('link', { name: action, exact: true }).click()
    else await dialog.getByRole('button', { name: action, exact: true }).click()
    if (action === 'Explore Treks') await page.waitForURL('**/treks')
    else if (action === 'Explore Tours') await page.waitForURL('**/tours')
    else { await dialog.waitFor({ state: 'hidden' }); assert.equal(new URL(page.url()).pathname, '/') }
    await page.goto(base)
    await page.waitForTimeout(1000)
    assert.equal(await page.locator('dialog[open]').count(), 0, `${action}: session dismissal persists after reload`)
    welcomeActions.push({ action, passed: true })
    await context.close()
  }
  // A fresh session entering a detail or hub directly must never see the welcome.
  for (const path of ['/treks', '/tours', `/trip/${trips[0].slug}`]) {
    const context = await browser.newContext()
    const page = await context.newPage()
    await page.goto(`${base}${path}`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(1000)
    assert.equal(await page.locator('dialog').count(), 0, `${path}: no welcome component`)
    await context.close()
  }
  const report = { welcomeActions, welcomeSession: 'passed: initial visit, focus trap, dismissal, reload, navigation, fresh session', layoutShiftGuard: 'hero x and width unchanged on opening at desktop and mobile', target: base, reviewedAt: new Date().toISOString(), dataSource: 'Current configured published catalogue, read-only; no production writes', routes, checks, narrowMobile320px: 'passed', noJavaScript: 'passed', enquiryUi: 'passed with intercepted response; no persistence test', sitemap: { publishedTrips: trips.length, allPresent: true } }
  fs.writeFileSync(`${output}/verification.json`, JSON.stringify(report, null, 2) + '\n')
  console.log(JSON.stringify(report, null, 2))
} finally { await browser.close() }
