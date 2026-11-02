'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import s from './WelcomePopup.module.css'

export const WELCOME_SESSION_KEY = 'staylocal:welcome-seen:v1'

export default function WelcomePopup() {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const restorePage = useRef<(() => void) | null>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog || typeof dialog.showModal !== 'function') return

    const timer = window.setTimeout(() => {
      // If storage is unavailable, leave discovery to the normal page links.
      try { if (sessionStorage.getItem(WELCOME_SESSION_KEY)) return } catch { return }
      if (document.querySelector('dialog[open], [role="dialog"]')) return
      if (document.activeElement?.matches('input, select, textarea')) return

      const previousFocus = document.activeElement as HTMLElement | null
      const root = document.documentElement
      const previousOverflow = root.style.overflow
      try {
        dialog.showModal()
        sessionStorage.setItem(WELCOME_SESSION_KEY, '1')
      } catch {
        if (dialog.open) dialog.close()
        return
      }
      root.style.overflow = 'hidden'
      restorePage.current = () => {
        root.style.overflow = previousOverflow
        if (previousFocus?.isConnected && previousFocus !== document.body) previousFocus.focus({ preventScroll: true })
        else document.querySelector<HTMLAnchorElement>('main a[href]')?.focus({ preventScroll: true })
      }
    }, 700)

    return () => {
      window.clearTimeout(timer)
      if (dialog.open) dialog.close()
      restorePage.current?.()
      restorePage.current = null
    }
  }, [])

  function dismiss() { dialogRef.current?.close() }
  function restore() {
    restorePage.current?.()
    restorePage.current = null
  }

  return (
    <dialog
      ref={dialogRef}
      className={s.dialog}
      aria-labelledby="welcome-heading"
      aria-describedby="welcome-description"
      onClose={restore}
      onKeyDown={event => {
        if (event.key !== 'Tab') return
        const controls = event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), a[href]')
        const first = controls[0]
        const last = controls[controls.length - 1]
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
      }}
      onClick={event => {
        if (event.target !== event.currentTarget) return
        const rect = event.currentTarget.getBoundingClientRect()
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dismiss()
      }}
    >
      <button className={s.close} type="button" aria-label="Close welcome popup" onClick={dismiss}>×</button>
      <p className={s.eyebrow}>Welcome to StayLocal</p>
      <h2 id="welcome-heading">What would you like to explore?</h2>
      <p id="welcome-description" className={s.intro}>A mountain trail, a little getaway, or wherever the journey takes you.</p>
      <div className={s.options}>
        <Link href="/treks" className={s.treks} onClick={dismiss}>
          <svg viewBox="0 0 64 44" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M4 39 24 7l14 22 8-12 14 22H4Z"/><path d="m17 18 7 4 6-4M39 28l7 3 6-4"/></svg>
          <span aria-hidden="true" className={s.optionHint}>Follow the trail</span><strong>Explore Treks <span aria-hidden="true">↗</span></strong>
        </Link>
        <Link href="/tours" className={s.tours} onClick={dismiss}>
          <svg viewBox="0 0 64 44" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="43" cy="11" r="6"/><path d="M5 27c9-9 18 9 27 0s18 9 27 0M5 36c9-9 18 9 27 0s18 9 27 0"/></svg>
          <span aria-hidden="true" className={s.optionHint}>Take your time</span><strong>Explore Tours <span aria-hidden="true">↗</span></strong>
        </Link>
      </div>
      <button type="button" className={s.everything} onClick={dismiss}>Explore Everything <span aria-hidden="true">→</span></button>
      <p className={s.note}>Just looking? Close this and explore at your own pace.</p>
    </dialog>
  )
}
