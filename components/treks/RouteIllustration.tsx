'use client'
import { useRef, useState } from 'react'
import type { TrekContent } from '@/lib/treks/schema'
import s from './Treks.module.css'
export default function RouteIllustration({ map }: { map: TrekContent['routeMap'] }) {
  const dialog = useRef<HTMLDialogElement>(null), opener = useRef<HTMLButtonElement>(null)
  const [zoom, setZoom] = useState(1)
  if (!map.image.src) return null
  const concept = map.kind === 'CONCEPT' || /-concept\.svg(?:[?#]|$)/.test(map.image.src)
  const warning = concept ? 'StayLocal design concept · not surveyed, not to scale and not for navigation.' : `Operator-reviewed illustration · ${map.source} · ${map.reviewedOn}. Confirm navigation with your guide.`
  return <figure className={s.illustration}><button type="button" ref={opener} className={s.mapOpener} onClick={() => { setZoom(1); dialog.current?.showModal() }} aria-label="Open route illustration and zoom"><img src={map.image.src} alt={map.image.alt} loading="lazy"/><span>Explore the illustration ⤢</span></button><figcaption>{warning}{map.image.caption && <span>{map.image.caption}</span>}</figcaption><dialog ref={dialog} className={s.mapDialog} aria-label="Route illustration zoom" onClose={() => opener.current?.focus()} onClick={e => { if (e.target === e.currentTarget) dialog.current?.close() }}><div className={s.mapToolbar}><strong>StayLocal · Route illustration</strong><button type="button" onClick={() => dialog.current?.close()} aria-label="Close route illustration">Close ×</button></div><p>{warning}</p><label className={s.zoomControl}>Zoom<input type="range" min="1" max="3" step="0.25" value={zoom} onChange={e => setZoom(Number(e.target.value))}/><output>{Math.round(zoom * 100)}%</output></label><div className={s.mapViewport} tabIndex={0} aria-label="Scrollable enlarged route illustration"><img src={map.image.src} alt={map.image.alt} style={{ width: `${zoom * 100}%`, maxWidth: 'none' }}/></div></dialog></figure>
}
