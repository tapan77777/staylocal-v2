'use client'
import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await signIn('credentials', { email, password, redirect: false })
    setLoading(false)
    if (res?.ok) router.push('/admin')
    else setError('Invalid email or password')
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 20, padding: '40px 36px', width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontFamily: 'var(--font-playfair)', fontSize: 26, fontWeight: 700, marginBottom: 4 }}>
            <span>Stay</span><span style={{ color: 'var(--green)' }}>Local</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Admin panel</p>
        </div>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <input required type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={inp} />
          <input required type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={inp} />
          {error && <p style={{ fontSize: 13, color: '#e53e3e', textAlign: 'center' }}>{error}</p>}
          <button type="submit" disabled={loading} style={{ background: 'var(--green)', color: '#fff', border: 'none', borderRadius: 999, padding: '13px', fontSize: 15, fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}

const inp: React.CSSProperties = {
  padding: '12px 16px', borderRadius: 12, border: '1.5px solid var(--border)',
  fontSize: 14, outline: 'none', fontFamily: 'inherit', width: '100%'
}
