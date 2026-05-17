const items = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
    title: 'Curated packages',
    desc: 'Hotels, resorts, ferries and activities — all handpicked and pre-arranged for you',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: 'Any group size',
    desc: 'Solo travellers, couples, families or large groups — we arrange for everyone',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
    title: 'Local expertise',
    desc: 'Our ground partners have been operating for 9+ years on every destination',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    title: 'Real support',
    desc: 'Direct WhatsApp support before, during and after your trip — always reachable',
  },
]

export default function WhySection() {
  return (
    <section id="about" style={{ background: 'var(--bg)', padding: '56px 20px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: 28, fontWeight: 700, color: '#1a1a1a', marginBottom: 32, textAlign: 'center' }}>
          Why StayLocal?
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {items.map(item => (
            <div key={item.title} style={{ background: 'var(--bg-muted)', borderRadius: 16, padding: '24px 20px' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                {item.icon}
              </div>
              <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>{item.title}</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
