'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { brand, waLink } from '@/lib/config'

const LINKS = [
  { href: '/trips', label: 'Explore trips' },
  { href: '/#destinations', label: 'Destinations' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
]

export default function Navbar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // Only start transparent on homepage (which has the full-bleed hero).
  const transparentCapable = pathname === '/'

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    if (!transparentCapable) {
      setScrolled(true)
      return
    }
    const onScroll = () => setScrolled(window.scrollY > 60)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [transparentCapable])

  const solid = scrolled || open
  const navColor = solid ? '#1a1a1a' : '#fff'
  const brandDark = solid ? '#1a1a1a' : '#fff'
  const brandGreen = solid ? 'var(--green)' : '#8BE4C0'

  return (
    <nav
      style={{
        background: solid ? 'rgba(255,255,255,0.94)' : 'transparent',
        backdropFilter: solid ? 'saturate(1.4) blur(10px)' : undefined,
        WebkitBackdropFilter: solid ? 'saturate(1.4) blur(10px)' : undefined,
        borderBottom: solid ? '1px solid var(--border)' : '1px solid transparent',
        position: transparentCapable ? 'fixed' : 'sticky',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        transition: 'background 220ms ease, border-color 220ms ease',
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0 20px',
          height: 68,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'baseline' }}>
          <span
            style={{
              fontFamily: 'var(--font-playfair)',
              fontSize: 24,
              fontWeight: 700,
              color: brandDark,
              letterSpacing: '-0.01em',
            }}
          >
            Stay
          </span>
          <span
            style={{
              fontFamily: 'var(--font-playfair)',
              fontSize: 24,
              fontWeight: 700,
              color: brandGreen,
              letterSpacing: '-0.01em',
            }}
          >
            Local
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex" style={{ alignItems: 'center', gap: 28 }}>
          {LINKS.map(l => (
            <Link
              key={l.href}
              href={l.href}
              style={{
                fontSize: 14,
                color: navColor,
                textDecoration: 'none',
                fontWeight: 500,
                opacity: 0.92,
              }}
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Desktop CTA cluster */}
        <div className="hidden md:flex" style={{ alignItems: 'center', gap: 10 }}>
          <Link
            href="/#enquiry"
            style={{
              background: solid ? 'var(--green)' : '#fff',
              color: solid ? '#fff' : '#121212',
              padding: '10px 18px',
              borderRadius: 999,
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: 600,
              boxShadow: solid
                ? '0 8px 20px -10px rgba(29,158,117,0.55)'
                : '0 8px 20px -10px rgba(0,0,0,0.3)',
            }}
          >
            Plan My Trip
          </Link>
          <a
            href={waLink()}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp us"
            title={`WhatsApp ${brand.whatsapp.display}`}
            style={{
              width: 40,
              height: 40,
              borderRadius: 999,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `1.5px solid ${solid ? 'var(--border)' : 'rgba(255,255,255,0.5)'}`,
              color: solid ? 'var(--green)' : '#fff',
              textDecoration: 'none',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
            </svg>
          </a>
        </div>

        {/* Mobile cluster */}
        <div className="md:hidden" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <a
            href={waLink()}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp us"
            style={{
              background: solid ? 'var(--green)' : 'rgba(255,255,255,0.95)',
              color: solid ? '#fff' : '#0d6b50',
              padding: '8px 14px',
              borderRadius: 999,
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
            </svg>
            WhatsApp
          </a>
          <button
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              border: `1px solid ${solid ? 'var(--border)' : 'rgba(255,255,255,0.6)'}`,
              background: solid ? '#fff' : 'rgba(255,255,255,0.12)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: navColor,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="backdrop-enter"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            zIndex: 60,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="sheet-enter"
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              width: '84%',
              maxWidth: 320,
              background: '#fff',
              padding: '24px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <span style={{ fontFamily: 'var(--font-playfair)', fontSize: 20, fontWeight: 700 }}>
                Stay<span style={{ color: 'var(--green)' }}>Local</span>
              </span>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#1a1a1a' }}
              >
                ✕
              </button>
            </div>
            {LINKS.map(l => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                style={{
                  padding: '12px 10px',
                  borderBottom: '1px solid var(--border-light)',
                  textDecoration: 'none',
                  color: '#1a1a1a',
                  fontSize: 15,
                  fontWeight: 500,
                }}
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/#enquiry"
              onClick={() => setOpen(false)}
              style={{
                marginTop: 16,
                background: 'var(--green)',
                color: '#fff',
                borderRadius: 999,
                padding: '12px 16px',
                textAlign: 'center',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: 15,
              }}
            >
              Plan My Trip
            </Link>
            <a
              href={waLink()}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              style={{
                marginTop: 8,
                border: '1.5px solid var(--green)',
                color: 'var(--green)',
                borderRadius: 999,
                padding: '12px 16px',
                textAlign: 'center',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              WhatsApp {brand.whatsapp.display}
            </a>
          </div>
        </div>
      )}
    </nav>
  )
}
