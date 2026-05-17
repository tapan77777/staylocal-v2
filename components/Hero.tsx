export default function Hero() {
  return (
    <section style={{ position: 'relative', overflow: 'hidden', padding: '28px 20px 28px', textAlign: 'center' }}>

      {/* Background image — blurry */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: "url('https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1400&q=80')",
          backgroundSize: 'cover',
          backgroundPosition: 'center 30%',
          filter: 'blur(8px)',
          transform: 'scale(1.08)',
          opacity: 0.18,
        }}
      />

      {/* Gradient overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(to bottom, rgba(250,250,248,0.85) 0%, rgba(250,250,248,0.95) 100%)',
      }} />

      {/* Hero content */}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 640, margin: '0 auto' }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--green)', marginBottom: 16 }}>
          Slow travel · Real places
        </p>
        <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: 42, fontWeight: 700, lineHeight: 1.15, color: '#1a1a1a', marginBottom: 16 }}>
          Travel that feels <em style={{ fontStyle: 'italic' }}>alive.</em>
        </h1>
        <p style={{ fontSize: 17, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 32 }}>
          Small groups. Real homestays. Places most tourists never find.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 40 }}>
          <a href="#trips" style={{ background: 'var(--green)', color: '#fff', padding: '13px 28px', borderRadius: 999, textDecoration: 'none', fontWeight: 600, fontSize: 15 }}>
            Explore trips
          </a>
          <a href="#about" style={{ background: 'transparent', color: '#1a1a1a', padding: '13px 28px', borderRadius: 999, textDecoration: 'none', fontWeight: 600, fontSize: 15, border: '1.5px solid var(--border)' }}>
            Our story
          </a>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap' }}>
          {['Real founder-led trips', 'No hidden charges', 'Est. 2024'].map(item => (
            <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', display: 'inline-block', flexShrink: 0 }} />
              {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
