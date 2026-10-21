// Seeds are for a disposable local database only. Remote/production databases
// must use reviewed migrations and explicit account-management operations.
export function seedPolicy(env: Record<string, string | undefined>): string | null {
  if (env.NODE_ENV === 'production' || env.VERCEL_ENV === 'production' || env.VERCEL === '1') return 'Seeding is disabled in deployed environments.'
  let host: string
  try { host = new URL(env.DATABASE_URL ?? '').hostname } catch { return 'A local DATABASE_URL is required.' }
  if (!['localhost', '127.0.0.1', '[::1]', '::1'].includes(host)) return 'Seeding is restricted to a local database.'
  if (env.CONFIRM_SEED !== 'yes') return 'Set CONFIRM_SEED=yes only for a disposable local database.'
  if (!env.SEED_ADMIN_EMAIL || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(env.SEED_ADMIN_EMAIL)) return 'Provide SEED_ADMIN_EMAIL.'
  const password = env.SEED_ADMIN_PASSWORD ?? ''
  if (password.length < 16 || Buffer.byteLength(password) > 72) return 'Provide a unique SEED_ADMIN_PASSWORD of at least 16 characters and at most 72 UTF-8 bytes.'
  return null
}
