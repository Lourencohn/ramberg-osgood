import { Pool } from 'pg'

const globalForPool = globalThis as unknown as { pgPool?: Pool }
let pool: Pool | undefined

export function getPool() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL não está configurada')
  }

  if (process.env.NODE_ENV !== 'production') {
    if (!globalForPool.pgPool) {
      globalForPool.pgPool = new Pool({ connectionString })
    }
    return globalForPool.pgPool
  }

  if (!pool) {
    pool = new Pool({ connectionString })
  }

  return pool
}

export function query<T>(text: string, params?: unknown[]) {
  return getPool().query<T>(text, params)
}
