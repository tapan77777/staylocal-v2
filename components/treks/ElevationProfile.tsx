import type { TrekContent } from '@/lib/treks/schema'
import { routeIsVerified } from '@/lib/treks/schema'
import s from './Treks.module.css'
export default function ElevationProfile({ content }: { content: TrekContent }) {
  const points = content.stages.map((p, i) => ({ altitude: p.altitudeM, day: i + 1, title: p.campsite || p.title })).filter((p): p is { altitude: number; day: number; title: string } => p.altitude !== null)
  if (!routeIsVerified(content) || points.length < 2) return <p className={s.routeFallback}>A profile will be available when reviewed stage elevations are documented. No elevation values have been estimated.</p>
  const low = Math.min(...points.map(p => p.altitude)), high = Math.max(...points.map(p => p.altitude))
  const scaled = points.map((p, i) => ({ ...p, x: 65 + i / (points.length - 1) * 470, y: 160 - (p.altitude - low) / Math.max(100, high - low) * 105 }))
  return <figure className={s.profile}><figcaption><strong>Stage elevation profile</strong><span>{content.fixture ? 'Artificial UI fixture values · not a real trail' : 'Reviewed stage elevations, not a continuous GPS terrain profile'}</span></figcaption><svg viewBox="0 0 600 220" role="img" aria-label={points.map(p => `Day ${p.day}: ${p.altitude} metres`).join('; ')}><line x1="35" y1="180" x2="570" y2="180" stroke="#d8e2d5"/><polyline points={scaled.map(p => `${p.x},${p.y}`).join(' ')} stroke="#2c7150" strokeWidth="3" fill="none"/>{scaled.map(p => <g key={p.day}><circle cx={p.x} cy={p.y} r="5" fill="#2c7150"/><text x={p.x} y={p.y - 12} textAnchor="middle" fontSize="12" fill="#264d38">{p.altitude} m</text><text x={p.x} y="204" textAnchor="middle" fontSize="12" fill="#52654a">Day {p.day}</text></g>)}</svg></figure>
}
