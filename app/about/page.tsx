import type { Metadata } from 'next'
import StaticPage from '@/components/StaticPage'
import { brand } from '@/lib/config'

export const metadata: Metadata = {
  title: 'About',
  description: `About ${brand.name} — a small, India-focused travel team that plans trips with transparency and real support.`,
  alternates: { canonical: `${brand.siteUrl}/about` },
}

export default function AboutPage() {
  return (
    <StaticPage
      eyebrow="About us"
      title={`We're a small team planning real trips across India.`}
      intro={brand.description}
    >
      <h2 className="section">What we do</h2>
      <p>
        {brand.name} plans small-group and private trips across India. Every package you see on this site is one we
        actually run — with a published itinerary, clear inclusions and exclusions, and a transparent starting
        price per person.
      </p>

      <h2 className="section">How we work</h2>
      <ul>
        <li>Enquiries are read and replied to by a real person — usually within a few hours during business days.</li>
        <li>Prices on cards are &quot;starting from&quot; per person. A final quote is confirmed only after we understand your
          dates and group size.</li>
        <li>A trip is treated as <strong>confirmed</strong> only after we send a written confirmation and an advance has been received.</li>
        <li>If we partner with a local operator on the ground, we tell you upfront.</li>
      </ul>

      <h2 className="section">What we don&apos;t do</h2>
      <ul>
        <li>Fake reviews, fake urgency, or made-up discounts.</li>
        <li>Hidden charges — all mandatory costs are listed on the trip page.</li>
        <li>Pretend to be a huge brand we aren&apos;t. We&apos;re a small, accountable team.</li>
      </ul>

      <h2 className="section">Business information</h2>
      <p className="muted">
        Verified business details (legal entity name, registered address, GSTIN, and any travel-industry registrations)
        will be published here when we finalise them with our accountant. If you need these for a corporate booking,
        please WhatsApp us and we&apos;ll share them directly.
      </p>

      <style>{`
        .section { font-family: var(--font-playfair); font-size: 22px; font-weight: 700; margin: 32px 0 10px; }
        ul { margin: 0 0 16px 20px; }
        ul li { margin-bottom: 6px; }
        .muted { color: var(--text-secondary); font-size: 14px; }
      `}</style>
    </StaticPage>
  )
}
