import Reveal from './Reveal'

const STEPS = [
  {
    n: 1,
    title: 'Explore trips',
    body: 'Browse published packages, filter by destination, duration, and budget.',
  },
  {
    n: 2,
    title: 'Review the details',
    body: 'See itinerary, inclusions, exclusions, pricing basis, and cancellation terms upfront.',
  },
  {
    n: 3,
    title: 'Send an enquiry',
    body: 'Share your name, phone, group size, and preferred month — takes 30 seconds.',
  },
  {
    n: 4,
    title: 'Confirmation & booking',
    body: 'We reply on WhatsApp with availability, final quote, and booking instructions. Only confirmed once advance is received.',
  },
]

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      style={{
        padding: 'clamp(56px, 9vh, 96px) 20px',
        background: 'var(--bg)',
      }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <Reveal>
          <div style={{ marginBottom: 32, textAlign: 'center' }}>
            <p className="eyebrow" style={{ marginBottom: 10 }}>How booking works</p>
            <h2 className="section-title">From first click to departure day.</h2>
            <p
              style={{
                color: 'var(--text-secondary)',
                fontSize: 'clamp(14px, 1.4vw, 16px)',
                marginTop: 10,
                maxWidth: 560,
                margin: '10px auto 0',
                lineHeight: 1.6,
              }}
            >
              Enquiring is free — you&apos;re only booked once we both confirm and an advance is paid.
            </p>
          </div>
        </Reveal>

        <ol
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
            gap: 14,
          }}
        >
          {STEPS.map((s, i) => (
            <Reveal key={s.n} as="li" delay={i * 80}>
              <div
                className="lift"
                style={{
                  background: '#fff',
                  border: '1px solid var(--border)',
                  borderRadius: 18,
                  padding: '22px 22px 24px',
                  height: '100%',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 18,
                    right: 20,
                    fontFamily: 'var(--font-playfair)',
                    fontSize: 44,
                    fontWeight: 700,
                    lineHeight: 1,
                    color: 'rgba(29,158,117,0.14)',
                  }}
                >
                  {s.n.toString().padStart(2, '0')}
                </div>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 999,
                    background: 'var(--green-light)',
                    color: 'var(--green)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    marginBottom: 12,
                    fontSize: 13,
                  }}
                >
                  {s.n}
                </div>
                <p
                  style={{
                    fontFamily: 'var(--font-playfair)',
                    fontWeight: 700,
                    fontSize: 18,
                    marginBottom: 6,
                    letterSpacing: '-0.005em',
                  }}
                >
                  {s.title}
                </p>
                <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {s.body}
                </p>
              </div>
            </Reveal>
          ))}
        </ol>

        <p
          style={{
            marginTop: 20,
            textAlign: 'center',
            fontSize: 12,
            color: 'var(--text-muted)',
          }}
        >
          Enquiry received ≠ booking confirmed. Confirmation is explicit and shared in writing.
        </p>
      </div>
    </section>
  )
}
