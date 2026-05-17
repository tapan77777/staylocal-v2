const items = [
  {
    icon: '🚫',
    title: 'Not a package tour',
    desc: 'No rushed buses, no tourist traps. We move at a pace that lets places sink in.'
  },
  {
    icon: '👥',
    title: 'Max 8 people',
    desc: 'Small enough to get personal. Big enough to share the magic with good company.'
  },
  {
    icon: '🏠',
    title: 'Local homestays',
    desc: 'Sleep where locals live. Eat what they eat. See what they see.'
  },
  {
    icon: '🧭',
    title: 'Founder-led',
    desc: "Tapan designs every trip himself. You're travelling with someone who's been there."
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
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 14 }}>
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
