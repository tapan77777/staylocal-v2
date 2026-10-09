import type { Metadata } from 'next'
import StaticPage from '@/components/StaticPage'
import { brand, waLink } from '@/lib/config'

export const metadata: Metadata = {
  title: 'Contact',
  description: `Reach ${brand.name} on WhatsApp or email. We reply ${brand.responseTime}.`,
  alternates: { canonical: `${brand.siteUrl}/contact` },
}

export default function ContactPage() {
  return (
    <StaticPage
      eyebrow="Contact"
      title="Talk to a real person"
      intro={`We reply ${brand.responseTime} on WhatsApp. For non-urgent questions, email is also fine.`}
    >
      <div className="grid">
        <a className="card wa" href={waLink('Hi StayLocal! I have a question.')} target="_blank" rel="noopener noreferrer">
          <p className="eyebrow">WhatsApp (fastest)</p>
          <p className="big">{brand.whatsapp.display}</p>
          <p className="muted">Tap to open WhatsApp</p>
        </a>
        <a className="card" href={`mailto:${brand.email}`}>
          <p className="eyebrow">Email</p>
          <p className="big">{brand.email}</p>
          <p className="muted">Replies within 24 hours</p>
        </a>
      </div>

      <h2 className="section">Hours</h2>
      <p>{brand.supportHours}. Messages outside hours get a reply the next working morning.</p>

      <h2 className="section">What to include in your first message</h2>
      <ul>
        <li>Which trip you&apos;re interested in (link helps)</li>
        <li>Dates or month you&apos;re thinking of</li>
        <li>Number of travellers</li>
        <li>Anything specific — budget, food preferences, mobility, etc.</li>
      </ul>

      <style>{`
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; margin-bottom: 8px; }
        .card { display: block; background: #fff; border: 1px solid var(--border); border-radius: 16px; padding: 20px; text-decoration: none; color: #1a1a1a; }
        .card.wa { background: var(--green-light); border-color: rgba(29,158,117,0.2); }
        .eyebrow { font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--green); font-weight: 700; margin-bottom: 8px; }
        .big { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
        .muted { color: var(--text-secondary); font-size: 13px; }
        .section { font-family: var(--font-playfair); font-size: 22px; font-weight: 700; margin: 28px 0 10px; }
        ul { margin: 0 0 16px 20px; }
        ul li { margin-bottom: 6px; }
      `}</style>
    </StaticPage>
  )
}
