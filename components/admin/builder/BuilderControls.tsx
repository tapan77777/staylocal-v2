'use client'
import styles from './TripBuilder.module.css'
import { moveItem } from '@/lib/trip-builder'

export function OrderControls({ index, length, label, move, remove }: { index: number; length: number; label: string; move: (direction: -1 | 1) => void; remove: () => void }) {
  return <div className={styles.order}>
    <button type="button" disabled={index === 0} onClick={() => move(-1)} aria-label={`Move ${label} up`}>↑</button>
    <button type="button" disabled={index === length - 1} onClick={() => move(1)} aria-label={`Move ${label} down`}>↓</button>
    <button type="button" onClick={remove} aria-label={`Remove ${label}`} className={styles.remove}>×</button>
  </div>
}

export function ListEditor({ label, items, onChange, placeholder = 'Add a detail' }: { label: string; items: string[]; onChange: (items: string[]) => void; placeholder?: string }) {
  return <section className={styles.listEditor}>
    <div className={styles.sectionHeading}><h3>{label}</h3><button className={styles.textButton} type="button" onClick={() => onChange([...items, ''])}>+ Add item</button></div>
    {!items.length && <p className={styles.muted}>No items yet. Add the details travellers should know.</p>}
    {items.map((item, i) => <div className={styles.listRow} key={i}>
      <span className={styles.number}>{String(i + 1).padStart(2, '0')}</span>
      <input aria-label={`${label} item ${i + 1}`} placeholder={placeholder} value={item} onChange={e => onChange(items.map((v, index) => index === i ? e.target.value : v))} />
      <OrderControls label={`${label} item ${i + 1}`} index={i} length={items.length} move={direction => onChange(moveItem(items, i, direction))} remove={() => onChange(items.filter((_, index) => index !== i))} />
    </div>)}
  </section>
}

export function parseArray<T>(value: string): T[] {
  try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed : [] } catch { return [] }
}
