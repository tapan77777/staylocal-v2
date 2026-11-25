import type { CSSProperties } from 'react'
import type { TrekContent } from '@/lib/treks/schema'
import { routeIsVerified } from '@/lib/treks/schema'
import s from './Treks.module.css'

export default function ElevationProfile({ content }: { content: TrekContent }) {
  const points = content.stages
    .map((p, i) => ({ altitude: p.altitudeM, day: i + 1, title: p.campsite || p.title }))
    .filter((p): p is { altitude: number; day: number; title: string } => p.altitude !== null)

  if (!routeIsVerified(content) || points.length < 2) {
    return (
      <p className={s.routeFallback}>
        A profile will be available when reviewed stage elevations are documented. No elevation values have been estimated.
      </p>
    )
  }

  const low = Math.min(...points.map(p => p.altitude))
  const high = Math.max(...points.map(p => p.altitude))
  const range = Math.max(100, high - low)

  // SVG dimensions
  const svgW = 600, svgH = 220
  const padL = 55, padR = 20, padT = 36, padB = 44
  const chartW = svgW - padL - padR
  const chartH = svgH - padT - padB

  const scaled = points.map((p, i) => ({
    ...p,
    x: padL + (i / (points.length - 1)) * chartW,
    y: padT + chartH - ((p.altitude - low) / range) * chartH,
  }))

  const peakPt = scaled.reduce((a, b) => (a.altitude > b.altitude ? a : b))
  const polyline = scaled.map(p => `${p.x},${p.y}`).join(' ')
  const motionPath = scaled.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')

  // Y-axis grid lines (3 lines)
  const gridLines = [0, 0.5, 1].map(frac => ({
    y: padT + chartH - frac * chartH,
    label: `${Math.round(low + frac * range).toLocaleString('en-IN')} m`,
  }))

  return (
    <figure className={s.profile}>
      <figcaption>
        <strong>
          Stage elevation profile
          {high > 0 && (
            <span className={s.profilePeak}>
              ⬆ {high.toLocaleString('en-IN')} m peak
            </span>
          )}
        </strong>
        <span>
          {content.fixture
            ? 'Artificial UI fixture values · not a real trail'
            : 'Reviewed stage elevations — not a continuous GPS terrain profile'}
        </span>
      </figcaption>

      <svg
        viewBox={`0 0 ${svgW} ${svgH}`}
        role="img"
        aria-label={points.map(p => `Day ${p.day}: ${p.altitude} metres`).join('; ')}
      >
        {/* Grid lines */}
        {gridLines.map(gl => (
          <g key={gl.y}>
            <line
              x1={padL} y1={gl.y} x2={svgW - padR} y2={gl.y}
              stroke="rgba(255,255,255,0.08)" strokeWidth="1"
            />
            <text
              x={padL - 7} y={gl.y + 4}
              textAnchor="end" fontSize="10"
              fill="rgba(255,255,255,0.4)"
            >
              {gl.label}
            </text>
          </g>
        ))}

        {/* Area fill under line */}
        <defs>
          <linearGradient id="elevGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5eead4" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#5eead4" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <polygon
          className={s.elevArea}
          points={[
            `${scaled[0].x},${padT + chartH}`,
            ...scaled.map(p => `${p.x},${p.y}`),
            `${scaled[scaled.length - 1].x},${padT + chartH}`,
          ].join(' ')}
          fill="url(#elevGrad)"
        />

        {/* Elevation line — teal, draws itself in (pathLength=1 lets CSS animate the dash) */}
        <polyline
          className={s.elevLine}
          pathLength={1}
          points={polyline}
          stroke="#5eead4"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Stage dots */}
        {scaled.map((p, idx) => {
          const isPeak = p === peakPt
          return (
            <g key={p.day} className={s.elevDot} style={{ '--i': idx } as CSSProperties}>
              {/* Larger invisible hit area for hover */}
              <circle cx={p.x} cy={p.y} r={16} fill="transparent" />
              {/* Dot */}
              <circle
                cx={p.x} cy={p.y}
                r={isPeak ? 7 : 5}
                fill={isPeak ? '#fbbf24' : '#0a1512'}
                stroke={isPeak ? '#fff' : '#5eead4'}
                strokeWidth={2}
              />
              {/* Altitude label */}
              <text
                x={p.x} y={p.y - 12}
                textAnchor="middle" fontSize="10"
                fill={isPeak ? '#fbbf24' : 'rgba(255,255,255,0.7)'}
                fontWeight={isPeak ? '700' : '400'}
              >
                {p.altitude.toLocaleString('en-IN')} m
              </text>
              {/* Day label */}
              <text
                x={p.x} y={svgH - 6}
                textAnchor="middle" fontSize="10"
                fill="rgba(255,255,255,0.5)"
              >
                D{p.day}
              </text>
            </g>
          )
        })}

        {/* Walker — loops along the route (SMIL, works in all browsers) */}
        <g className={s.elevWalker} aria-hidden>
          <animateMotion dur="7s" repeatCount="indefinite" path={motionPath} />
          <circle r="11" fill="rgba(251,191,36,0.22)">
            <animate attributeName="r" values="9;14;9" dur="1.6s" repeatCount="indefinite" />
          </circle>
          <circle r="4.5" fill="#fbbf24" stroke="#fff" strokeWidth="1.5" />
        </g>
      </svg>
    </figure>
  )
}