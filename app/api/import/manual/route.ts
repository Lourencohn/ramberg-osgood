import type { PoolClient } from 'pg'
import { getPool } from '@/lib/db'
import manualParser from '@/lib/import/manual-parser'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type ImportResult = {
  file: string
  rows: number
  testRunId: number
  testNumber: number
  computed: {
    stressFromArea: boolean
    strainFromLength: boolean
  }
}

type MaterialPayload = {
  name: string
  grade: string | null
  supplier: string | null
  notes: string | null
}

type ProfilePayload = {
  materialId: number
  code: string
  temperature: number | null
  speed: number | null
  layerHeight: number | null
  extraParams: Record<string, unknown>
}

type TestRunPayload = {
  profileId: number
  testNumber: number
  testCode: string
  rawFilePath: string | null
  processedFilePath: string | null
  sourceColumns: string[]
  metadata: Record<string, unknown>
  specimenLengthMm: number | null
  specimenWidthMm: number | null
  specimenThicknessMm: number | null
  specimenAreaMm2: number | null
  notes: string | null
}

const { parseManualContent, normalizeManualRows, parseNumber, slugifyMaterial, formatCodeValue } =
  manualParser as {
    parseManualContent: (
      content: string,
      options?: { delimiter?: string; columns?: string | string[] }
    ) => {
      rows: Record<string, unknown>[]
      header: string[]
      columnMap: Record<string, string>
      metadata: Record<string, string>
      delimiter: string | null
    }
    normalizeManualRows: (
      rows: Record<string, unknown>[],
      options?: { specimenAreaMm2?: number | null; specimenLengthMm?: number | null }
    ) => {
      rows: Record<string, unknown>[]
      computedStress: boolean
      computedStrain: boolean
    }
    parseNumber: (value: unknown) => number | null
    slugifyMaterial: (value: string) => string
    formatCodeValue: (value: number) => string
  }

function getTextField(formData: FormData, key: string) {
  const value = formData.get(key)
  if (typeof value !== 'string') return ''
  return value.trim()
}

function getNumericField(formData: FormData, key: string) {
  const value = getTextField(formData, key)
  return value ? parseNumber(value) : null
}

async function ensureMaterial(
  client: PoolClient,
  payload: MaterialPayload
) {
  const result = await client.query<{ id: number }>(
    `INSERT INTO materials (name, grade, supplier, notes)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (name) DO UPDATE SET
       grade = COALESCE(EXCLUDED.grade, materials.grade),
       supplier = COALESCE(EXCLUDED.supplier, materials.supplier),
       notes = COALESCE(EXCLUDED.notes, materials.notes)
     RETURNING id`,
    [payload.name, payload.grade, payload.supplier, payload.notes]
  )
  return result.rows[0].id
}

async function upsertPrintProfile(
  client: PoolClient,
  payload: ProfilePayload
) {
  const result = await client.query<{ id: number }>(
    `INSERT INTO print_profiles
      (material_id, code, temperature_c, speed_mm_s, layer_height_mm, extra_params)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (code) DO UPDATE SET
       material_id = EXCLUDED.material_id,
       temperature_c = EXCLUDED.temperature_c,
       speed_mm_s = EXCLUDED.speed_mm_s,
       layer_height_mm = EXCLUDED.layer_height_mm,
       extra_params = EXCLUDED.extra_params
     RETURNING id`,
    [
      payload.materialId,
      payload.code,
      payload.temperature,
      payload.speed,
      payload.layerHeight,
      payload.extraParams,
    ]
  )
  return result.rows[0].id
}

async function upsertTestRun(
  client: PoolClient,
  payload: TestRunPayload
) {
  const result = await client.query<{ id: number }>(
    `INSERT INTO test_runs
      (print_profile_id, test_number, test_code, raw_file_path, processed_file_path,
       source_columns, metadata, specimen_length_mm, specimen_width_mm, specimen_thickness_mm, specimen_area_mm2, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     ON CONFLICT (print_profile_id, test_number) DO UPDATE SET
       test_code = EXCLUDED.test_code,
       raw_file_path = EXCLUDED.raw_file_path,
       processed_file_path = EXCLUDED.processed_file_path,
       source_columns = EXCLUDED.source_columns,
       metadata = EXCLUDED.metadata,
       specimen_length_mm = EXCLUDED.specimen_length_mm,
       specimen_width_mm = EXCLUDED.specimen_width_mm,
       specimen_thickness_mm = EXCLUDED.specimen_thickness_mm,
       specimen_area_mm2 = EXCLUDED.specimen_area_mm2,
       notes = EXCLUDED.notes
     RETURNING id`,
    [
      payload.profileId,
      payload.testNumber,
      payload.testCode,
      payload.rawFilePath,
      payload.processedFilePath,
      payload.sourceColumns,
      payload.metadata,
      payload.specimenLengthMm,
      payload.specimenWidthMm,
      payload.specimenThicknessMm,
      payload.specimenAreaMm2,
      payload.notes,
    ]
  )
  return result.rows[0].id
}

