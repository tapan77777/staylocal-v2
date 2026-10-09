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

const defaultTitle = `${brand.name} — Thoughtfully planned trips across India`
const defaultDescription = brand.description

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
    title: defaultTitle,
    description: defaultDescription,
    url: '/',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: defaultTitle,
    description: defaultDescription,
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
