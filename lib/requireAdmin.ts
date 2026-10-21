import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions, isAdminRole } from '@/lib/auth'

export async function requireAdmin(permission: 'content' | 'admin' = 'content') {
  const session = await getServerSession(authOptions)
  const role = (session?.user as { role?: string } | undefined)?.role
  if (!session?.user || !isAdminRole(role) || (permission === 'admin' && role !== 'admin')) {
    redirect('/admin/login')
  }
  return session
}
