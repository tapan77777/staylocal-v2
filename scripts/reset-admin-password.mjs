// Offline operator tool. Never invoke as part of install, build, or deployment.
import { createInterface } from 'node:readline/promises'
import { Writable } from 'node:stream'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const args = process.argv.slice(2)
const emailIndex = args.indexOf('--email')
const email = emailIndex >= 0 ? args[emailIndex + 1] : undefined
const allowed = new Set(['--email', email, '--confirm-reset', '--allow-remote-reset'])
let prisma
class ResetError extends Error {}

async function hiddenInput(prompt) {
  const output = new Writable({ write(_chunk, _encoding, callback) { callback() } })
  const input = createInterface({ input: process.stdin, output, terminal: true })
  process.stdout.write(prompt)
  try { return await input.question('') } finally { input.close(); process.stdout.write('\n') }
}

try {
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !args.includes('--confirm-reset') || args.some(arg => !allowed.has(arg))) {
    throw new ResetError('Usage: node scripts/reset-admin-password.mjs --email ACCOUNT --confirm-reset [--allow-remote-reset]')
  }
  if (!process.stdin.isTTY || !process.stdout.isTTY) throw new ResetError('Run interactively in a trusted terminal; password arguments and piped input are not accepted.')
  let host
  try { host = new URL(process.env.DATABASE_URL ?? '').hostname } catch { throw new ResetError('DATABASE_URL must be configured securely.') }
  const local = ['localhost', '127.0.0.1', '[::1]', '::1'].includes(host)
  if ((!local || process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production') && !args.includes('--allow-remote-reset')) {
    throw new ResetError('Remote/production resets require explicit approval and --allow-remote-reset.')
  }
  prisma = new PrismaClient()
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, role: true, password: true } })
  if (!user || !['admin', 'editor'].includes(user.role)) throw new ResetError('No eligible admin/editor account was found.')
  const password = await hiddenInput('New password (hidden): ')
  if (password.length < 16 || Buffer.byteLength(password) > 72) throw new ResetError('Use at least 16 characters and at most 72 UTF-8 bytes.')
  const confirmation = await hiddenInput('Confirm password (hidden): ')
  if (password !== confirmation) throw new ResetError('Passwords did not match. Nothing was changed.')
  if (await bcrypt.compare(password, user.password)) throw new ResetError('Choose a different password. Nothing was changed.')
  const hash = await bcrypt.hash(password, 12)
  const result = await prisma.user.updateMany({ where: { id: user.id, password: user.password }, data: { password: hash } })
  if (result.count !== 1) throw new ResetError('Account changed during reset. Nothing was overwritten; retry.')
  console.log('Password updated. Old deployments may still accept existing sessions. Keep access containment active until secure code and secret rotation are verified on every reachable deployment.')
} catch (error) {
  // Never print raw database errors, URLs, or supplied credentials.
  console.error(error instanceof ResetError ? error.message : 'Reset could not be completed. Check database access securely.')
  process.exitCode = 1
} finally {
  await prisma?.$disconnect()
}
