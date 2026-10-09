import { chromium } from 'playwright'

const URL = process.env.URL || 'http://localhost:3011/'
const sizes = [
  { w: 390, h: 844, name: 'iPhone 390' },
  { w: 417, h: 850, name: 'Pixel 417' },
  { w: 1440, h: 900, name: 'Desktop 1440' },
]

const browser = await chromium.launch()
try {
  for (const s of sizes) {
    const context = await browser.newContext({ viewport: { width: s.w, height: s.h } })
    const page = await context.newPage()
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 20000 })
    await page.waitForTimeout(400)

    const info = await page.evaluate(() => {
      const html = document.documentElement
      const body = document.body
      const over = []
      const walker = document.createTreeWalker(body, NodeFilter.SHOW_ELEMENT)
      let n = walker.currentNode
      while (n) {
        if (n instanceof HTMLElement) {
          const r = n.getBoundingClientRect()
          if (r.right > window.innerWidth + 1) {
            const style = window.getComputedStyle(n)
            // Skip nodes whose nearest overflow-x ancestor is auto/scroll (internal scroll)
            let allowed = false
            let p = n.parentElement
            while (p) {
              const ps = window.getComputedStyle(p)
              if (ps.overflowX === 'auto' || ps.overflowX === 'scroll' || ps.overflowX === 'hidden') {
                allowed = true
                break
              }
              p = p.parentElement
            }
            if (!allowed) {
              over.push({
                tag: n.tagName,
                id: n.id || null,
                cls: n.className?.toString?.().slice(0, 80) || null,
                left: Math.round(r.left),
                right: Math.round(r.right),
                width: Math.round(r.width),
              })
              if (over.length > 10) break
            }
          }
        }
        n = walker.nextNode()
      }
      return {
        innerWidth: window.innerWidth,
        docWidth: html.scrollWidth,
        bodyWidth: body.scrollWidth,
        bodyClientWidth: body.clientWidth,
        hasHOverflow: html.scrollWidth > html.clientWidth,
        overflowers: over,
      }
    })
    console.log(`\n== ${s.name} (${s.w}x${s.h}) ==`)
    console.log(JSON.stringify(info, null, 2))
    const outPath = `/tmp/shot-${s.w}.png`
    await page.screenshot({ path: outPath, fullPage: false })
    console.log('shot ->', outPath)
    await context.close()
  }
} finally {
  await browser.close()
}
