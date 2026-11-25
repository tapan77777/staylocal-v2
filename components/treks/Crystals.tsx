import type { CSSProperties } from 'react'
import s from './Treks.module.css'

/** x / y = position in %, w = width in px, r = base rotation, d = animation delay (s).
 *  Every 3rd item is rendered as a small twinkling sparkle (see CSS). */
const SHARDS = [
  { x: 72, y: 12, w: 70, r: 14, d: 0 },
  { x: 86, y: 44, w: 46, r: -18, d: -2 },
  { x: 64, y: 60, w: 14, r: 0, d: -1 },
  { x: 92, y: 8, w: 30, r: 24, d: -4 },
  { x: 78, y: 68, w: 56, r: -8, d: -6 },
  { x: 55, y: 24, w: 12, r: 0, d: -3 },
  { x: 96, y: 66, w: 34, r: 30, d: -3 },
  { x: 44, y: 76, w: 40, r: -22, d: -5 },
  { x: 32, y: 14, w: 12, r: 0, d: -2 },
]

export default function Crystals() {
  return (
    <div className={s.crystals} aria-hidden>
      {SHARDS.map((c, i) => (
        <i
          key={i}
          style={
            {
              left: `${c.x}%`,
              top: `${c.y}%`,
              '--w': `${c.w}px`,
              '--r': `${c.r}deg`,
              '--d': `${c.d}s`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}