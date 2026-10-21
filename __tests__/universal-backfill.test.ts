import { describe, expect, it, vi } from 'vitest'
import type { Prisma } from '@prisma/client'
import snapshots from './fixtures/legacy-trips.json'
import { prepareLegacy } from '@/lib/legacy-universal'
import { stageJibhi } from '@/lib/universal-backfill'
const trip = snapshots.find(t => t.slug === 'jibhi')!
const plan = { trip, ...prepareLegacy(trip) }
describe('idempotent draft backfill', () => {
  it('creates drafts once without updating the original trip or an existing configuration', async () => {
    let row: unknown = null
    const create = vi.fn()
    const createConfig = vi.fn(async ({ data }) => { row = data })
    const tx = { trip: { findUnique: vi.fn(async () => trip) }, tripExperience: { findUnique: vi.fn(async () => row), create: createConfig }, tripPackage: { findUnique: vi.fn(async () => null), create } } as unknown as Prisma.TransactionClient
    expect(await stageJibhi(tx, plan)).toEqual({ created: true })
    expect(create).toHaveBeenCalledTimes(9)
    expect(create.mock.calls.every(([arg]) => arg.data.status === 'draft')).toBe(true)
    expect(createConfig.mock.calls[0][0].data.enabled).toBe(false)
    expect(await stageJibhi(tx, plan)).toEqual({ created: false })
    expect(create).toHaveBeenCalledTimes(9)
    expect(createConfig).toHaveBeenCalledTimes(1)
  })
  it('stops on changed source data rather than overwriting it', async () => {
    const tx = { trip: { findUnique: vi.fn(async () => ({ ...trip, price: 1 })) } } as unknown as Prisma.TransactionClient
    await expect(stageJibhi(tx, plan)).rejects.toThrow('Local source differs')
  })
  it('refuses other destinations and package collisions', async () => {
    await expect(stageJibhi({} as Prisma.TransactionClient, { ...plan, trip: { ...trip, slug: 'andaman' } })).rejects.toThrow('Only the first-stage Jibhi')
    const tx = { trip: { findUnique: vi.fn(async () => trip) }, tripExperience: { findUnique: vi.fn(async () => null) }, tripPackage: { findUnique: vi.fn(async () => ({ id: 1 })) } } as unknown as Prisma.TransactionClient
    await expect(stageJibhi(tx, plan)).rejects.toThrow('Reserved package slug')
  })
})
