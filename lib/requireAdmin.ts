import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions, isAdminRole } from '@/lib/auth'

export async function requireAdmin() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as { role?: string } | undefined)?.role
  if (!session || !isAdminRole(role)) {
    redirect('/admin/login')
  }
  return session
}
