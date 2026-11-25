'use client'
import { useEffect, useRef, useState } from 'react'
import s from './Treks.module.css'

const REDUCE = '(prefers-reduced-motion: reduce)'

function prefersReducedMotion() {
  return typeof window.matchMedia === 'function' && window.matchMedia(REDUCE).matches
}

/**
 * Drop this once inside the page root (article / main).
 * - reveals [data-reveal] elements on scroll (adds data-in)
 * - scroll-spy + sliding indicator for the [data-spy-nav] section links
 * - scroll progress bar (progress prop), hero parallax
 * - smooth anchor scrolling + highlight flash on #trek-enquiry
 * - hides the mobile enquiry bar while the form is on screen
 * Everything degrades to the normal static page without JS / with reduced motion.
 */
export function TrekMotion({ progress = false }: { progress?: boolean }) {
  const anchor = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const bar = anchor.current
    const root = bar?.parentElement
    if (!bar || !root) return
    const reduce = prefersReducedMotion()
    const hasIO = 'IntersectionObserver' in window
    const off: Array<() => void> = []

    /* 1 ── Scroll reveal ─────────────────────────────── */
    if (!reduce && hasIO) {
      ;['trail', 'itinerary'].forEach(id => {
        const el = root.querySelector<HTMLElement>(`#${id}`)
        if (el && !el.hasAttribute('data-reveal')) el.setAttribute('data-reveal', 'up')
      })
      root.setAttribute('data-motion', 'on')
      const timers: number[] = []
      const io = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (!entry.isIntersecting) return
            const el = entry.target as HTMLElement
            el.setAttribute('data-in', '')
            io.unobserve(el)
            timers.push(window.setTimeout(() => el.setAttribute('data-done', ''), 1800))
          })
        },
        { threshold: 0, rootMargin: '0px 0px -8% 0px' },
      )
      root.querySelectorAll('[data-reveal]').forEach(el => io.observe(el))
      off.push(() => {
        io.disconnect()
        timers.forEach(t => window.clearTimeout(t))
        root.removeAttribute('data-motion')
      })
    }

    /* 2 ── Scroll handler: progress, parallax, scroll-spy ─ */
    const header = root.querySelector<HTMLElement>('header')
    const nav = root.querySelector<HTMLElement>('[data-spy-nav]')
    const links = nav ? Array.from(nav.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')) : []
    const targets = links.map(a => document.getElementById((a.getAttribute('href') || '').slice(1)))
    let activeIdx = -2
    let ticking = false

    const place = (i: number) => {
      links.forEach((a, k) => (k === i ? a.setAttribute('data-active', 'true') : a.removeAttribute('data-active')))
      if (!nav) return
      const a = links[i]
      if (a) {
        nav.style.setProperty('--ix', `${a.offsetLeft}px`)
        nav.style.setProperty('--iw', `${a.offsetWidth}px`)
        if (nav.scrollWidth > nav.clientWidth) {
          nav.scrollTo({ left: Math.max(0, a.offsetLeft - 24), behavior: reduce ? 'auto' : 'smooth' })
        }
      } else {
        nav.style.setProperty('--iw', '0px')
      }
    }

    const update = () => {
      ticking = false
      const y = window.scrollY
      if (progress) {
        const max = document.documentElement.scrollHeight - window.innerHeight
        bar.style.setProperty('--p', String(max > 0 ? Math.min(1, y / max) : 0))
      }
      if (!reduce && header && y < 1000) header.style.setProperty('--sy', String(Math.round(y)))
      if (nav) {
        let idx = -1
        targets.forEach((t, i) => {
          if (t && t.getBoundingClientRect().top <= 190) idx = i
        })
        if (idx !== activeIdx) {
          activeIdx = idx
          place(idx)
        }
      }
    }
    const onScroll = () => {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(update)
      }
    }
    const onResize = () => {
      activeIdx = -2
      onScroll()
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    update()
    off.push(() => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
    })

    /* 3 ── Smooth anchors + enquiry highlight ─────────── */
    const flash = () => {
      const form = document.getElementById('trek-enquiry')
      if (!form) return
      form.setAttribute('data-flash', '')
      window.setTimeout(() => form.removeAttribute('data-flash'), 1900)
    }
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest('a[href^="#"]') as HTMLAnchorElement | null
      if (!a || !root.contains(a)) return
      const id = (a.getAttribute('href') || '').slice(1)
      const el = id ? document.getElementById(id) : null
      if (!el) return
      e.preventDefault()
      el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
      history.replaceState(null, '', `#${id}`)
      if (id === 'trek-enquiry') window.setTimeout(flash, reduce ? 0 : 500)
    }
    root.addEventListener('click', onClick)
    off.push(() => root.removeEventListener('click', onClick))
    if (window.location.hash === '#trek-enquiry') {
      const t = window.setTimeout(flash, 700)
      off.push(() => window.clearTimeout(t))
    }

    /* 4 ── Hide mobile bar while the form is visible ──── */
    const mobileBar = root.querySelector<HTMLElement>('[data-mobile-bar]')
    const form = root.querySelector<HTMLElement>('#trek-enquiry')
    if (hasIO && mobileBar && form) {
      const io2 = new IntersectionObserver(
        ([e]) => (e.isIntersecting ? mobileBar.setAttribute('data-hidden', '') : mobileBar.removeAttribute('data-hidden')),
        { threshold: 0.25 },
      )
      io2.observe(form)
      off.push(() => io2.disconnect())
    }

    return () => off.forEach(fn => fn())
  }, [progress])

  return (
    <div ref={anchor} className={progress ? s.progress : s.motionAnchor} aria-hidden>
      <i />
    </div>
  )
}

/** Counts the first number in a string up from 0 when scrolled into view.
 *  Server HTML and first client render both show the final value (no hydration mismatch, no-JS safe). */
export function CountUp({ value, duration = 1200 }: { value: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [text, setText] = useState(value)

  useEffect(() => {
    const m = value.match(/^(\D*?)(\d[\d,]*(?:\.\d+)?)([\s\S]*)$/)
    if (!m || prefersReducedMotion() || !('IntersectionObserver' in window)) return
    const [, pre, num, post] = m
    const target = parseFloat(num.replace(/,/g, ''))
    if (!Number.isFinite(target) || target <= 0) return
    const decimals = num.includes('.') ? num.split('.')[1].length : 0
    const grouped = num.includes(',')
    const fmt = (n: number) =>
      grouped
        ? n.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
        : n.toFixed(decimals)
    let raf = 0
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        io.disconnect()
        const start = performance.now()
        setText(`${pre}${fmt(0)}${post}`)
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / duration)
          const eased = 1 - Math.pow(1 - t, 3)
          setText(t < 1 ? `${pre}${fmt(target * eased)}${post}` : value)
          if (t < 1) raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
      },
      { threshold: 0.6 },
    )
    if (ref.current) io.observe(ref.current)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [value, duration])

  return <span ref={ref}>{text}</span>
}