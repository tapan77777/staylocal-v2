import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { adminAccess } from '@/lib/admin-access'
import { adminError } from '@/lib/admin-errors'
import { validateExperienceInput } from '@/lib/content-validation'

export async function POST(req: NextRequest) {
  const access = await adminAccess('content', req)
  if (!access.ok) return access.response
  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }
  const result = validateExperienceInput(body)
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 })
  try {
    const experience = await prisma.experience.create({ data: result.data })
    return NextResponse.json(experience)
  } catch (error) { return adminError(error) }
}
