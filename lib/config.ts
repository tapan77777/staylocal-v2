export const brand = {
  name: 'StayLocal',
  tagline: 'Thoughtfully planned trips across India.',
  description:
    'StayLocal plans small-group and private trips across India with transparent pricing, clear itineraries, and personal support from enquiry to departure.',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://staylocal-v2.vercel.app',
  established: 2024,
  whatsapp: {
    number: '919178628894',
    display: '+91 91786 28894',
  },
  email: 'hello@staylocal.in',
  responseTime: 'within a few hours',
  supportHours: 'Mon–Sat, 9 AM to 8 PM IST',
} as const

export function waLink(message?: string): string {
  const base = `https://wa.me/${brand.whatsapp.number}`
  return message ? `${base}?text=${encodeURIComponent(message)}` : base
}
