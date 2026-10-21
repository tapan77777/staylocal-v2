import { afterEach, describe, expect, it, vi } from 'vitest'
import { assertPreviewIsolation, databaseIdentity } from '@/lib/preview-isolation'
import { GET } from '@/app/api/preview-readiness/route'

const staging = 'postgresql://fixture:fixture@preview.example.test/staging'
const production = 'postgresql://fixture:fixture@production.example.test/live'
const env = { VERCEL_ENV: 'preview', DATABASE_URL: staging, PREVIEW_DATABASE_ID: databaseIdentity(staging), PRODUCTION_DATABASE_ID: databaseIdentity(production) }
afterEach(() => vi.unstubAllEnvs())
describe('Preview isolation', () => {
  it('permits only the explicitly verified separate database', () => expect(assertPreviewIsolation(env)).toBe(env.PREVIEW_DATABASE_ID))
  it.each([
    { ...env, DATABASE_URL: production }, { ...env, PREVIEW_DATABASE_ID: env.PRODUCTION_DATABASE_ID },
    { ...env, PRODUCTION_DATABASE_ID: '' }, { ...env, PREVIEW_DATABASE_ID: '' }, { ...env, DATABASE_URL: 'invalid' },
  ])('fails closed for missing or unsafe configuration', unsafe => expect(() => assertPreviewIsolation(unsafe)).toThrow())
  it('does not affect production/local configuration', () => expect(assertPreviewIsolation({ VERCEL_ENV: 'production' })).toBeUndefined())
  it('does not include credentials in identity or error output', () => {
    expect(databaseIdentity(staging)).toBe(databaseIdentity(staging.replace('fixture:fixture', 'other:other')))
    expect(() => databaseIdentity('private-value')).toThrow('A valid PostgreSQL database configuration is required.')
  })
  it('hides the preflight outside Preview', async () => {
    vi.stubEnv('VERCEL_ENV', 'production')
    expect((await GET()).status).toBe(404)
  })
  it('returns a sanitized failure when Preview configuration is absent', async () => {
    vi.stubEnv('VERCEL_ENV', 'preview')
    vi.stubEnv('PREVIEW_DATABASE_ID', '')
    const response = await GET()
    expect(response.status).toBe(503)
    expect(await response.json()).toEqual({ error: 'Preview isolation is not configured.' })
  })
  it('provides no secrets and disables caching in Preview', async () => {
    for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value)
    const response = await GET()
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(await response.json()).toEqual({ environment: 'preview', databaseId: env.PREVIEW_DATABASE_ID })
  })
})
