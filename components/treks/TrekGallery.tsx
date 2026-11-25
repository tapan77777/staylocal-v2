'use client'
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import type { TrekContent } from '@/lib/treks/schema'
import TrekPhoto from './TrekPhoto'
import s from './Treks.module.css'

/** Auto-drift speed in px per millisecond (0.03 ≈ 30px/s — slow and calm). */
const SPEED = 0.03
/** After the visitor scrolls / touches, wait this long before drifting again. */
const IDLE_MS = 1800
/** Varied aspect ratios (all the same height) give the strip a natural rhythm. */
const RATIOS = ['4 / 5', '1 / 1', '5 / 4', '3 / 4', '4 / 3', '1 / 1']

/**
 * Horizontal gallery strip that drifts slowly to the right and back.
 * - hover / focus pauses it; the visitor can then drag, swipe, shift+wheel or use the arrows
 * - touch / wheel interaction pauses it briefly
 * - Pause / Play button (moving content must be stoppable)
 * - paused when off-screen or with prefers-reduced-motion
 * Vertical wheel scrolling is NOT hijacked, so the page never gets trapped.
 */
export default function TrekGallery({ photos }: { photos: TrekContent['gallery'] }) {
  const box = useRef<HTMLDivElement>(null)
  const hovered = useRef(false)
  const playing = useRef(true)
  const lastTouch = useRef(0)
  const [on, setOn] = useState(true)
  const [drag, setDrag] = useState(false)
  const dragState = useRef<{ x: number; left: number } | null>(null)

  useEffect(() => {
    playing.current = on
  }, [on])

  useEffect(() => {
    const el = box.current
    if (!el) return
    const reduce = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      playing.current = false
      setOn(false)
    }
    let inView = true
    const io =
      'IntersectionObserver' in window
        ? new IntersectionObserver(([e]) => (inView = e.isIntersecting), { threshold: 0.15 })
        : null
    io?.observe(el)

    let raf = 0
    let last = performance.now()
    let pos = el.scrollLeft
    let dir = 1
    const tick = (now: number) => {
      const dt = Math.min(50, now - last)
      last = now
      const max = el.scrollWidth - el.clientWidth
      const idle = now - lastTouch.current > IDLE_MS
      if (playing.current && !hovered.current && inView && idle && max > 4) {
        pos += dir * SPEED * dt
        if (pos >= max) { pos = max; dir = -1 }
        else if (pos <= 0) { pos = 0; dir = 1 }
        el.scrollLeft = pos
      } else {
        pos = el.scrollLeft // follow the visitor's own scrolling
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    const poke = () => { lastTouch.current = performance.now() }
    el.addEventListener('wheel', poke, { passive: true })
    el.addEventListener('touchstart', poke, { passive: true })
    el.addEventListener('touchmove', poke, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      io?.disconnect()
      el.removeEventListener('wheel', poke)
      el.removeEventListener('touchstart', poke)
      el.removeEventListener('touchmove', poke)
    }
  }, [])

  // Mouse drag-to-scroll (touch keeps its native swipe)
  function down(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.pointerType !== 'mouse' || e.button !== 0 || !box.current) return
    dragState.current = { x: e.clientX, left: box.current.scrollLeft }
    setDrag(true)
    box.current.setPointerCapture(e.pointerId)
  }
  function move(e: ReactPointerEvent<HTMLDivElement>) {
    const d = dragState.current
    if (!d || !box.current) return
    box.current.scrollLeft = d.left - (e.clientX - d.x)
    lastTouch.current = performance.now()
  }
  function up(e: ReactPointerEvent<HTMLDivElement>) {
    if (!dragState.current) return
    dragState.current = null
    setDrag(false)
    box.current?.releasePointerCapture(e.pointerId)
  }
  function nudge(dir: number) {
    const el = box.current
    if (!el) return
    lastTouch.current = performance.now()
    el.scrollBy({ left: dir * Math.max(280, el.clientWidth * 0.7), behavior: 'smooth' })
  }

  return (
    <div className={s.galWrap}>
      <div className={s.galTools}>
        <span>
          <b aria-hidden>↔</b> Hover to pause · drag, swipe or use the arrows
        </span>
        <div className={s.galBtns}>
          <button type="button" onClick={() => nudge(-1)} aria-label="Scroll photos left">←</button>
          <button type="button" onClick={() => nudge(1)} aria-label="Scroll photos right">→</button>
          <button type="button" onClick={() => setOn(v => !v)} aria-pressed={!on}>
            {on ? '❚❚ Pause' : '▶ Play'}
          </button>
        </div>
      </div>
      <div
        ref={box}
        className={s.galViewport}
        data-drag={drag ? '' : undefined}
        role="region"
        aria-label="Trek photo gallery, scrollable"
        tabIndex={0}
        onPointerEnter={() => { hovered.current = true }}
        onPointerLeave={() => { hovered.current = false }}
        onFocus={() => { hovered.current = true }}
        onBlur={() => { hovered.current = false }}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onDragStart={e => e.preventDefault()}
      >
        <div className={s.galTrack}>
          {photos.map((photo, i) => (
            <figure key={`${photo.src}-${i}`} className={s.galFig} style={{ aspectRatio: RATIOS[i % RATIOS.length] }}>
              <TrekPhoto photo={photo} sizes="(max-width: 600px) 70vw, 380px" />
              {photo.caption && <figcaption>{photo.caption}</figcaption>}
            </figure>
          ))}
        </div>
      </div>
    </div>
  )
}