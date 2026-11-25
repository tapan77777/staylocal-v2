'use client'
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import type { TrekContent } from '@/lib/treks/schema'
import { routeIsVerified } from '@/lib/treks/schema'
import TrekPhoto from './TrekPhoto'
import s from './Treks.module.css'

type Stage = TrekContent['stages'][number]

/** Wraps distances, altitudes and durations in <mark> so key facts pop out of the story text. */
const KEY_FACT = /(\d[\d,.]*\s?(?:metres|meters|km|kilometres|kilometers|hours|hour|hrs|hr|m|°C)\b)/gi
function highlight(text: string) {
  return text.split(KEY_FACT).map((part, i) =>
    i % 2 === 1 ? <mark key={i} className={s.hl}>{part}</mark> : part,
  )
}

const modeKey = (m: string) => (m === 'WALK' ? 'walk' : m === 'REST' ? 'rest' : 'travel')
const modeLabel = (m: string) => (m === 'WALK' ? 'Trail day' : m === 'REST' ? 'Rest day' : 'Travel day')

/**
 * Route sequence map. Real lat/lng projections squash nearby camps together and drop
 * stages without coordinates, so this draws every stage evenly along a winding trail:
 * solid = covered up to the selected day, dashed = still ahead.
 * Not geographic — the caption says so. Verified coordinates remain available per day (OpenStreetMap link).
 */
function RouteSchematic({
  stages,
  verified,
  selected,
  onSelect,
  onOpen,
}: {
  stages: Stage[]
  verified: boolean
  selected: number
  onSelect: (i: number) => void
  onOpen: (i: number) => void
}) {
  const n = stages.length
  const W = 640, H = 240, padX = 46
  const step = n > 1 ? (W - padX * 2) / (n - 1) : 0
  const pts = stages.map((_, i) => ({ x: padX + i * step, y: i % 2 === 0 ? 150 : 96 }))
  const seg = (i: number) => {
    const a = pts[i], b = pts[i + 1], mx = (a.x + b.x) / 2
    return `M${a.x},${a.y} C${mx},${a.y} ${mx},${b.y} ${b.x},${b.y}`
  }
  const st = stages[selected] ?? stages[0]
  const alt = (x: Stage) => (verified && x.altitudeM !== null ? `${x.altitudeM.toLocaleString('en-IN')} m` : '')
  const go = (d: number) => onSelect(Math.min(n - 1, Math.max(0, selected + d)))

  const onKey = (e: KeyboardEvent<SVGGElement>, i: number) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(i) }
    else if (e.key === 'ArrowRight') { e.preventDefault(); go(1) }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1) }
  }

  return (
    <div className={s.rm}>
      <div className={s.rmLegend} aria-hidden>
        <span data-mode="walk">Trail day</span>
        <span data-mode="travel">Travel day</span>
        <span data-mode="rest">Rest day</span>
        <em>Solid line = covered · dashed = still ahead</em>
      </div>

      <div className={s.rmScroll}>
        <svg className={s.rmSvg} viewBox={`0 0 ${W} ${H}`} role="group" aria-label={`Route overview with ${n} stages. Select a stage to read its summary.`}>
          {/* trail segments */}
          {pts.slice(0, -1).map((_, i) => (
            <path key={i} d={seg(i)} className={`${s.rmSeg} ${i < selected ? s.rmSegDone : ''}`} fill="none" />
          ))}

          {pts.map((pt, i) => {
            const stage = stages[i]
            const active = i === selected
            const r = active ? 20 : 16
            return (
              <g
                key={stage.id}
                className={s.rmNode}
                data-mode={modeKey(stage.mode)}
                data-active={active ? 'true' : undefined}
                style={{ '--i': i } as CSSProperties}
                role="button"
                tabIndex={0}
                aria-label={`Day ${i + 1}: ${stage.title}. ${modeLabel(stage.mode)}${alt(stage) ? `, ${alt(stage)}` : ''}`}
                aria-pressed={active}
                onClick={() => onSelect(i)}
                onKeyDown={e => onKey(e, i)}
              >
                {/* bigger invisible hit area */}
                <circle cx={pt.x} cy={pt.y} r={26} fill="transparent" />
                {/* guide down to the label row */}
                <line className={s.rmGuide} x1={pt.x} y1={pt.y + r + 3} x2={pt.x} y2={H - 46} />
                {active && <circle className={s.rmRing} cx={pt.x} cy={pt.y} r={r + 4} />}
                <circle className={s.rmDot} cx={pt.x} cy={pt.y} r={r} />
                <text className={s.rmNum} x={pt.x} y={pt.y + 5} textAnchor="middle">{i + 1}</text>
                {(i === 0 || i === n - 1) && (
                  <text className={s.rmTag} x={pt.x} y={pt.y - r - 9} textAnchor="middle">{i === 0 ? 'START' : 'FINISH'}</text>
                )}
                <text className={s.rmDay} x={pt.x} y={H - 28} textAnchor="middle">Day {i + 1}</text>
                {alt(stage) && <text className={s.rmAlt} x={pt.x} y={H - 11} textAnchor="middle">{alt(stage)}</text>}
              </g>
            )
          })}
        </svg>
      </div>

      {/* Selected stage summary */}
      <div className={s.rmPanel} key={selected} aria-live="polite">
        <span className={s.rmBadge} data-mode={modeKey(st.mode)}>{String(selected + 1).padStart(2, '0')}</span>
        <div className={s.rmPanelBody}>
          <small>Day {selected + 1} · {modeLabel(st.mode)}</small>
          <strong>{st.title}</strong>
          <div className={s.rmChips}>
            {st.distanceKm !== null && verified && <span>📍 {st.distanceKm} km {st.mode === 'WALK' ? 'trail' : 'travel'}</span>}
            {st.walkingHours !== null && verified && <span>⏱ {st.walkingHours}h {st.mode === 'WALK' ? 'walking' : 'driving'}</span>}
            {alt(st) && <span>⬆ {alt(st)}</span>}
            {st.campsite && <span>🏕 {st.campsite}</span>}
          </div>
        </div>
        <div className={s.rmActions}>
          <button type="button" onClick={() => go(-1)} disabled={selected === 0} aria-label="Previous stage">←</button>
          <button type="button" onClick={() => go(1)} disabled={selected === n - 1} aria-label="Next stage">→</button>
          <button type="button" className={s.rmOpen} onClick={() => onOpen(selected)}>Day notes ↓</button>
        </div>
      </div>
    </div>
  )
}

