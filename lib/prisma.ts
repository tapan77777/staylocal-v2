import { PrismaClient } from '@prisma/client'
import { assertPreviewIsolation } from '@/lib/preview-isolation'

// Refuse all Preview database access before constructing a client.
assertPreviewIsolation()

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
