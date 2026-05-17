'use client'
import { useState } from 'react'

const CATEGORIES = [
  { id: 'All', label: 'All', emoji: '🗺️' },
  { id: 'Mountains', label: 'Mountains', emoji: '⛰️' },
  { id: 'Islands', label: 'Islands', emoji: '🏝️' },
  { id: 'Wildlife', label: 'Wildlife', emoji: '🐘' },
  { id: 'Trek', label: 'Trek', emoji: '🥾' },
  { id: 'Beach', label: 'Beach', emoji: '🏖️' },
]

interface Props {
  active: string
  onChange: (cat: string) => void
}

export default function CategoryFilter({ active, onChange }: Props) {
  return (
    <div className="hide-scrollbar" style={{ display: 'flex', gap: 20, overflowX: 'auto', padding: '4px 20px 4px' }}>
      {CATEGORIES.map(cat => {
        const isActive = active === cat.id
        return (
          <button
            key={cat.id}
            onClick={() => onChange(cat.id)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px 4px',
              flexShrink: 0,
              borderBottom: isActive ? '2px solid var(--green)' : '2px solid transparent',
            }}
          >
            <div style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: isActive ? 'var(--green-light)' : 'var(--bg-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20
            }}>
              {cat.emoji}
            </div>
            <span style={{ fontSize: 12, fontWeight: isActive ? 600 : 400, color: isActive ? 'var(--green)' : 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
              {cat.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
