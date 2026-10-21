'use client'
import { useEffect, useState } from 'react'
import { safeImageUrl } from '@/lib/trip-schemas'
import { imageFileSchema } from '@/lib/image-policy'
import { moveItem } from '@/lib/trip-builder'
import { OrderControls, parseArray } from './BuilderControls'
import styles from './TripBuilder.module.css'

export default function PhotoEditor({ cover, gallery, onChange, onBusyChange }: { cover: string; gallery: string; onChange: (value: { image: string; gallery: string }) => void; onBusyChange?: (busy: boolean) => void }) {
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [enabled, setEnabled] = useState<boolean | null>(null)
  useEffect(() => { onBusyChange?.(uploading); return () => onBusyChange?.(false) }, [uploading, onBusyChange])
  const photos = [...new Set([cover, ...parseArray<string>(gallery)].filter(Boolean))]
  const update = (next: string[]) => onChange({ image: next[0] ?? '', gallery: JSON.stringify(next) })
  useEffect(() => {
    let active = true
    fetch('/api/admin/media').then(r => r.ok ? r.json() : { uploadsEnabled: false }).then(data => { if (active) setEnabled(data.uploadsEnabled) }).catch(() => { if (active) setEnabled(false) })
    return () => { active = false }
  }, [])
  const addUrl = () => {
    const value = url.trim()
    if (!value || !safeImageUrl.safeParse(value).success) { setError('Enter a valid HTTP(S) image URL or a local image path.'); return }
    if (photos.includes(value)) { setError('This photo is already in the gallery.'); return }
    setError(''); update([...photos, value]); setUrl('')
  }
  const upload = async (files: FileList | null) => {
    if (!files?.length) return
    setError('')
    const file = files[0]
    const valid = imageFileSchema.safeParse({ type: file.type, size: file.size })
    if (!valid.success) { setError(valid.error.issues[0].message); return }
    setUploading(true)
    try {
      const response = await fetch('/api/admin/media', { method: 'POST', headers: { 'Content-Type': file.type }, body: file })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'The image could not be uploaded.')
      if (!safeImageUrl.safeParse(data.url).success || !data.url) throw new Error('The upload did not return a usable image URL.')
      update([...photos, data.url])
    } catch (error) { setError(error instanceof Error ? error.message : 'Upload failed. Please retry.') }
    finally { setUploading(false) }
  }
  return <>
    <div className={styles.upload}>
      <p className={styles.eyebrow}>Give the trip a sense of place</p>
      <p><strong>Start with a beautiful cover photo</strong></p>
      <label>↑ Choose a photo<input aria-label="Upload a trip photo" type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading || enabled !== true} onChange={e => { void upload(e.target.files); e.target.value = '' }} /></label>
      <p className={styles.muted}>{uploading ? 'Uploading and preparing your photo…' : 'JPEG, PNG or WebP · up to 4 MB · no animated images'}</p>
      {enabled === false && <p className={styles.muted}>Uploads need storage configuration. You can use an image URL below.</p>}
    </div>
    <div className={styles.urlRow}><label className={styles.field}>Or add an image URL<input value={url} onChange={e => setUrl(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addUrl() } }} placeholder="https://images.example.com/your-photo.jpg" /></label><button type="button" className={styles.secondary} onClick={addUrl} disabled={uploading}>Add photo</button></div>
    {error && <p className={styles.error} role="alert">{error}</p>}
    <div className={styles.photoGrid}>{photos.map((photo, i) => <div className={styles.photo} key={photo}>
      <img src={photo} alt={i === 0 ? 'Trip cover preview' : `Gallery photo ${i + 1}`} />
      <div className={styles.photoBar}>
        {i === 0 ? <span className={styles.badge}>Cover photo</span> : <button type="button" className={styles.textButton} onClick={() => update([photo, ...photos.filter((_, index) => index !== i)])} disabled={uploading}>Set as cover</button>}
        <div><span className={styles.muted}>{String(i + 1).padStart(2, '0')}</span><OrderControls index={i} length={photos.length} label={`photo ${i + 1}`} move={direction => { if (!uploading) update(moveItem(photos, i, direction)) }} remove={() => { if (!uploading) update(photos.filter((_, index) => index !== i)) }} /></div>
      </div>
    </div>)}</div>
    <p className={styles.muted} style={{ marginTop: 17 }}>The first photo is the cover. Reorder with the arrow buttons. Removing a photo here does not delete the original stored file.</p>
  </>
}
