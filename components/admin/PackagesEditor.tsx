'use client'
import { useState } from 'react'
import { ListEditor, OrderControls, parseArray } from './builder/BuilderControls'
import { moveItem } from '@/lib/trip-builder'
import styles from './builder/TripBuilder.module.css'

export interface PackageDraft {
  id?: number; slug: string; label: string; days: number; nights: number; priceAdult: number
  priceBasis: string; priceOnRequest: boolean; image: string; sortOrder: number; status: string
  itinerary: string; accommodation: string; inclusions: string; exclusions: string; notes: string
}
export interface ItineraryDay { day: string; title: string; desc: string }

export default function PackagesEditor({ packages, onChange }: { packages: PackageDraft[]; onChange: (packages: PackageDraft[]) => void }) {
  const [removed, setRemoved] = useState<{ pkg: PackageDraft; index: number } | null>(null)
  const update = (index: number, patch: Partial<PackageDraft>) => onChange(packages.map((p, i) => i === index ? { ...p, ...patch } : p))
  const remove = (index: number) => {
    const pkg = packages[index]
    if (pkg.id && !window.confirm(`Remove “${pkg.label}”? It will be removed from this trip only after you save. You can undo this here.`)) return
    setRemoved({ pkg, index })
    onChange(packages.filter((_, i) => i !== index))
  }
  const add = () => onChange([...packages, {
    slug: `package-${crypto.randomUUID().slice(0, 8)}`, label: '3 days · 2 nights', days: 3, nights: 2, priceAdult: 0,
    priceBasis: 'per adult, twin sharing', priceOnRequest: false, image: '', sortOrder: packages.length, status: 'draft',
    itinerary: '[]', accommodation: '', inclusions: '[]', exclusions: '[]', notes: '',
  }])
  return <div>
    {removed && <div className={styles.notice} role="status">Package removed from this edit. <button className={styles.textButton} type="button" onClick={() => {
      const next = [...packages]; next.splice(Math.min(removed.index, next.length), 0, removed.pkg); onChange(next); setRemoved(null)
    }}>Undo removal</button></div>}
    {packages.length === 0 && <div className={styles.emptyCover}>Your first package starts here. Add a duration option below.</div>}
    {packages.map((pkg, index) => <details className={styles.package} key={pkg.id ?? pkg.slug} open={index === 0 ? true : undefined}>
      <summary><span>{String(index + 1).padStart(2, '0')} &nbsp; {pkg.label || 'Untitled package'} <small className={styles.muted}> · {pkg.days}D/{pkg.nights}N</small></span><span className={styles.badge}>{pkg.status === 'published' ? 'Ready' : 'Draft'}</span></summary>
      <div className={styles.packageContent}>
        <div className={styles.packageTop}>
          <label className={styles.ready}><input type="checkbox" checked={pkg.status === 'published'} onChange={e => update(index, { status: e.target.checked ? 'published' : 'draft' })} />Ready for customers</label>
          <OrderControls index={index} length={packages.length} label={`package ${index + 1}`} move={direction => onChange(moveItem(packages, index, direction).map((p, i) => ({ ...p, sortOrder: i })))} remove={() => remove(index)} />
        </div>
        <p className={styles.muted}>Draft packages stay hidden from travellers, even when the trip is published.</p>
        <div className={styles.grid}>
          <label className={`${styles.field} ${styles.wide}`}>Package name<input value={pkg.label} onChange={e => update(index, { label: e.target.value })} placeholder="e.g. A slow mountain escape" /></label>
          <label className={styles.field}>Days<input type="number" min="1" max="60" value={pkg.days} onChange={e => update(index, { days: Number(e.target.value) })} /></label>
          <label className={styles.field}>Nights<input type="number" min="0" max="59" value={pkg.nights} onChange={e => update(index, { nights: Number(e.target.value) })} /></label>
          <label className={styles.field}>Starting price per person (₹)<input type="number" min="0" step="1" disabled={pkg.priceOnRequest} value={pkg.priceAdult} onChange={e => update(index, { priceAdult: Number(e.target.value) })} /></label>
          <label className={styles.field}>Price basis<input value={pkg.priceBasis} onChange={e => update(index, { priceBasis: e.target.value })} /></label>
          <label className={`${styles.ready} ${styles.wide}`}><input type="checkbox" checked={pkg.priceOnRequest} onChange={e => update(index, { priceOnRequest: e.target.checked })} />Price on request — send a confirmed quote after enquiry</label>
          <label className={`${styles.field} ${styles.wide}`}>Accommodation<input value={pkg.accommodation} onChange={e => update(index, { accommodation: e.target.value })} placeholder="e.g. Boutique homestay, twin sharing" /></label>
          <label className={`${styles.field} ${styles.wide}`}>Package photo URL <small>Optional; the trip cover is used when empty.</small><input type="url" value={pkg.image} onChange={e => update(index, { image: e.target.value })} placeholder="https://…" /></label>
        </div>
        <section className={styles.listEditor}>
          <div className={styles.sectionHeading}><h3>Day-wise itinerary</h3><button className={styles.textButton} type="button" onClick={() => {
            const days = parseArray<ItineraryDay>(pkg.itinerary)
            update(index, { itinerary: JSON.stringify([...days, { day: `Day ${days.length + 1}`, title: '', desc: '' }]) })
          }}>+ Add day</button></div>
          <p className={styles.muted}>A clear plan for each day. Add {pkg.days} days before this package goes live.</p>
          <div className={styles.days}>{parseArray<ItineraryDay>(pkg.itinerary).map((day, dayIndex, all) => {
            const changeDay = (patch: Partial<ItineraryDay>) => update(index, { itinerary: JSON.stringify(all.map((d, i) => i === dayIndex ? { ...d, ...patch } : d)) })
            return <div className={styles.day} key={dayIndex}>
              <div className={styles.dayHead}><label className={styles.field}>Day label<input aria-label={`Package ${index + 1} day ${dayIndex + 1} label`} value={day.day} onChange={e => changeDay({ day: e.target.value })} /></label>
                <OrderControls index={dayIndex} length={all.length} label={`package ${index + 1} day ${dayIndex + 1}`} move={direction => update(index, { itinerary: JSON.stringify(moveItem(all, dayIndex, direction)) })} remove={() => update(index, { itinerary: JSON.stringify(all.filter((_, i) => i !== dayIndex)) })} />
              </div>
              <input aria-label={`Package ${index + 1} day ${dayIndex + 1} title`} placeholder="Give this day a title" value={day.title} onChange={e => changeDay({ title: e.target.value })} />
              <textarea aria-label={`Package ${index + 1} day ${dayIndex + 1} description`} placeholder="Describe the experiences, transfers and overnight stay…" value={day.desc} onChange={e => changeDay({ desc: e.target.value })} />
            </div>
          })}</div>
        </section>
        <ListEditor label="Package inclusions" items={parseArray<string>(pkg.inclusions)} onChange={items => update(index, { inclusions: JSON.stringify(items) })} />
        <ListEditor label="Package exclusions" items={parseArray<string>(pkg.exclusions)} onChange={items => update(index, { exclusions: JSON.stringify(items) })} />
        <label className={styles.field} style={{ marginTop: 22 }}>Anything else travellers should know?<textarea value={pkg.notes} onChange={e => update(index, { notes: e.target.value })} placeholder="Seasonal supplements, optional activities or pricing notes…" /></label>
      </div>
    </details>)}
    <button type="button" className={styles.addCard} onClick={add}>＋ Add a duration package</button>
  </div>
}
