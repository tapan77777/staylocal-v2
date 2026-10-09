import Reveal from './Reveal'

const items = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
    title: 'Curated packages',
    desc: 'Hotels, resorts, ferries, and activities — all handpicked and pre-arranged for you.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: 'Any group size',
    desc: 'Solo travellers, couples, families, or large groups — we plan for everyone.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
    title: 'Local knowledge',
    desc: 'Trips planned with ground partners we actually know — not white-label, off-the-shelf packages.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    title: 'Real support',
    desc: 'Direct WhatsApp support before, during, and after your trip — from a real person on our team.',
  },
]

export default function WhySection() {
  return (
    <section
      id="about"
      style={{
        background: '#fff',
        padding: 'clamp(56px, 9vh, 96px) 20px',
        borderTop: '1px solid var(--border-light)',
      }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <Reveal>
          <div style={{ maxWidth: 680, marginBottom: 36 }}>
            <p className="eyebrow" style={{ marginBottom: 10 }}>Why StayLocal</p>
            <h2 className="section-title">The travel partner, not a middleman.</h2>
            <p
              style={{
                color: 'var(--text-secondary)',
                fontSize: 'clamp(14px, 1.4vw, 16px)',
                lineHeight: 1.6,
                marginTop: 10,
              }}
            >
              We&apos;re small on purpose. Every trip is planned, confirmed, and supported by
              the same team you spoke to on day one.
            </p>
          </div>
        </Reveal>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 14,
          }}
        >
          {items.map((item, i) => (
            <Reveal key={item.title} delay={i * 70}>
              <div
                className="lift"
                style={{
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 18,
                  padding: '26px 22px',
                  height: '100%',
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: 'var(--green-light)',
                    color: 'var(--green)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 14,
                  }}
                >
                  {item.icon}
                </div>
                <h3
                  style={{
                    fontFamily: 'var(--font-playfair)',
                    fontWeight: 700,
                    fontSize: 18,
                    marginBottom: 8,
                    letterSpacing: '-0.005em',
                  }}
                >
                  {item.title}
                </h3>
                <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {item.desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