async function insertMeasurements(
  client: PoolClient,
  testRunId: number,
  rows: Record<string, unknown>[]
) {
  const chunkSize = 1000
  let pointIndex = 1

  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize)
    const values: Array<number | string | null | Record<string, unknown>> = []
    const placeholders: string[] = []
    let paramIndex = 1

    for (const row of chunk) {
      const typed = row as Record<string, number | null | Record<string, unknown>>
      placeholders.push(
        `($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++})`
      )
      values.push(
        testRunId,
        pointIndex,
        (typed.tempo_s as number | null) ?? null,
        (typed.alongamento_mm_mm as number | null) ?? null,
        (typed.deformacao_mm_mm as number | null) ?? null,
        (typed.deformacao_mm as number | null) ?? null,
        (typed.forca_n as number | null) ?? null,
        (typed.tensao_pa as number | null) ?? null,
        (typed.tensao_mpa as number | null) ?? null,
        (typed.extras as Record<string, unknown>) ?? {}
      )
      pointIndex += 1
    }

    await client.query(
      `INSERT INTO test_measurements
        (test_run_id, point_index, tempo_s, alongamento_mm_mm, deformacao_mm_mm, deformacao_mm,
         forca_n, tensao_pa, tensao_mpa, extras)
       VALUES ${placeholders.join(', ')}`,
      values
    )
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const files = formData
      .getAll('files')
      .filter((item): item is File => item instanceof File && item.size > 0)

    if (!files.length) {
      return Response.json({ error: 'Nenhum arquivo foi enviado.' }, { status: 400 })
    }

    const material = getTextField(formData, 'material')
    const temperatureInput = getNumericField(formData, 'temperature')
    const speedInput = getNumericField(formData, 'speed')
    const layerHeightInput = getNumericField(formData, 'layerHeight')
    const temperature = temperatureInput && temperatureInput > 0 ? temperatureInput : null
    const speed = speedInput && speedInput > 0 ? speedInput : null
    const layerHeight = layerHeightInput && layerHeightInput > 0 ? layerHeightInput : null

    if (!material) {
      return Response.json({ error: 'Informe o material.' }, { status: 400 })
    }
    const profileCodeInput = getTextField(formData, 'profileCode')
    const codeTemperature = temperature ?? 0
    const codeSpeed = speed ?? 0
    const profileCode =
      profileCodeInput ||
      `${slugifyMaterial(material)}_T${formatCodeValue(codeTemperature)}_V${formatCodeValue(codeSpeed)}`

    const testNumberStart =
      getNumericField(formData, 'testNumberStart') ?? getNumericField(formData, 'testNumber') ?? 1

    const specimenLengthMm = getNumericField(formData, 'specimenLength')
    const specimenWidthMm = getNumericField(formData, 'specimenWidth')
    const specimenThicknessMm = getNumericField(formData, 'specimenThickness')
    const specimenAreaMm2 =
      getNumericField(formData, 'specimenArea') ??
      (specimenWidthMm && specimenThicknessMm ? specimenWidthMm * specimenThicknessMm : null)

    const delimiter = getTextField(formData, 'delimiter')
    const columns = getTextField(formData, 'columns')

    const materialPayload: MaterialPayload = {
      name: material,
      grade: getTextField(formData, 'materialGrade') || null,
      supplier: getTextField(formData, 'materialSupplier') || null,
      notes: getTextField(formData, 'materialNotes') || null,
    }

    const client = await getPool().connect()
    const results: ImportResult[] = []

    try {
      await client.query('BEGIN')
      const materialId = await ensureMaterial(client, materialPayload)
      const profileId = await upsertPrintProfile(client, {
        materialId,
        code: profileCode,
        temperature,
        speed,
        layerHeight,
        extraParams: {
          material,
        },
      })

      for (let index = 0; index < files.length; index += 1) {
        const file = files[index]
        const content = await file.text()
        const parseResult = parseManualContent(content, {
          delimiter: delimiter || undefined,
          columns: columns || undefined,
        })
        const normalized = normalizeManualRows(parseResult.rows, {
          specimenAreaMm2,
          specimenLengthMm,
        })

        if (!normalized.rows.length) {
          throw new Error(`Arquivo ${file.name} nao possui dados validos.`)
        }

        const testNumber = Math.max(1, Math.floor(testNumberStart + index))
        const metadata = {
          source: 'manual',
          importer: 'manual',
          delimiter: parseResult.delimiter ?? 'whitespace',
          header_columns: parseResult.header,
          column_map: parseResult.columnMap,
          source_metadata: parseResult.metadata,
          computed: {
            stress_from_area: normalized.computedStress,
            strain_from_length: normalized.computedStrain,
          },
        }

        const testRunId = await upsertTestRun(client, {
          profileId,
          testNumber,
          testCode: file.name,
          rawFilePath: file.name,
          processedFilePath: null,
          sourceColumns: parseResult.header,
          metadata,
          specimenLengthMm,
          specimenWidthMm,
          specimenThicknessMm,
          specimenAreaMm2,
          notes: getTextField(formData, 'testNotes') || null,
        })

        await client.query('DELETE FROM test_measurements WHERE test_run_id = $1', [testRunId])
        await insertMeasurements(client, testRunId, normalized.rows)

        results.push({
          file: file.name,
          rows: normalized.rows.length,
          testRunId,
          testNumber,
          computed: {
            stressFromArea: normalized.computedStress,
            strainFromLength: normalized.computedStrain,
          },
        })
      }

      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }

    return Response.json({
      ok: true,
      material,
      profileCode,
      results,
    })
  } catch (error) {
    let message = error instanceof Error ? error.message : 'Falha ao importar arquivos.'
    if (message.includes('No header found')) {
      message = 'Nao foi encontrado cabecalho. Informe o mapeamento de colunas manualmente.'
    }
    const status =
      message.includes('Nao foi encontrado cabecalho') || message.includes('nao possui dados')
        ? 400
        : 500
    return Response.json({ error: message }, { status })
  }
}
