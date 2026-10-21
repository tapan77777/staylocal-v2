import { NextResponse } from 'next/server'

export class AdminError extends Error {
  constructor(message: string, public status: number) { super(message) }
}

export function adminError(error: unknown) {
  if (error instanceof AdminError) return NextResponse.json({ error: error.message }, { status: error.status })
  const code = error && typeof error === 'object' && 'code' in error ? error.code : undefined
  if (code === 'P2002') return NextResponse.json({ error: 'This slug is already in use.' }, { status: 409 })
  if (code === 'P2025') return NextResponse.json({ error: 'The requested record was not found.' }, { status: 404 })
  if (code === 'P2034') return NextResponse.json({ error: 'Content changed during editing. Please reload and retry.' }, { status: 409 })
  return NextResponse.json({ error: 'The operation could not be saved. Please retry.' }, { status: 500 })
}

export function positiveId(value: string): number | null {
  if (!/^[1-9]\d*$/.test(value)) return null
  const id = Number(value)
  return Number.isSafeInteger(id) && id <= 2_147_483_647 ? id : null
}
