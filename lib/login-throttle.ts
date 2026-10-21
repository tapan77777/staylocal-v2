import { createHash } from 'node:crypto'

// Best-effort per-process protection. A shared store or edge firewall is still
// needed to enforce limits across serverless instances. Never retain raw emails.
const windowMs = 15 * 60 * 1000
const attempts = new Map<string, { count: number; expires: number }>()
let globalWindow = { count: 0, expires: 0 }
const accountKey = (email: string) => createHash('sha256').update(email.trim().toLowerCase()).digest('hex')

export function reserveLoginAttempt(email: string, now = Date.now()): boolean {
  for (const [key, entry] of attempts) if (entry.expires <= now) attempts.delete(key)
  if (globalWindow.expires <= now) globalWindow = { count: 0, expires: now + 60_000 }
  if (globalWindow.count >= 100) return false
  globalWindow.count++
  const key = accountKey(email)
  const entry = attempts.get(key) ?? { count: 0, expires: now + windowMs }
  if (entry.count >= 5 || (!attempts.has(key) && attempts.size >= 10_000)) return false
  entry.count++
  attempts.set(key, entry)
  return true
}

export function clearSuccessfulLoginAttempts(email: string) {
  attempts.delete(accountKey(email))
}
