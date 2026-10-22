import fs from 'node:fs'
import path from 'node:path'
import { Client } from 'pg'
import {
  parseMachineFile,
  processTensileTest,
  type ProcessedTensileTest,
} from '@/lib/tensile-processing'
import { fitRambergOsgoodCurve, seedFromString } from '@/lib/ramberg-osgood-fit'

const ROOT_DIR = path.resolve(__dirname, '..')
const DATA_DIR = path.join(ROOT_DIR, 'data')
const LAYER_HEIGHT_MM = 0.5
const PROPERTIES_METHOD = 'astm-d638-toe-compensation'
const FIT_METHOD = 'multistart-strain-ls'
const DRY_RUN = process.argv.includes('--dry-run')

interface SpecimenRow {
  code: string
  profile: string
  test: number
  temperature: number
  speed: number
  gaugeLength: number
  width: number | null
  thickness: number | null
  area: number
  areaSource: string
  crossheadSpeed: number
  notes: string
}

function parseCsvLine(line: string): string[] {
  const values: string[] = []
  let field = ''
  let quoted = false
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i]
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        field += '"'
        i += 1
      } else if (ch === '"') quoted = false
      else field += ch
    } else if (ch === '"') quoted = true
    else if (ch === ',') {
      values.push(field)
      field = ''
    } else field += ch
  }
  values.push(field)
  return values
}

function readSpecimens(): SpecimenRow[] {
  const [header, ...lines] = fs
    .readFileSync(path.join(DATA_DIR, 'specimens.csv'), 'utf8')
    .split(/\r?\n/)
    .filter((line) => line.trim())
  const keys = parseCsvLine(header)
  return lines.map((line) => {
    const values = parseCsvLine(line)
    const row = Object.fromEntries(keys.map((key, i) => [key, values[i] ?? '']))
    return {
      code: row.code,
      profile: row.profile,
      test: Number(row.test),
      temperature: Number(row.temperature_c),
      speed: Number(row.speed_mm_s),
      gaugeLength: Number(row.gauge_length_mm),
      width: row.width_mm ? Number(row.width_mm) : null,
      thickness: row.thickness_mm ? Number(row.thickness_mm) : null,
      area: Number(row.area_mm2),
      areaSource: row.area_source,
      crossheadSpeed: Number(row.crosshead_speed_mm_min),
      notes: row.notes,
    }
  })
}

function finite(value: number | null | undefined): number | null {
  return value === null || value === undefined || !Number.isFinite(value) ? null : value
}

async function insertMeasurements(
  client: Client,
  testRunId: number,
  processed: ProcessedTensileTest
) {
  await client.query('DELETE FROM test_measurements WHERE test_run_id = $1', [testRunId])
  const rows = processed.corrected
  const chunkSize = 500
  for (let start = 0; start < rows.length; start += chunkSize) {
    const chunk = rows.slice(start, start + chunkSize)
    const values: unknown[] = []
    const placeholders = chunk.map((point, offset) => {
      const base = values.length
      values.push(
        testRunId,
        start + offset + 1,
        finite(point.time),
        finite(point.rawStrain),
        point.strain,
        finite(point.displacement),
        point.force,
        point.stress * 1e6,
        point.stress
      )
      return `(${Array.from({ length: 9 }, (_, i) => `$${base + i + 1}`).join(', ')})`
    })
    await client.query(
      `INSERT INTO test_measurements
        (test_run_id, point_index, tempo_s, alongamento_mm_mm, deformacao_mm_mm, deformacao_mm, forca_n, tensao_pa, tensao_mpa)
       VALUES ${placeholders.join(', ')}`,
      values
    )
  }
}

