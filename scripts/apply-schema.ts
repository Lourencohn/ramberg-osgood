import fs from 'node:fs'
import path from 'node:path'
import { Client } from 'pg'

const SCHEMA_FILE = path.resolve(__dirname, '..', 'db', 'schema.sql')

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('Defina DATABASE_URL no .env ou no ambiente antes de aplicar o schema.')
    process.exit(1)
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()
  try {
    await client.query(fs.readFileSync(SCHEMA_FILE, 'utf8'))
    console.log(`Schema aplicado em ${client.host}/${client.database}.`)
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error('Falha ao aplicar o schema:', error)
  process.exit(1)
})
