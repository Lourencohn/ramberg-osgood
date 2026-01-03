#!/usr/bin/env node

const fs = require("fs")
const path = require("path")
const { Client } = require("pg")
const {
  parseManualContent,
  normalizeManualRows,
  parseNumber,
  slugifyMaterial,
  formatCodeValue,
} = require("../lib/import/manual-parser")

const ROOT_DIR = path.resolve(__dirname, "..")
const DEFAULT_LAYER_HEIGHT_MM = 0.5

function parseArgs(argv) {
  const args = {}
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (!arg.startsWith("--")) continue
    const [rawKey, rawValue] = arg.slice(2).split("=")
    const key = rawKey.trim()
    if (rawValue !== undefined) {
      args[key] = rawValue
      continue
    }
    const next = argv[i + 1]
    if (!next || next.startsWith("--")) {
      args[key] = true
      continue
    }
    args[key] = next
    i += 1
  }
  return args
}

function printUsage() {
  console.log(
    [
      "Manual import for tensile data (csv/txt).",
      "",
      "Usage:",
      "  node scripts/import-manual.js --file <path> --material <name> [options]",
      "",
      "Options:",
      "  --profile-code <code>        Optional profile code (default: <material>_T<temp>_V<speed>)",
      "  --test-number <n>            Test number (default: 1)",
      "  --layer-height <mm>          Layer height (optional)",
      "  --specimen-length <mm>       Gauge length for strain from displacement",
      "  --specimen-width <mm>        Specimen width",
      "  --specimen-thickness <mm>    Specimen thickness",
      "  --specimen-area <mm2>        Specimen area (overrides width*thickness)",
      "  --delimiter <,|;|tab|space>  Force delimiter",
      "  --columns <list>             Column order for headerless files",
      "  --dry-run                    Parse only, no DB writes",
      "  --help                       Show this help",
      "",
      "Example:",
      "  node scripts/import-manual.js --file 01_ABS_BLACK.txt --material ABS --temperature 235 --speed 60 --dry-run",
    ].join("\n"),
  )
}

async function ensureMaterial(client, payload) {
  const result = await client.query(
    `INSERT INTO materials (name, grade, supplier, notes)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (name) DO UPDATE SET
       grade = COALESCE(EXCLUDED.grade, materials.grade),
       supplier = COALESCE(EXCLUDED.supplier, materials.supplier),
       notes = COALESCE(EXCLUDED.notes, materials.notes)
     RETURNING id`,
    [payload.name, payload.grade, payload.supplier, payload.notes],
  )
  return result.rows[0].id
}

async function upsertPrintProfile(client, payload) {
  const result = await client.query(
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
    ],
  )
  return result.rows[0].id
}

async function upsertTestRun(client, payload) {
  const result = await client.query(
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
    ],
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
        `($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++})`,
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
        row.tensao_mpa ?? null,
        row.extras ?? {},
      )
      pointIndex += 1
    }

    await client.query(
      `INSERT INTO test_measurements
        (test_run_id, point_index, tempo_s, alongamento_mm_mm, deformacao_mm_mm, deformacao_mm,
         forca_n, tensao_pa, tensao_mpa, extras)
       VALUES ${placeholders.join(", ")}`,
      values,
    )
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))

  if (args.help) {
    printUsage()
    process.exit(0)
  }

  const fileArg = args.file
  const material = args.material
  const temperatureInput = parseNumber(args.temperature)
  const speedInput = parseNumber(args.speed)
  const temperature = temperatureInput && temperatureInput > 0 ? temperatureInput : null
  const speed = speedInput && speedInput > 0 ? speedInput : null

  if (!fileArg || !material) {
    printUsage()
    process.exit(1)
  }

  const filePath = path.isAbsolute(fileArg) ? fileArg : path.join(process.cwd(), fileArg)
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`)
    process.exit(1)
  }

  const codeTemperature = temperature ?? 0
  const codeSpeed = speed ?? 0
  const profileCode =
    args["profile-code"] ||
    `${slugifyMaterial(material)}_T${formatCodeValue(codeTemperature)}_V${formatCodeValue(codeSpeed)}`
  const testNumber = Number.parseInt(args["test-number"] || "1", 10)
  const layerHeightInput = parseNumber(args["layer-height"])
  const layerHeight = layerHeightInput && layerHeightInput > 0 ? layerHeightInput : null
  const specimenLengthMm = parseNumber(args["specimen-length"])
  const specimenWidthMm = parseNumber(args["specimen-width"])
  const specimenThicknessMm = parseNumber(args["specimen-thickness"])
  const specimenAreaMm2 =
    parseNumber(args["specimen-area"]) ??
    (specimenWidthMm && specimenThicknessMm ? specimenWidthMm * specimenThicknessMm : null)

  const content = fs.readFileSync(filePath, "utf8")
  const parseResult = parseManualContent(content, {
    delimiter: args.delimiter,
    columns: args.columns,
  })

  const normalized = normalizeManualRows(parseResult.rows, {
    specimenAreaMm2,
    specimenLengthMm,
  })

  if (!normalized.rows.length) {
    console.error("No usable data rows were parsed.")
    process.exit(1)
  }

  const dryRun = Boolean(args["dry-run"])
  const metadata = {
    source: "manual",
    importer: "import-manual",
    delimiter: parseResult.delimiter ?? "whitespace",
    header_columns: parseResult.header,
    column_map: parseResult.columnMap,
    source_metadata: parseResult.metadata,
    computed: {
      stress_from_area: normalized.computedStress,
      strain_from_length: normalized.computedStrain,
    },
  }

  if (dryRun) {
    console.log("[dry-run] Manual import summary")
    console.log(`file=${filePath}`)
    console.log(`material=${material}`)
    console.log(`profile=${profileCode} test=${testNumber}`)
    console.log(`rows=${normalized.rows.length}`)
    console.log(`delimiter=${metadata.delimiter}`)
    console.log(`columns=${parseResult.header.join(", ")}`)
    console.log(`mapped=${JSON.stringify(parseResult.columnMap)}`)
    return
  }

  if (!process.env.DATABASE_URL) {
    console.error("Missing DATABASE_URL. Set it before running the import.")
    process.exit(1)
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()

  try {
    const materialId = await ensureMaterial(client, {
      name: material,
      grade: args.grade ?? null,
      supplier: args.supplier ?? null,
      notes: args["material-notes"] ?? null,
    })

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

    const testRunId = await upsertTestRun(client, {
      profileId,
      testNumber,
      testCode: args["test-code"] ?? path.basename(filePath),
      rawFilePath: path.relative(ROOT_DIR, filePath),
      processedFilePath: null,
      sourceColumns: parseResult.header,
      metadata,
      specimenLengthMm,
      specimenWidthMm,
      specimenThicknessMm,
      specimenAreaMm2,
      notes: args["test-notes"] ?? null,
    })

    await client.query("DELETE FROM test_measurements WHERE test_run_id = $1", [testRunId])
    await insertMeasurements(client, testRunId, normalized.rows)
    console.log(`Imported ${normalized.rows.length} rows into test_run_id=${testRunId}`)
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error("Import failed:", error)
  process.exit(1)
})
