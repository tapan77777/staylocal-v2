import Link from 'next/link'
import { brand, waLink } from '@/lib/config'

const EXPLORE = [
  { href: '/trips', label: 'All trips' },
  { href: '/#destinations', label: 'Destinations' },
  { href: '/#how-it-works', label: 'How booking works' },
  { href: '/#enquiry', label: 'Plan a trip' },
]

const COMPANY = [
  { href: '/about', label: 'About us' },
  { href: '/contact', label: 'Contact' },
]

const LEGAL = [
  { href: '/privacy', label: 'Privacy policy' },
  { href: '/terms', label: 'Terms & conditions' },
  { href: '/cancellation', label: 'Cancellation & refunds' },
]

export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer
      style={{
        background: 'var(--green-darker)',
        color: 'rgba(255,255,255,0.78)',
        marginTop: 0,
        position: 'relative',
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(1200px 420px at 20% 0%, rgba(139,228,192,0.14), transparent 60%)',
          pointerEvents: 'none',
        }}
      />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '64px 20px 28px', position: 'relative' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 32,
            marginBottom: 40,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: 'var(--font-playfair)',
                fontSize: 26,
                fontWeight: 700,
                color: '#fff',
                marginBottom: 12,
                letterSpacing: '-0.01em',
              }}
            >
              Stay<span style={{ color: '#8BE4C0' }}>Local</span>
            </div>
            <p style={{ fontSize: 13.5, lineHeight: 1.65, marginBottom: 18, maxWidth: 300 }}>
              {brand.description}
            </p>
            <a
              href={waLink()}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: '#25D366',
                color: '#fff',
                padding: '10px 16px',
                borderRadius: 999,
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              WhatsApp {brand.whatsapp.display}
            </a>
          </div>

          <FooterColumn title="Explore" links={EXPLORE} />
          <FooterColumn title="Company" links={COMPANY} />
          <FooterColumn title="Legal" links={LEGAL} />
        </div>

        <div
          style={{
            borderTop: '1px solid rgba(255,255,255,0.12)',
            paddingTop: 20,
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
            fontSize: 12,
          }}
        >
          <p>© {year} {brand.name}. All rights reserved.</p>
          <p style={{ color: 'rgba(255,255,255,0.55)' }}>
            Based in India · Replies {brand.responseTime} on WhatsApp
          </p>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <p
        style={{
          fontSize: 11,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: '#8BE4C0',
          marginBottom: 14,
          fontWeight: 700,
        }}
      >
        {title}
      </p>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {links.map(l => (
          <li key={l.href}>
            <Link
              href={l.href}
              style={{ color: 'rgba(255,255,255,0.82)', textDecoration: 'none', fontSize: 13.5 }}
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
