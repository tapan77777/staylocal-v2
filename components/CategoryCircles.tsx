'use client'

export const CATEGORIES = [
  { id: 'All', label: 'All', emoji: '🗺️' },
  { id: 'Mountains', label: 'Mountains', emoji: '⛰️' },
  { id: 'Islands', label: 'Islands', emoji: '🏝️' },
  { id: 'Wildlife', label: 'Wildlife', emoji: '🐘' },
  { id: 'Trekking', label: 'Trekking', emoji: '🥾' },
  { id: 'Beaches', label: 'Beaches', emoji: '🏖️' },
  { id: 'Culture', label: 'Culture', emoji: '🏛️' },
]

interface Props {
  active: string
  onChange: (cat: string) => void
}

export default function CategoryCircles({ active, onChange }: Props) {
  return (
    <div
      role="tablist"
      aria-label="Filter trips by category"
      className="hide-scrollbar"
      style={{
        display: 'flex',
        gap: 18,
        overflowX: 'auto',
        padding: '8px 20px 10px',
      }}
    >
      {CATEGORIES.map(cat => {
        const isActive = active === cat.id
        return (
          <button
            key={cat.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(cat.id)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 2px',
              flexShrink: 0,
              fontFamily: 'inherit',
            }}
          >
            <div
              style={{
                width: 62,
                height: 62,
                borderRadius: '50%',
                background: isActive ? 'var(--green)' : '#fff',
                color: isActive ? '#fff' : 'inherit',
                border: `1.5px solid ${isActive ? 'var(--green)' : 'var(--border)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 26,
                boxShadow: isActive
                  ? '0 10px 20px -10px rgba(29,158,117,0.5)'
                  : 'var(--shadow-sm)',
                transition: 'background 200ms, border-color 200ms, box-shadow 200ms',
              }}
            >
              <span aria-hidden>{cat.emoji}</span>
            </div>
            <span
              style={{
                fontSize: 12,
                fontWeight: isActive ? 700 : 500,
                color: isActive ? 'var(--green-dark)' : 'var(--text-secondary)',
                whiteSpace: 'nowrap',
                letterSpacing: '0.01em',
              }}
            >
              {cat.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
