'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AddExperience() {
  const router = useRouter()
  const [form, setForm] = useState({ slug: '', title: '', location: '', category: '', description: '', visited: true, status: 'published' })
  const [loading, setLoading] = useState(false)

  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await fetch('/api/admin/experiences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    setLoading(false)
    setForm({ slug: '', title: '', location: '', category: '', description: '', visited: true, status: 'published' })
    router.refresh()
  }

  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, padding: '20px 24px' }}>
      <h2 style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Add Experience</h2>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input required placeholder="Slug" value={form.slug} onChange={e => set('slug', e.target.value)} style={inp} />
        <input required placeholder="Title" value={form.title} onChange={e => set('title', e.target.value)} style={inp} />
        <input required placeholder="Location" value={form.location} onChange={e => set('location', e.target.value)} style={inp} />
        <input placeholder="Category" value={form.category} onChange={e => set('category', e.target.value)} style={inp} />
        <textarea placeholder="Description" value={form.description} onChange={e => set('description', e.target.value)} rows={3} style={{ ...inp, resize: 'none' }} />
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
          <input type="checkbox" checked={form.visited} onChange={e => set('visited', e.target.checked)} />
          Been there
        </label>
        <button type="submit" disabled={loading} style={{ background: 'var(--green)', color: '#fff', border: 'none', borderRadius: 999, padding: '11px', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Adding...' : 'Add Experience'}
        </button>
      </form>
    </div>
  )
}

const inp: React.CSSProperties = { padding: '10px 14px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 13, outline: 'none', fontFamily: 'inherit', width: '100%' }
