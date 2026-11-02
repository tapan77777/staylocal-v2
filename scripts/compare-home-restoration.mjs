import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import sharp from 'sharp'
import { chromium } from '@playwright/test'

const base = process.argv[2] || 'http://127.0.0.1:3116'
const original = 'http://127.0.0.1:3117'
assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname))
const output = 'artifacts/homepage-restoration'
fs.mkdirSync(output, { recursive: true })
const browser = await chromium.launch({ headless: true })
const comparisons = []
try {
  for (const [device, width, height] of [['desktop', 1440, 1000], ['mobile', 390, 844]]) {
    const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' })
    await context.addInitScript(() => sessionStorage.setItem('staylocal:welcome-seen:v1', '1'))
    await context.route('**/api/**', route => ['GET', 'HEAD'].includes(route.request().method()) ? route.continue() : route.abort())
    const metrics = {}
    for (const [name, url] of [['original', original], ['restored', base]]) {
      const page = await context.newPage()
      await page.goto(url, { waitUntil: 'networkidle' })
      await page.evaluate(async () => { await document.fonts.ready; for (let y = 0; y < document.body.scrollHeight; y += 650) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 50)) } window.scrollTo(0, 0) })
      await page.locator('main > section').first().screenshot({ path: `${output}/${name}-hero-${device}.png` })
      await page.screenshot({ path: `${output}/${name}-full-${device}.png`, fullPage: true })
      metrics[name] = await page.locator('main > section').first().evaluate(el => ({ width: el.getBoundingClientRect().width, height: el.getBoundingClientRect().height, heading: el.querySelector('h1')?.textContent }))
      await page.close()
    }
    assert.equal(metrics.original.heading, metrics.restored.heading, 'Original hero headline retained')
    assert.equal(metrics.original.height, metrics.restored.height, 'Original hero height retained')
    const left = await sharp(`${output}/original-hero-${device}.png`).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    const right = await sharp(`${output}/restored-hero-${device}.png`).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    const sameSize = left.info.width === right.info.width && left.info.height === right.info.height
    let meanAbsoluteChannelDelta = null
    if (sameSize) {
      let delta = 0
      for (let i = 0; i < left.data.length; i++) delta += Math.abs(left.data[i] - right.data[i])
      meanAbsoluteChannelDelta = Number((delta / left.data.length).toFixed(3))
    }
    const side = await sharp(`${output}/original-hero-${device}.png`).png().toBuffer()
    const restored = await sharp(`${output}/restored-hero-${device}.png`).png().toBuffer()
    await sharp({ create: { width: left.info.width + right.info.width, height: Math.max(left.info.height, right.info.height), channels: 4, background: '#fafaf8' } }).composite([{ input: side, left: 0, top: 0 }, { input: restored, left: left.info.width, top: 0 }]).png().toFile(`${output}/comparison-${device}.png`)
    comparisons.push({ device, ...metrics, meanAbsoluteChannelDelta, scale: '0–255; includes intentional navigation changes; not an exact-pixel release gate' })
    await context.close()
  }
  const exactHistoricalFiles = ['components/Hero.tsx', 'components/WhySection.tsx', 'components/FounderSection.tsx', 'components/EnquiryForm.tsx', 'components/TravelByStyle.tsx', 'components/HowItWorks.tsx'].map(file => ({ file, byteIdenticalToGit7305285: execFileSync('git', ['show', `7305285:${file}`]).equals(fs.readFileSync(file)) }))
  const report = { revision: '7305285', reference: 'Historical Git component tree with public read-only snapshot, production CSS/fonts and Next link/navigation shims; reference is not a deployed build', differences: ['Treks/Tours navigation and visible category links', 'Four unavailable founder experience cards excluded; three working originals retained', 'Authoritative published package summaries and matched curated idea links', 'Optional session welcome, suppressed for comparison', 'Reveal animation progressively enhanced so non-JS content stays visible'], comparisons, exactHistoricalFiles }
  fs.writeFileSync(`${output}/visual-comparison.json`, JSON.stringify(report, null, 2) + '\n')
  console.log(JSON.stringify(report, null, 2))
} finally { await browser.close() }
