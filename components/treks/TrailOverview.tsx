'use client'
import { useRef, useState } from 'react'
import type { TrekContent } from '@/lib/treks/schema'
import { routeIsVerified } from '@/lib/treks/schema'
import TrekPhoto from './TrekPhoto'
import s from './Treks.module.css'
export default function TrailOverview({ content }: { content: TrekContent }) {
  const [selected, setSelected] = useState(0)
  const stageRefs = useRef<(HTMLDetailsElement | null)[]>([])
  const stages = content.stages
  const located = routeIsVerified(content) ? stages.map((stage, index) => ({ ...stage, index })).filter(p => p.latitude !== null && p.longitude !== null) : []
  const latitudes = located.map(p => p.latitude!), longitudes = located.map(p => p.longitude!)
  const minLat = Math.min(...latitudes), maxLat = Math.max(...latitudes), minLng = Math.min(...longitudes), maxLng = Math.max(...longitudes)
  const projected = located.map(p => ({ ...p, x: 45 + ((p.longitude! - minLng) / Math.max(maxLng - minLng, .00001)) * 510, y: 235 - ((p.latitude! - minLat) / Math.max(maxLat - minLat, .00001)) * 180 }))
  function select(index: number, scroll = true) {
    // Native disclosure can be closed while its stage is still selected.
    // Reopen it even when selecting the same index would not trigger a React render.
    const stage = stageRefs.current[index]
    if (stage) stage.open = true
    setSelected(index)
    if (scroll) stage?.scrollIntoView({ behavior: 'auto', block: 'nearest' })
  }
  return <>
    <section id="trail" className={s.detailSection}><p className={s.eyebrow}>01 · The trail</p><h2>A route you can read.</h2><p className={s.prose}>{content.routeOverview}</p>
      {projected.length >= 2 ? <div className={s.routeMap}><p className={s.caption}>Verified waypoints · Dashed connections show sequence, not a navigable trail trace.</p><svg viewBox="0 0 600 280" role="group" aria-label="Interactive route waypoint overview"><polyline points={projected.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke="#b6c9a8" strokeWidth="3" strokeDasharray="7 7" />{projected.map(p => <g key={p.id} role="button" tabIndex={0} aria-label={`Show day ${p.index + 1}: ${p.title}`} aria-pressed={selected === p.index} onClick={() => select(p.index)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(p.index) } }}><circle cx={p.x} cy={p.y} r={selected === p.index ? 18 : 14} fill={selected === p.index ? '#14583e' : '#fff'} stroke="#14583e" strokeWidth="2"/><text x={p.x} y={p.y + 5} textAnchor="middle" fill={selected === p.index ? 'white' : '#14583e'} fontSize="12">{p.index + 1}</text></g>)}</svg></div> : <p className={s.routeFallback}>A geographic map is not available: a complete set of verified coordinates has not been supplied. Follow the documented stages below and confirm navigation arrangements with the operator.</p>}
      <ol className={s.stageNav}>{stages.map((stage, i) => <li key={stage.id}><button type="button" aria-pressed={selected === i} onClick={() => select(i)}><span>{String(i + 1).padStart(2, '0')}</span><strong>{stage.campsite || stage.title}</strong><small>{stage.mode === 'WALK' ? 'Trail stage' : stage.mode === 'REST' ? 'Rest day' : 'Travel day'}</small></button></li>)}</ol>
      {routeIsVerified(content) && <p className={s.caption}>Route source: {content.routeVerification.source} · Reviewed {content.routeVerification.reviewedOn}</p>}
    </section>
    <section id="itinerary" className={s.detailSection}><p className={s.eyebrow}>02 · Day by day</p><h2>Every stage has a story.</h2><p className={s.prose}>Open a day, or choose a stage in the route overview. Travel and rest days are identified separately.</p>
      {stages.map((stage, i) => <details key={stage.id} ref={node => { stageRefs.current[i] = node }} className={s.day} open={selected === i} onToggle={e => { if (e.currentTarget.open && selected !== i) select(i, false) }}><summary><span className={s.dayNumber}>{String(i + 1).padStart(2, '0')}</span><span><small>Day {i + 1} · {stage.mode.toLowerCase()}</small><strong>{stage.title}</strong></span><span aria-hidden>＋</span></summary><div className={s.dayBody}><div className={s.dayFacts}>{stage.distanceKm !== null && routeIsVerified(content) && <span>{stage.distanceKm} km {stage.mode === 'WALK' ? 'trail' : 'travel'}</span>}{stage.walkingHours !== null && <span>{stage.walkingHours} hours {stage.mode === 'WALK' ? 'walking' : 'on the road'}</span>}{stage.altitudeM !== null && routeIsVerified(content) && <span>{stage.altitudeM.toLocaleString('en-IN')} m elevation</span>}{stage.campsite && <span>Stay: {stage.campsite}</span>}</div><p className={s.prose}>{stage.description}</p><div className={s.dayPhotos}>{stage.photos.map((photo, j) => <figure key={`${photo.src}-${j}`}><div><TrekPhoto photo={photo} sizes="(max-width: 600px) 90vw, 350px" /></div>{photo.caption && <figcaption>{photo.caption}</figcaption>}</figure>)}</div>{stage.latitude !== null && stage.longitude !== null && routeIsVerified(content) && <a className={s.textLink} href={`https://www.openstreetmap.org/?mlat=${stage.latitude}&mlon=${stage.longitude}#map=13/${stage.latitude}/${stage.longitude}`} target="_blank" rel="noopener noreferrer">View verified waypoint on OpenStreetMap ↗</a>}</div></details>)}
    </section>
  </>
}
