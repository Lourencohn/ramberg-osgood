#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { Client } = require('pg')

const ROOT_DIR = path.resolve(__dirname, '..')
const DATA_DIR = path.join(ROOT_DIR, 'data')
const LAYER_HEIGHT_MM = 0.5

const args = new Set(process.argv.slice(2))
const DRY_RUN = args.has('--dry-run')

const NUMBER_FIELDS = new Set([
  'tempo_s',
  'alongamento_mm_mm',
  'deformacao_mm_mm',
  'deformacao_mm',
  'forca_n',
  'tensao_pa',
  'tensao_mpa',
])

function parseNumber(value) {
  if (value === undefined || value === null) return null
  const trimmed = String(value).trim()
  if (!trimmed) return null
  const parsed = Number.parseFloat(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}

function normalizeHeader(header) {
  return header.trim().toLowerCase()
}

function readLines(filePath) {
  const content = fs.readFileSync(filePath, 'utf8').replace(/\u0000/g, '')
  return content.split(/\r?\n/).filter((line) => line.trim() !== '')
}

function parseCsvFile(filePath) {
  const lines = readLines(filePath)
  if (!lines.length) {
    return { header: [], rows: [] }
  }

  const header = lines[0].split(',').map((h) => h.trim())
  const normalizedHeader = header.map(normalizeHeader)
  const rows = []

  for (let i = 1; i < lines.length; i += 1) {
    const parts = lines[i].split(',')
    if (!parts.length) continue
    const row = {}
    for (let j = 0; j < normalizedHeader.length; j += 1) {
      const key = normalizedHeader[j]
      const value = parts[j]
      if (NUMBER_FIELDS.has(key)) {
        row[key] = parseNumber(value)
      }
    }
    rows.push(row)
  }

  return { header, rows }
}

function parseRawFile(filePath) {
  const lines = readLines(filePath)
  if (!lines.length) {
    return { header: [], rows: [] }
  }

  const header = lines[0].split(/\s+/).map((h) => h.trim())
  const rows = []

  for (let i = 1; i < lines.length; i += 1) {
    const parts = lines[i].trim().split(/\s+/)
    if (parts.length < 2) continue
    rows.push({
      tempo_s: parseNumber(parts[0]),
      deformacao_mm: parseNumber(parts[1]),
      forca_n: parseNumber(parts[2]),
    })
  }

  return { header, rows }
}

function parseProfileCode(code) {
  const match = code.match(/^T(\d+)_V(\d+)$/)
  if (!match) return null
  return {
    temperature: Number.parseFloat(match[1]),
    speed: Number.parseFloat(match[2]),
  }
}

function listProfiles() {
  return fs
    .readdirSync(DATA_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => /^T\d+_V\d+$/.test(name))
    .sort()
}

function listTests(profileDir) {
  const fullPath = path.join(DATA_DIR, profileDir)
  return fs
    .readdirSync(fullPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith('test_'))
    .map((entry) => entry.name)
    .sort()
}

async function ensureMaterial(client) {
  const result = await client.query(
    `INSERT INTO materials (name)
     VALUES ($1)
     ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    ['PLA']
  )
  return result.rows[0].id
}

async function upsertPrintProfile(client, materialId, profileCode, temperature, speed) {
  const result = await client.query(
    `INSERT INTO print_profiles
      (material_id, code, temperature_c, speed_mm_s, layer_height_mm)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (code) DO UPDATE SET
       material_id = EXCLUDED.material_id,
       temperature_c = EXCLUDED.temperature_c,
       speed_mm_s = EXCLUDED.speed_mm_s,
       layer_height_mm = EXCLUDED.layer_height_mm
     RETURNING id`,
    [materialId, profileCode, temperature, speed, LAYER_HEIGHT_MM]
  )
  return result.rows[0].id
}

async function upsertTestRun(client, profileId, testNumber, payload) {
  const result = await client.query(
    `INSERT INTO test_runs
      (print_profile_id, test_number, test_code, raw_file_path, processed_file_path, source_columns, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (print_profile_id, test_number) DO UPDATE SET
       test_code = EXCLUDED.test_code,
       raw_file_path = EXCLUDED.raw_file_path,
       processed_file_path = EXCLUDED.processed_file_path,
       source_columns = EXCLUDED.source_columns,
       metadata = EXCLUDED.metadata
     RETURNING id`,
    [
      profileId,
      testNumber,
      payload.test_code,
      payload.raw_file_path,
      payload.processed_file_path,
      payload.source_columns,
      payload.metadata,
    ]
  )
  return result.rows[0].id
}

async function insertMeasurements(client, testRunId, rows) {
  const chunkSize = 1000
  let pointIndex = 1

  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize)
    const values = []
    const placeholders = []
    let paramIndex = 1

    for (const row of chunk) {
      placeholders.push(
        `($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++})`
      )
      values.push(
        testRunId,
        pointIndex,
        row.tempo_s ?? null,
        row.alongamento_mm_mm ?? null,
        row.deformacao_mm_mm ?? null,
        row.deformacao_mm ?? null,
        row.forca_n ?? null,
        row.tensao_pa ?? null,
        row.tensao_mpa ?? null
      )
      pointIndex += 1
    }

    await client.query(
      `INSERT INTO test_measurements
        (test_run_id, point_index, tempo_s, alongamento_mm_mm, deformacao_mm_mm, deformacao_mm, forca_n, tensao_pa, tensao_mpa)
       VALUES ${placeholders.join(', ')}`,
      values
    )
  }
}

async function importProfile(client, materialId, profileCode) {
  const params = parseProfileCode(profileCode)
  if (!params) return

  const profileId = await upsertPrintProfile(
    client,
    materialId,
    profileCode,
    params.temperature,
    params.speed
  )
  const testDirs = listTests(profileCode)

  for (const testDir of testDirs) {
    const testNumberMatch = testDir.match(/^test_(\d+)$/)
    if (!testNumberMatch) continue

    const testNumber = Number.parseInt(testNumberMatch[1], 10)
    const basePath = path.join(DATA_DIR, profileCode, testDir)
    const rawPath = path.join(basePath, 'raw.txt')
    const processedPath = path.join(basePath, 'processed.csv')

    const hasProcessed = fs.existsSync(processedPath)
    const hasRaw = fs.existsSync(rawPath)

    let parsed = { header: [], rows: [] }
    let source = 'none'
    if (hasProcessed) {
      parsed = parseCsvFile(processedPath)
      source = 'processed'
    } else if (hasRaw) {
      parsed = parseRawFile(rawPath)
      source = 'raw'
    }

    const payload = {
      test_code: `${profileCode}/${testDir}`,
      raw_file_path: hasRaw ? path.relative(ROOT_DIR, rawPath) : null,
      processed_file_path: hasProcessed ? path.relative(ROOT_DIR, processedPath) : null,
      source_columns: parsed.header,
      metadata: { source },
    }

    if (DRY_RUN) {
      console.log(
        `[dry-run] ${profileCode}/${testDir} rows=${parsed.rows.length} source=${source} header=${parsed.header.join(
          ','
        )}`
      )
      continue
    }

    const testRunId = await upsertTestRun(client, profileId, testNumber, payload)
    await client.query('DELETE FROM test_measurements WHERE test_run_id = $1', [testRunId])
    await insertMeasurements(client, testRunId, parsed.rows)
    console.log(
      `Imported ${profileCode}/${testDir} rows=${parsed.rows.length} source=${source} test_run_id=${testRunId}`
    )
  }
}

async function main() {
  if (DRY_RUN) {
    console.log('Running in dry-run mode. No database writes will be executed.')
  }

  if (!process.env.DATABASE_URL) {
    console.error('Missing DATABASE_URL. Set it before running the import.')
    process.exit(1)
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()

  try {
    const materialId = await ensureMaterial(client)
    const profiles = listProfiles()
    for (const profileCode of profiles) {
      await importProfile(client, materialId, profileCode)
    }
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error('Import failed:', error)
  process.exit(1)
})
