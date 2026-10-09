import { chromium } from 'playwright'

const URL = 'http://localhost:3011/'
const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
const page = await context.newPage()
await page.goto(URL, { waitUntil: 'networkidle' })

const info = await page.evaluate(() => {
  const out = []
  const all = Array.from(document.querySelectorAll('*'))
  for (const el of all) {
    const r = el.getBoundingClientRect()
    if (r.right > 391) {
      const cs = window.getComputedStyle(el)
      // Walk up to find the first ancestor with containment
      let container = null
      let p = el.parentElement
      while (p) {
        const ps = window.getComputedStyle(p)
        if (ps.overflowX === 'auto' || ps.overflowX === 'scroll' || ps.overflowX === 'hidden') {
          container = p
          break
        }
        p = p.parentElement
      }
      if (!container || container === document.documentElement) {
        out.push({
          tag: el.tagName,
          id: el.id || '',
          cls: (el.className?.toString?.() || '').slice(0, 60),
          left: Math.round(r.left),
          right: Math.round(r.right),
          width: Math.round(r.width),
          display: cs.display,
          position: cs.position,
          overflowX: cs.overflowX,
          sectionId: (() => {
            let n = el
            while (n) {
              if (n.tagName === 'SECTION' && n.id) return n.id
              n = n.parentElement
            }
            return ''
          })(),
          parentTag: el.parentElement?.tagName,
          parentCls: (el.parentElement?.className?.toString?.() || '').slice(0, 60),
        })
      }
    }
    if (out.length > 30) break
  }
  return out
})

console.log(JSON.stringify(info, null, 2))
await browser.close()
