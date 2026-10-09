import type { Metadata } from 'next'
import StaticPage from '@/components/StaticPage'
import { brand, waLink } from '@/lib/config'

export const metadata: Metadata = {
  title: 'Cancellation & refunds',
  description: `How cancellations, refunds, and rescheduling work with ${brand.name}.`,
  alternates: { canonical: `${brand.siteUrl}/cancellation` },
}

export default function CancellationPage() {
  return (
    <StaticPage
      eyebrow="Legal"
      title="Cancellation & refunds"
      intro={`Cancellation terms vary by trip because every package involves third-party operators (hotels, transport, ferry tickets, activity partners). The specific terms for your booking will always be shared with your written confirmation.`}
    >
      <p className="pending">
        Trip-specific terms override anything on this page. If you don&apos;t have your trip terms in writing, please{' '}
        <a href={waLink('Hi StayLocal! Please share the cancellation terms for my booking.')} target="_blank" rel="noopener noreferrer">
          WhatsApp us
        </a>{' '}
        and we&apos;ll send them.
      </p>

      <h2 className="section">General cancellation guidance</h2>
      <ul>
        <li>Enquiries carry no obligation and can be withdrawn at any time at no cost.</li>
        <li>Once a booking is confirmed and an advance has been paid, cancellation fees apply.</li>
        <li>Cancellation fees typically rise closer to the departure date, following the policies of our hotel,
          transport, and activity partners.</li>
        <li>Non-refundable components (e.g. flight tickets, ferry tickets, permits) are called out upfront.</li>
      </ul>

      <h2 className="section">Rescheduling</h2>
      <p>
        We&apos;re usually able to help you move dates if you tell us early. Rescheduling may involve price adjustments
        if the new dates fall into a different season.
      </p>

      <h2 className="section">If StayLocal cancels</h2>
      <p>
        If we cancel a trip for any reason, you&apos;ll receive the full amount paid, less any non-recoverable third-party
        costs — and we&apos;ll be transparent about what those are.
      </p>

      <h2 className="section">How to request a cancellation or refund</h2>
      <p>
        Write to <a href={`mailto:${brand.email}`}>{brand.email}</a> or WhatsApp us. We&apos;ll process the request within
        2 working days and share the applicable amounts in writing before any refund is initiated.
      </p>

      <style>{`
        .section { font-family: var(--font-playfair); font-size: 22px; font-weight: 700; margin: 28px 0 10px; }
        ul { margin: 0 0 16px 20px; }
        ul li { margin-bottom: 6px; }
        .pending { background: #fef3c7; color: #92400e; padding: 12px 14px; border-radius: 10px; font-size: 13px; margin-bottom: 20px; }
      `}</style>
    </StaticPage>
  )
}
