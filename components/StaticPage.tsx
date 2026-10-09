import Navbar from './Navbar'
import Footer from './Footer'

interface Props {
  eyebrow?: string
  title: string
  intro?: string
  children: React.ReactNode
}

export default function StaticPage({ eyebrow, title, intro, children }: Props) {
  return (
    <>
      <Navbar />
      <main style={{ maxWidth: 820, margin: '0 auto', padding: '40px 20px 48px' }}>
        {eyebrow && (
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--green)',
              marginBottom: 10,
            }}
          >
            {eyebrow}
          </p>
        )}
        <h1
          style={{
            fontFamily: 'var(--font-playfair)',
            fontSize: 'clamp(28px, 4vw, 40px)',
            fontWeight: 700,
            lineHeight: 1.15,
            marginBottom: 16,
          }}
        >
          {title}
        </h1>
        {intro && (
          <p style={{ color: 'var(--text-secondary)', fontSize: 16, lineHeight: 1.6, marginBottom: 32 }}>
            {intro}
          </p>
        )}
        <article
          style={{
            fontSize: 15,
            lineHeight: 1.7,
            color: '#1a1a1a',
          }}
        >
          {children}
        </article>
      </main>
      <Footer />
    </>
  )
}
