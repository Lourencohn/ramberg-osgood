import { Pool } from "pg"

const globalForPool = globalThis as unknown as { pgPool?: Pool }

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL não está configurada")
}

export const pool =
  globalForPool.pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
  })

if (process.env.NODE_ENV !== "production") {
  globalForPool.pgPool = pool
}

export function query<T>(text: string, params?: unknown[]) {
  return pool.query<T>(text, params)
}