async function main() {
  const specimens = readSpecimens()
  const processed = specimens.map((specimen) => {
    const rawPath = path.join(DATA_DIR, specimen.profile, `test_${specimen.test}`, 'raw.txt')
    const records = parseMachineFile(fs.readFileSync(rawPath, 'latin1'))
    const result = processTensileTest(records, {
      gaugeLengthMm: specimen.gaugeLength,
      areaMm2: specimen.area,
    })
    const fit = fitRambergOsgoodCurve(result.ascending, {
      seed: seedFromString(specimen.code),
      sampleSize: Math.min(400, result.ascending.length),
    })
    return { specimen, rawPath, records: records.length, result, fit }
  })

  for (const { specimen, records, result, fit } of processed) {
    console.log(
      `${specimen.code.padEnd(6)} ${specimen.profile.padEnd(10)} pontos=${String(records).padStart(4)} ` +
        `curva=${String(result.corrected.length).padStart(4)} σmax=${result.properties.maxStress.toFixed(2)} MPa ` +
        `E=${result.properties.apparentModulus.toFixed(0)} MPa εrup=${(100 * result.properties.ruptureStrain).toFixed(2)}% ` +
        `RO R²=${fit.r2.toFixed(4)}`
    )
  }

  const totalRecords = processed.reduce((sum, item) => sum + item.records, 0)
  const totalCurve = processed.reduce((sum, item) => sum + item.result.corrected.length, 0)
  console.log(
    `\nregistros brutos: ${totalRecords}; pontos de curva corrigida (test_measurements): ${totalCurve}`
  )

  if (DRY_RUN) {
    console.log(`\n[dry-run] ${processed.length} ensaios processados; nada foi gravado.`)
    return
  }
  if (!process.env.DATABASE_URL) {
    console.error('Defina DATABASE_URL antes de importar (ou use --dry-run).')
    process.exit(1)
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()
  try {
    await client.query('BEGIN')
    const material = await client.query<{ id: number }>(
      `INSERT INTO materials (name) VALUES ('PLA')
       ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id`
    )
    const materialId = material.rows[0].id

    for (const { specimen, rawPath, result, fit } of processed) {
      const profile = await client.query<{ id: number }>(
        `INSERT INTO print_profiles (material_id, code, temperature_c, speed_mm_s, layer_height_mm)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (code) DO UPDATE SET
           material_id = EXCLUDED.material_id,
           temperature_c = EXCLUDED.temperature_c,
           speed_mm_s = EXCLUDED.speed_mm_s,
           layer_height_mm = EXCLUDED.layer_height_mm
         RETURNING id`,
        [materialId, specimen.profile, specimen.temperature, specimen.speed, LAYER_HEIGHT_MM]
      )
      const metadata = {
        source: 'raw',
        specimen_code: specimen.code,
        area_source: specimen.areaSource,
        crosshead_speed_mm_min: specimen.crossheadSpeed,
        toe_offset_strain: result.toeOffset,
        linear_region_r2: result.linearRegion.r2,
      }
      const run = await client.query<{ id: number }>(
        `INSERT INTO test_runs
          (print_profile_id, test_number, test_code, specimen_length_mm, specimen_width_mm,
           specimen_thickness_mm, specimen_area_mm2, raw_file_path, processed_file_path,
           source_columns, notes, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NULL, $9, $10, $11)
         ON CONFLICT (print_profile_id, test_number) DO UPDATE SET
           test_code = EXCLUDED.test_code,
           specimen_length_mm = EXCLUDED.specimen_length_mm,
           specimen_width_mm = EXCLUDED.specimen_width_mm,
           specimen_thickness_mm = EXCLUDED.specimen_thickness_mm,
           specimen_area_mm2 = EXCLUDED.specimen_area_mm2,
           raw_file_path = EXCLUDED.raw_file_path,
           processed_file_path = NULL,
           source_columns = EXCLUDED.source_columns,
           notes = EXCLUDED.notes,
           metadata = EXCLUDED.metadata
         RETURNING id`,
        [
          profile.rows[0].id,
          specimen.test,
          `${specimen.profile}/test_${specimen.test}`,
          specimen.gaugeLength,
          specimen.width,
          specimen.thickness,
          specimen.area,
          path.relative(ROOT_DIR, rawPath),
          ['Tempo(s)', 'Deformação(mm)', 'Força(N)'],
          specimen.notes || null,
          metadata,
        ]
      )
      const testRunId = run.rows[0].id
      await insertMeasurements(client, testRunId, result)

      const p = result.properties
      await client.query(
        `INSERT INTO mechanical_properties
          (test_run_id, method, yield_stress_mpa, ultimate_stress_mpa, ductility_percent,
           resilience_mj_m3, toughness_mj_m3, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (test_run_id, method) DO UPDATE SET
           yield_stress_mpa = EXCLUDED.yield_stress_mpa,
           ultimate_stress_mpa = EXCLUDED.ultimate_stress_mpa,
           ductility_percent = EXCLUDED.ductility_percent,
           resilience_mj_m3 = EXCLUDED.resilience_mj_m3,
           toughness_mj_m3 = EXCLUDED.toughness_mj_m3,
           metadata = EXCLUDED.metadata`,
        [
          testRunId,
          PROPERTIES_METHOD,
          p.offsetYieldStress,
          p.maxStress,
          100 * p.ruptureStrain,
          p.resilience,
          p.toughness,
          {
            apparent_modulus_mpa: p.apparentModulus,
            strain_at_max_stress: p.strainAtMaxStress,
            max_force_n: p.maxForce,
          },
        ]
      )
      await client.query(
        `INSERT INTO ramberg_osgood_fits (test_run_id, method, e_mpa, sigma_0_mpa, n, r2, rmse, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (test_run_id, method) DO UPDATE SET
           e_mpa = EXCLUDED.e_mpa,
           sigma_0_mpa = EXCLUDED.sigma_0_mpa,
           n = EXCLUDED.n,
           r2 = EXCLUDED.r2,
           rmse = EXCLUDED.rmse,
           metadata = EXCLUDED.metadata`,
        [
          testRunId,
          FIT_METHOD,
          fit.params.E,
          fit.params.sigma_0,
          fit.params.n,
          fit.r2,
          fit.rmse,
          { points_used: fit.pointsUsed, seed: seedFromString(specimen.code) },
        ]
      )
    }
    await client.query('COMMIT')
    console.log(`\n${processed.length} ensaios importados.`)
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error('Falha na importação:', error)
  process.exit(1)
})