export default function TrailOverview({ content }: { content: TrekContent }) {
  const [selected, setSelected] = useState(0)
  const stageRefs = useRef<(HTMLDetailsElement | null)[]>([])
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const indRef = useRef<HTMLDivElement>(null)
  const stages = content.stages

  const verified = routeIsVerified(content)

  // Itinerary highlights (only from reviewed data)
  const trailDays = stages.filter(x => x.mode === 'WALK').length
  const totalKm = verified ? stages.reduce((sum, x) => sum + (x.mode === 'WALK' && x.distanceKm ? x.distanceKm : 0), 0) : 0
  let peakIdx = -1
  if (verified) {
    stages.forEach((x, i) => {
      if (x.altitudeM !== null && (peakIdx === -1 || x.altitudeM > (stages[peakIdx].altitudeM ?? 0))) peakIdx = i
    })
  }
  const peakAlt = peakIdx >= 0 ? stages[peakIdx].altitudeM : null

  // Move the sliding white indicator to the active tab
  function moveIndicator(index: number) {
    const tab = tabRefs.current[index]
    const ind = indRef.current
    if (!tab || !ind) return
    ind.style.width = `${tab.offsetWidth}px`
    ind.style.transform = `translateX(${tab.offsetLeft}px)`
  }

  useEffect(() => {
    // Slight delay so layout is settled before measuring
    const id = setTimeout(() => moveIndicator(selected), 60)
    return () => clearTimeout(id)
  }, [selected])

  function select(index: number, scroll = true) {
    const stage = stageRefs.current[index]
    if (stage) stage.open = true
    setSelected(index)
    if (scroll) stage?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    // Scroll active tab into view inside the pill
    if (scroll) tabRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }

  return (
    <>
      {/* ── 01 Trail Section ─────────────────────────── */}
      <section id="trail" className={s.detailSection}>
        <p className={s.eyebrow}>01 · The trail</p>
        <h2>A route you can read.</h2>
        <p className={s.prose}>{content.routeOverview}</p>

        {/* Route sequence map + selected-stage summary */}
        {stages.length >= 2 && (
          <>
            <RouteSchematic
              stages={stages}
              verified={verified}
              selected={selected}
              onSelect={i => select(i, false)}
              onOpen={i => select(i, true)}
            />
            <p className={s.caption}>
              Stage sequence overview · not to scale and not a navigable trail trace. Follow your guide for navigation.
            </p>
          </>
        )}

        {/* Stage selector grid (compact) */}
        <ol className={s.stageNav}>
          {stages.map((stage, i) => (
            <li key={stage.id}>
              <button
                type="button"
                aria-pressed={selected === i}
                onClick={() => select(i)}
              >
                <span>{String(i + 1).padStart(2, '0')}</span>
                <strong>{stage.title}</strong>
                <small>
                  {stage.mode === 'WALK' ? 'Trail stage' : stage.mode === 'REST' ? 'Rest day' : 'Travel day'}
                  {stage.campsite ? ` · ${stage.campsite}` : ''}
                </small>
              </button>
            </li>
          ))}
        </ol>

        {verified && (
          <p className={s.caption}>
            Route source: {content.routeVerification.source} · Reviewed {content.routeVerification.reviewedOn}
          </p>
        )}
      </section>

      {/* ── 02 Day-by-Day Itinerary ───────────────────── */}
      <section id="itinerary" className={s.detailSection}>
        <p className={s.eyebrow}>02 · Day by day</p>
        <h2>Every stage has a story.</h2>
        <p className={s.prose}>
          Select a day to read its trail notes. Travel and rest days are identified separately.
        </p>

        {/* Highlights strip + progress through the trek */}
        {stages.length > 1 && (
          <div className={s.itinHead}>
            <div className={s.itinStats}>
              <span><b>{stages.length}</b> days</span>
              {trailDays > 0 && <span><b>{trailDays}</b> trail {trailDays === 1 ? 'day' : 'days'}</span>}
              {totalKm > 0 && <span><b>{Math.round(totalKm * 10) / 10}</b> km on foot</span>}
              {peakAlt !== null && <span className={s.itinPeak}>⛰ <b>{peakAlt.toLocaleString('en-IN')} m</b> · Day {peakIdx + 1}</span>}
            </div>
            <div className={s.itinBar} aria-hidden>
              <i style={{ '--p': (selected + 1) / stages.length } as CSSProperties} />
            </div>
            <p className={s.itinNow}>Day {selected + 1} of {stages.length}</p>
          </div>
        )}

        {/* Dark pill day tabs */}
        {stages.length > 1 && (
          <div className={s.dayTabWrap}>
            <div className={s.dayPill} role="tablist" aria-label="Trek day tabs">
              {/* Sliding white indicator */}
              <div ref={indRef} className={s.dayPillInd} aria-hidden />
              {stages.map((stage, i) => (
                <button
                  key={stage.id}
                  ref={node => { tabRefs.current[i] = node }}
                  type="button"
                  role="tab"
                  aria-selected={selected === i}
                  className={s.dayPillTab}
                  onClick={() => select(i)}
                >
                  Day {i + 1}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Day cards (details/summary accordion) */}
        {stages.map((stage, i) => (
          <details
            key={stage.id}
            ref={node => { stageRefs.current[i] = node }}
            className={s.day}
            data-mode={modeKey(stage.mode)}
            data-peak={i === peakIdx ? '' : undefined}
            open={selected === i}
            onToggle={e => {
              if (e.currentTarget.open && selected !== i) select(i, false)
            }}
          >
            <summary>
              <span className={s.dayNumber}>{String(i + 1).padStart(2, '0')}</span>
              <span>
                <small>Day {i + 1} · {stage.mode.toLowerCase()}</small>
                <strong>{stage.title}</strong>
                <span className={s.dayTags}>
                  <em data-mode={modeKey(stage.mode)}>{modeLabel(stage.mode)}</em>
                  {i === peakIdx && <em data-peak>⛰ Highest point</em>}
                  {i === 0 && <em data-start>Start</em>}
                  {i === stages.length - 1 && <em data-end>Finish</em>}
                </span>
              </span>
              <span aria-hidden>＋</span>
            </summary>

            <div className={s.dayBody}>
              {/* Metric chips */}
              <div className={s.dayFacts}>
                {stage.distanceKm !== null && routeIsVerified(content) && (
                  <span>📍 {stage.distanceKm} km {stage.mode === 'WALK' ? 'trail' : 'travel'}</span>
                )}
                {stage.walkingHours !== null && routeIsVerified(content) && (
                  <span>⏱ {stage.walkingHours}h {stage.mode === 'WALK' ? 'walking' : 'driving'}</span>
                )}
                {stage.altitudeM !== null && routeIsVerified(content) && (
                  <span>⬆ {stage.altitudeM.toLocaleString('en-IN')} m</span>
                )}
                {stage.campsite && (
                  <span>🏕 {stage.campsite}</span>
                )}
              </div>

              <p className={`${s.prose} ${s.dayStory}`}>{highlight(stage.description)}</p>

              {/* Terrain / Accommodation / Meals — highlighted key cards */}
              <div className={s.stageNotes}>
                {stage.terrain && (
                  <p className={s.noteCard} data-kind="terrain">
                    <span className={s.noteIcon} aria-hidden>🥾</span>
                    <strong>Terrain</strong>
                    {stage.terrain}
                  </p>
                )}
                {stage.accommodation && (
                  <p className={s.noteCard} data-kind="stay">
                    <span className={s.noteIcon} aria-hidden>⛺</span>
                    <strong>Stay / campsite</strong>
                    {stage.accommodation}
                  </p>
                )}
                {stage.meals && (
                  <p className={s.noteCard} data-kind="meals">
                    <span className={s.noteIcon} aria-hidden>🍲</span>
                    <strong>Meals</strong>
                    {stage.meals}
                  </p>
                )}
              </div>

              {/* Stage photos */}
              {stage.photos.length > 0 && (
                <div className={s.dayPhotos}>
                  {stage.photos.map((photo, j) => (
                    <figure key={`${photo.src}-${j}`}>
                      <div>
                        <TrekPhoto photo={photo} sizes="(max-width: 600px) 90vw, 350px" />
                      </div>
                      {photo.caption && <figcaption>{photo.caption}</figcaption>}
                    </figure>
                  ))}
                </div>
              )}

              {/* OpenStreetMap waypoint link */}
              {stage.latitude !== null && stage.longitude !== null && routeIsVerified(content) && (
                <a
                  className={`${s.textLink} ${s.dayMapBtn}`}
                  href={`https://www.openstreetmap.org/?mlat=${stage.latitude}&mlon=${stage.longitude}#map=13/${stage.latitude}/${stage.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  📍 View verified waypoint on OpenStreetMap ↗
                </a>
              )}

              {/* Prev / Next navigation */}
              {stages.length > 1 && (
                <div className={s.dayNav}>
                  {i > 0 && (
                    <button
                      type="button"
                      className={s.dayNavBtn}
                      onClick={() => select(i - 1)}
                      aria-label={`Previous day: ${stages[i - 1].title}`}
                    >
                      ← Day {i}
                    </button>
                  )}
                  {i < stages.length - 1 && (
                    <button
                      type="button"
                      className={`${s.dayNavBtn}`}
                      onClick={() => select(i + 1)}
                      style={{ marginLeft: 'auto' }}
                      aria-label={`Next day: ${stages[i + 1].title}`}
                    >
                      Day {i + 2} →
                    </button>
                  )}
                </div>
              )}
            </div>
          </details>
        ))}
      </section>
    </>
  )
}