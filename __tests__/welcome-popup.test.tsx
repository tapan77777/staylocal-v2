// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { StrictMode } from 'react'
import WelcomePopup, { WELCOME_SESSION_KEY } from '@/components/WelcomePopup'

const show = vi.fn(function (this: HTMLDialogElement) {
  this.setAttribute('open', '')
  this.querySelector<HTMLButtonElement>('button')?.focus()
})
const close = vi.fn(function (this: HTMLDialogElement) {
  if (!this.open) return
  this.removeAttribute('open')
  this.dispatchEvent(new Event('close'))
})

beforeEach(() => {
  vi.useFakeTimers()
  sessionStorage.clear()
  show.mockClear(); close.mockClear()
  HTMLDialogElement.prototype.showModal = show
  HTMLDialogElement.prototype.close = close
  document.documentElement.style.overflow = ''
})
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers() })
const openWelcome = () => act(() => { vi.advanceTimersByTime(700) })

describe('optional session welcome', () => {
  it('starts closed, then opens once with real route links and a visible close control', () => {
    render(<WelcomePopup />)
    expect(screen.queryByRole('dialog')).toBeNull()
    openWelcome()
    expect(screen.getByRole('dialog', { name: 'What would you like to explore?' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Explore Treks' }).getAttribute('href')).toBe('/treks')
    expect(screen.getByRole('link', { name: 'Explore Tours' }).getAttribute('href')).toBe('/tours')
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Close welcome popup' }))
    expect(sessionStorage.getItem(WELCOME_SESSION_KEY)).toBe('1')
  })
  it.each(['Explore Everything', 'Close welcome popup'])('dismisses with %s and restores scrolling', name => {
    render(<WelcomePopup />); openWelcome()
    expect(document.documentElement.style.overflow).toBe('hidden')
    fireEvent.click(screen.getByRole('button', { name }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.documentElement.style.overflow).toBe('')
    expect(sessionStorage.getItem(WELCOME_SESSION_KEY)).toBe('1')
  })
  it('does not reopen on navigation/remount, including Strict Mode', () => {
    const first = render(<StrictMode><WelcomePopup /></StrictMode>); openWelcome()
    expect(show).toHaveBeenCalledTimes(1)
    first.unmount()
    render(<WelcomePopup />); openWelcome()
    expect(show).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('dialog')).toBeNull()
  })
  it('leaves the page alone if storage is disabled or the browser lacks modal dialogs', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('Storage unavailable') })
    const first = render(<WelcomePopup />); openWelcome()
    expect(show).not.toHaveBeenCalled()
    first.unmount()
    vi.restoreAllMocks()
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { value: undefined, configurable: true, writable: true })
    render(<WelcomePopup />); openWelcome()
    expect(document.querySelector('dialog')?.open).toBe(false)
  })
  it('does not interrupt typing and restores scroll state on unmount', () => {
    const input = document.createElement('input')
    document.body.appendChild(input); input.focus()
    const first = render(<WelcomePopup />); openWelcome()
    expect(show).not.toHaveBeenCalled()
    first.unmount(); input.remove()
    const next = render(<WelcomePopup />); openWelcome()
    next.unmount()
    expect(document.documentElement.style.overflow).toBe('')
  })
})
