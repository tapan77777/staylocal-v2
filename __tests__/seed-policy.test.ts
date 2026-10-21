import { describe, expect, it } from 'vitest'
import { seedPolicy } from '@/lib/seed-policy'

const local = { DATABASE_URL: 'postgresql://localhost/disposable', CONFIRM_SEED: 'yes', SEED_ADMIN_EMAIL: 'staff@example.test', SEED_ADMIN_PASSWORD: 'test-only-local-input' }

describe('local-only seed policy', () => {
  it('permits explicitly configured disposable local seeding', () => expect(seedPolicy(local)).toBeNull())
  it.each([{ NODE_ENV: 'production' }, { VERCEL_ENV: 'production' }, { VERCEL: '1' }, { DATABASE_URL: 'postgresql://remote.example.test/database' }, { DATABASE_URL: undefined }])('blocks deployed/remote targets even with confirmation: %j', override => {
    expect(seedPolicy({ ...local, ...override })).not.toBeNull()
  })
  it.each([{ CONFIRM_SEED: undefined }, { SEED_ADMIN_EMAIL: undefined }, { SEED_ADMIN_PASSWORD: undefined }, { SEED_ADMIN_PASSWORD: 'short' }, { SEED_ADMIN_PASSWORD: 'x'.repeat(73) }])('requires explicit credentials and confirmation', override => {
    expect(seedPolicy({ ...local, ...override })).not.toBeNull()
  })
})
