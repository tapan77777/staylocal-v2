import type { Metadata } from 'next'
import StaticPage from '@/components/StaticPage'
import { brand } from '@/lib/config'

export const metadata: Metadata = {
  title: 'Privacy policy',
  description: `How ${brand.name} handles your personal information.`,
  alternates: { canonical: `${brand.siteUrl}/privacy` },
}

export default function PrivacyPage() {
  return (
    <StaticPage
      eyebrow="Legal"
      title="Privacy policy"
      intro={`This page describes what personal information ${brand.name} collects and how we use it. This is a plain-English summary — please contact us if you want a more formal version for a corporate booking.`}
    >
      <p className="pending">
        Draft — awaiting legal review. Do not treat this as a legally reviewed policy. If you need our formal
        policy before booking, please WhatsApp us.
      </p>

      <h2 className="section">What we collect</h2>
      <ul>
        <li>Information you share in enquiry forms — name, phone, email, travel preferences, group size.</li>
        <li>Any additional details you choose to share on WhatsApp or email.</li>
      </ul>

      <h2 className="section">How we use it</h2>
      <ul>
        <li>To respond to your enquiry and plan the trip.</li>
        <li>To send booking confirmations, itineraries, and payment instructions.</li>
        <li>Occasionally, to follow up on past enquiries — never for third-party marketing.</li>
      </ul>

      <h2 className="section">Who we share it with</h2>
      <p>
        We share only the information required to deliver your trip — e.g. your name and travel dates with hotel
        partners or local operators we work with on the ground. We don&apos;t sell or trade customer data.
      </p>

      <h2 className="section">Your rights</h2>
      <p>
        You can ask us to delete your enquiry data at any time by emailing <a href={`mailto:${brand.email}`}>{brand.email}</a>.
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
