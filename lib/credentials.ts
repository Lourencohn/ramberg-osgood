import { randomBytes, scryptSync } from 'crypto'

const PASSWORD_SALT_BYTES = 16
const PASSWORD_KEY_LEN = 64

export const MIN_PASSWORD_LENGTH = 8

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export function hashPassword(password: string, salt: string) {
  return scryptSync(password, salt, PASSWORD_KEY_LEN).toString('hex')
}

export function createPasswordHash(password: string) {
  const salt = randomBytes(PASSWORD_SALT_BYTES).toString('hex')
  return { salt, hash: hashPassword(password, salt) }
}
