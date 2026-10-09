'use client'

export default function SearchBar() {
  const open = () => {
    window.dispatchEvent(new CustomEvent('planner:open'))
  }
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      open()
    }
  }

  return (
    <section
      aria-label="Search trips"
      style={{
        position: 'relative',
        padding: '0 20px',
        marginTop: 'clamp(-28px, -3vh, -16px)',
        zIndex: 4,
      }}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={open}
        onKeyDown={onKey}
        aria-label="Open trip planner"
        className="searchbar lift"
      >
        <span
          aria-hidden
          style={{
            display: 'inline-flex',
            width: 36,
            height: 36,
            borderRadius: 999,
            background: 'var(--green-light)',
            color: 'var(--green-dark)',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
            <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.8" />
            <path d="m13.5 13.5 3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </span>
        <span className="searchbar-placeholder">
          Search your next adventure…
        </span>
        <span className="searchbar-chip">
          Plan trip
        </span>
      </div>

      <style>{`
        .searchbar {
          max-width: 720px;
          margin: 0 auto;
          background: #fff;
          border: 1px solid var(--border);
          border-radius: 18px;
          padding: 10px 12px 10px 14px;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          box-shadow: 0 18px 36px -18px rgba(10,20,15,0.25), 0 1px 2px rgba(10,20,15,0.04);
          outline: none;
        }
        .searchbar:focus-visible {
          box-shadow: 0 0 0 3px var(--green-light), 0 18px 36px -18px rgba(10,20,15,0.25);
          border-color: var(--green);
        }
        .searchbar-placeholder {
          flex: 1;
          font-size: 14.5px;
          color: var(--text-secondary);
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .searchbar-chip {
          background: var(--green);
          color: #fff;
          padding: 8px 14px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 600;
          flex-shrink: 0;
        }
        @media (min-width: 720px) {
          .searchbar { padding: 12px 14px 12px 18px; border-radius: 999px; }
          .searchbar-placeholder { font-size: 15px; }
          .searchbar-chip { padding: 10px 18px; font-size: 14px; }
        }
      `}</style>
    </section>
  )
}
