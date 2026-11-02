import type { Metadata } from 'next'
import { Playfair_Display, DM_Sans } from 'next/font/google'
import { brand } from '@/lib/config'
import './globals.css'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})
const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

const defaultTitle = 'StayLocal Trips — Treks, Tours & Travel Experiences'
const sharingTitle = 'StayLocal Trips — Explore More. Travel Differently.'
const defaultDescription = 'Explore Himalayan treks, curated India tours and memorable group adventures with StayLocal. Discover authentic experiences and plan your next trip.'

export const metadata: Metadata = {
  metadataBase: new URL(brand.siteUrl),
  title: {
    default: defaultTitle,
    template: `%s · ${brand.name}`,
  },
  description: defaultDescription,
  alternates: { canonical: '/' },
  openGraph: {
    siteName: brand.name,
    title: sharingTitle,
    description: defaultDescription,
    url: '/',
    locale: 'en_IN',
    type: 'website',
    images: [{ url: '/images/himalayan-peaks.jpg', alt: 'Himalayan mountain peaks' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: sharingTitle,
    description: defaultDescription,
    images: ['/images/himalayan-peaks.jpg'],
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${dmSans.variable}`}>
      <body>{children}</body>
    </html>
  )
}
