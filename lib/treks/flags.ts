export function trekSystemEnabled() { return process.env.TREK_SYSTEM_ENABLED === '1' }
export function trekWritesEnabled() { return trekSystemEnabled() && process.env.TREK_WRITES_ENABLED !== '0' }
export function trekFixturesAllowed() {
  if (process.env.TREK_FIXTURE_REVIEW !== '1' || process.env.VERCEL) return false
  try { const url = new URL(process.env.DATABASE_URL || ''); return ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) && url.pathname === '/staylocal_phase2_fixture' } catch { return false }
}
