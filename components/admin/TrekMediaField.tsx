'use client'
import { useState } from 'react'
import { imageFileSchema } from '@/lib/image-policy'
import { safeImageUrl } from '@/lib/trip-schemas'
import type { TrekContent } from '@/lib/treks/schema'
import s from './TrekBuilder.module.css'
export default function TrekMediaField({ value, onChange, label }: { value: TrekContent['hero']; onChange: (value: TrekContent['hero']) => void; label: string }) {
  const [busy, setBusy] = useState(false), [error, setError] = useState('')
  async function upload(file: File | undefined) {
    if (!file) return
    const valid = imageFileSchema.safeParse({ size: file.size, type: file.type })
    if (!valid.success) { setError(valid.error.issues[0].message); return }
    setBusy(true); setError('')
    try {
      const response = await fetch('/api/admin/media', { method: 'POST', headers: { 'Content-Type': file.type }, body: file })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Upload failed.')
      if (!result.url || !safeImageUrl.safeParse(result.url).success) throw new Error('Upload returned an invalid image URL.')
      onChange({ ...value, src: result.url })
    } catch (e) { setError(e instanceof Error ? e.message : 'Upload failed.') }
    finally { setBusy(false) }
  }
  return <fieldset className={s.mediaField} disabled={busy}><legend>{label}</legend>{value.src && <img src={value.src} alt={value.alt || 'Authoring preview'} loading="lazy" />}<label>Image URL<input value={value.src} onChange={e => onChange({ ...value, src: e.target.value })} /></label><label>Alt text<input value={value.alt} onChange={e => onChange({ ...value, alt: e.target.value })} /></label><label>Caption<input value={value.caption} onChange={e => onChange({ ...value, caption: e.target.value })} /></label><label>Upload photograph<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => { void upload(e.target.files?.[0]); e.target.value = '' }} /></label><p className={s.muted}>{busy ? 'Preparing photo…' : 'Existing media service · JPEG / PNG / WebP · up to 4 MB. URL entry works without configured upload storage.'}</p>{error && <p role="alert" className={s.error}>{error}</p>}</fieldset>
}
