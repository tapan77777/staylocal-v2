import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { createHash, randomBytes } from 'node:crypto'
import { reserveLoginAttempt, clearSuccessfulLoginAttempts } from '@/lib/login-throttle'

const dummyHash = bcrypt.hashSync(randomBytes(32).toString('hex'), 12)
const credentialTag = (hash: string) => createHash('sha256').update(hash).digest('hex')

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password || credentials.email.length > 320 || credentials.password.length > 1024) return null
        const email = credentials.email.trim()
        if (!reserveLoginAttempt(email)) throw new Error('Too many sign-in attempts. Please try again later.')
        try {
          const user = await prisma.user.findUnique({ where: { email }, select: { id: true, name: true, email: true, role: true, password: true } })
          const valid = await bcrypt.compare(credentials.password, user?.password ?? dummyHash)
          if (!user || !valid || !isAdminRole(user.role)) return null
          clearSuccessfulLoginAttempts(email)
          return { id: String(user.id), name: user.name, email: user.email, role: user.role, credentialTag: credentialTag(user.password) }
        } catch {
          throw new Error('Sign-in is temporarily unavailable. Please retry.')
        }
      },
    }),
  ],
  session: { strategy: 'jwt', maxAge: 8 * 60 * 60 },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as { role?: string }).role
        token.credentialTag = (user as { credentialTag?: string }).credentialTag
      }
      // Old tokens without a credential tag must sign in once after rollout.
      if (typeof token.id !== 'string' || !/^[1-9]\d*$/.test(token.id) || !Number.isSafeInteger(Number(token.id))) return {}
      const current = await prisma.user.findUnique({ where: { id: Number(token.id) }, select: { id: true, name: true, email: true, role: true, password: true } })
      if (!current || !isAdminRole(current.role) || token.credentialTag !== credentialTag(current.password)) return {}
      token.role = current.role
      token.name = current.name
      token.email = current.email
      return token
    },
    async session({ session, token }) {
      if (!token.id) {
        session.user = undefined
      } else if (session.user) {
        ;(session.user as { id?: string; role?: string }).id = token.id as string
        ;(session.user as { id?: string; role?: string }).role = token.role as string
      }
      return session
    },
  },
  pages: { signIn: '/admin/login' },
  secret: process.env.NEXTAUTH_SECRET,
  debug: false,
  logger: {
    error(code) { console.error(`[auth] ${code}`) },
    warn(code) { console.warn(`[auth] ${code}`) },
    debug() {},
  },
}

export function isAdminRole(role: unknown): boolean {
  return role === 'admin' || role === 'editor'
}
