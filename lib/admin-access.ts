import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions, isAdminRole } from '@/lib/auth'

export type AdminPermission = 'content' | 'admin'

export async function adminAccess(permission: AdminPermission = 'content', request?: Request) {
  // Reject browser cross-origin writes; requests without Origin still require a valid session.
  if (request && !['GET', 'HEAD'].includes(request.method)) {
    const origin = request.headers.get('origin')
    if (origin && origin !== new URL(request.url).origin) {
      return { ok: false as const, response: NextResponse.json({ error: 'Cross-origin request denied.' }, { status: 403 }) }
    }
  }
  try {
    const session = await getServerSession(authOptions)
    const user = session?.user as { id?: string; role?: string } | undefined
    if (!user?.id) {
      return { ok: false as const, response: NextResponse.json({ error: 'Please sign in again.' }, { status: 401 }) }
    }
    if (!isAdminRole(user.role) || (permission === 'admin' && user.role !== 'admin')) {
      return { ok: false as const, response: NextResponse.json({ error: 'You do not have permission for this operation.' }, { status: 403 }) }
    }
    return { ok: true as const, session: session! }
  } catch {
    return { ok: false as const, response: NextResponse.json({ error: 'Authentication is temporarily unavailable. Please retry.' }, { status: 503 }) }
  }
}
