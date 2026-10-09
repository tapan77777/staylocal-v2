import type { Metadata } from 'next'
import StaticPage from '@/components/StaticPage'
import { brand } from '@/lib/config'

export const metadata: Metadata = {
  title: 'Terms & conditions',
  description: `${brand.name} terms & conditions.`,
  alternates: { canonical: `${brand.siteUrl}/terms` },
}

export default function TermsPage() {
  return (
    <StaticPage
      eyebrow="Legal"
      title="Terms & conditions"
      intro={`General terms that apply when you book a trip with ${brand.name}. The final terms for your trip will be shared with your booking confirmation.`}
    >
      <p className="pending">
        Draft — awaiting legal review. Final terms specific to your trip will be shared in writing with your
        booking confirmation.
      </p>

      <h2 className="section">Enquiries vs. bookings</h2>
      <p>
        Submitting the enquiry form or messaging us on WhatsApp creates an <strong>enquiry</strong>. Your trip is
        considered <strong>booked</strong> only after we send you a written confirmation and an advance payment
        is received.
      </p>

      <h2 className="section">Pricing</h2>
      <ul>
        <li>&quot;Starting from&quot; prices on cards are per person and reflect the lowest tier for the shortest duration
          available.</li>
        <li>Final quotes depend on group size, chosen duration, chosen package tier, selected add-ons, and
          availability on your dates.</li>
        <li>Prices exclude GST and any additional fees unless explicitly stated.</li>
      </ul>

      <h2 className="section">Payments</h2>
      <p>
        We generally take an advance to confirm the booking and the balance before departure. Specific amounts and
        due dates are confirmed in writing per trip.
      </p>

      <h2 className="section">Liability</h2>
      <p>
        {brand.name} is not responsible for delays or losses caused by factors outside our control (weather,
        strikes, natural events, government advisories). We&apos;ll always make reasonable efforts to help you adjust
        plans in such cases.
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
