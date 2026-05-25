import { cookies } from 'next/headers'
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'crypto'
import { query } from '@/lib/db'

const SESSION_COOKIE_NAME = 'ro_session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 7
const PASSWORD_SALT_BYTES = 16
const PASSWORD_KEY_LEN = 64

type UserRow = {
  id: number
  name: string
  email: string
  password_salt: string
  password_hash: string
}

export type AuthUser = {
  id: number
  name: string
  email: string
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function hashPassword(password: string, salt: string) {
  return scryptSync(password, salt, PASSWORD_KEY_LEN).toString('hex')
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

async function setSessionCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  })
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
  if (!token) return null

  const tokenHash = hashToken(token)
  const result = await query<AuthUser>(
    'SELECT id, name, email FROM users WHERE session_token_hash = $1 AND session_expires_at > now()',
    [tokenHash]
  )

  return result.rows[0] ?? null
}

export async function createUser({
  name,
  email,
  password,
}: {
  name: string
  email: string
  password: string
}): Promise<AuthUser> {
  const normalizedEmail = normalizeEmail(email)
  const salt = randomBytes(PASSWORD_SALT_BYTES).toString('hex')
  const passwordHash = hashPassword(password, salt)

  const result = await query<AuthUser>(
    'INSERT INTO users (name, email, password_salt, password_hash) VALUES ($1, $2, $3, $4) RETURNING id, name, email',
    [name, normalizedEmail, salt, passwordHash]
  )

  return result.rows[0]
}

export async function verifyUser(email: string, password: string): Promise<AuthUser | null> {
  const normalizedEmail = normalizeEmail(email)
  const result = await query<UserRow>(
    'SELECT id, name, email, password_salt, password_hash FROM users WHERE email = $1',
    [normalizedEmail]
  )
  const user = result.rows[0]
  if (!user) return null

  const candidateHash = hashPassword(password, user.password_salt)
  const candidateBuf = Buffer.from(candidateHash, 'hex')
  const storedBuf = Buffer.from(user.password_hash, 'hex')
  if (candidateBuf.length !== storedBuf.length) return null
  const matches = timingSafeEqual(candidateBuf, storedBuf)
  if (!matches) return null

  return { id: user.id, name: user.name, email: user.email }
}

export async function createSession(userId: number) {
  const token = randomBytes(32).toString('hex')
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000)

  await query(
    'UPDATE users SET session_token_hash = $1, session_expires_at = $2, last_login_at = now() WHERE id = $3',
    [tokenHash, expiresAt, userId]
  )

  await setSessionCookie(token)
}

export async function clearSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
  if (token) {
    const tokenHash = hashToken(token)
    await query(
      'UPDATE users SET session_token_hash = NULL, session_expires_at = NULL WHERE session_token_hash = $1',
      [tokenHash]
    )
  }

  cookieStore.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  })
}
