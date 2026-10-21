import { createHash } from 'node:crypto'

// Database identity excludes credentials and query parameters. Never log a URL.
export function databaseIdentity(value: string | undefined): string {
  try {
    const url = new URL(value ?? '')
    if (!['postgres:', 'postgresql:'].includes(url.protocol) || !url.hostname || url.pathname.length < 2) throw new Error()
    return createHash('sha256').update(`${url.hostname.toLowerCase()}:${url.port || '5432'}${url.pathname}`).digest('hex')
  } catch { throw new Error('A valid PostgreSQL database configuration is required.') }
}

export function assertPreviewIsolation(env: Record<string, string | undefined> = process.env): string | undefined {
  if (env.VERCEL_ENV !== 'preview') return undefined
  const expected = env.PREVIEW_DATABASE_ID
  const production = env.PRODUCTION_DATABASE_ID
  if (!expected || !production || !/^[a-f0-9]{64}$/.test(expected) || !/^[a-f0-9]{64}$/.test(production) || expected === production) {
    throw new Error('Preview requires distinct, independently verified database identities.')
  }
  const actual = databaseIdentity(env.DATABASE_URL)
  if (actual !== expected || actual === production) throw new Error('Preview database isolation check failed.')
  return actual
}
