const NUMBER_FIELDS = new Set([
  "tempo_s",
  "alongamento_mm_mm",
  "deformacao_mm_mm",
  "deformacao_mm",
  "forca_n",
  "tensao_pa",
  "tensao_mpa",
])

const FIELD_ALIASES = {
  tempo_s: ["tempo", "time", "tempo_s", "time_s", "t"],
  deformacao_mm_mm: [
    "deformacao",
    "deformacao_mm_mm",
    "strain",
    "strain_mm_mm",
    "extensometer",
    "elongation",
    "alongamento",
    "epsilon",
  ],
  alongamento_mm_mm: ["alongamento_mm_mm", "elongation_mm_mm"],
  deformacao_mm: [
    "deformacao_mm",
    "deformacao",
    "displacement",
    "displacement_mm",
    "extension",
    "crosshead",
    "stroke",
  ],
  forca_n: ["forca", "force", "load", "forca_n", "load_n", "force_n"],
  tensao_mpa: ["tensao", "stress", "tensao_mpa", "stress_mpa"],
  tensao_pa: ["tensao_pa", "stress_pa"],
}

function parseNumber(value) {
  if (value === undefined || value === null) return null
  const trimmed = String(value).trim()
  if (!trimmed) return null
  let normalized = trimmed
  if (trimmed.includes(",")) {
    if (trimmed.includes(".")) {
      normalized = trimmed.replace(/,/g, "")
    } else {
      const commaCount = (trimmed.match(/,/g) || []).length
      normalized = commaCount === 1 ? trimmed.replace(",", ".") : trimmed.replace(/,/g, "")
    }
  }
  const parsed = Number.parseFloat(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

function slugifyMaterial(value) {
  return String(value || "")
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
}

function formatCodeValue(value) {
  return String(value).replace(/\./g, "p")
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9%/]+/g, " ")
    .trim()
}

function extractUnit(value) {
  const match = value.match(/\(([^)]+)\)/) || value.match(/\[([^\]]+)\]/)
  if (!match) return null
  return match[1].trim()
}

function normalizeUnit(value) {
  if (!value) return null
  return normalizeText(value).replace(/\s+/g, "")
}

function parseDelimitedLine(line, delimiter) {
  const values = []
  let current = ""
  let inQuotes = false
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    if (char === '"') {
      const next = line[i + 1]
      if (inQuotes && next === '"') {
        current += '"'
        i += 1
        continue
      }
      inQuotes = !inQuotes
      continue
    }
    if (char === delimiter && !inQuotes) {
      values.push(current)
      current = ""
      continue
    }
    current += char
  }
  values.push(current)
  return values.map((value) => value.trim())
}

function parseWhitespaceLine(line) {
  return line.trim().split(/\s+/).map((value) => value.trim())
}

function detectDelimiter(lines) {
  const candidates = [",", ";", "\t"]
  const scores = candidates.map((delimiter) => {
    const counts = new Map()
    let lineCount = 0
    for (const line of lines) {
      const values = parseDelimitedLine(line, delimiter)
      if (values.length < 2) continue
      lineCount += 1
      counts.set(values.length, (counts.get(values.length) || 0) + 1)
    }
    let modeCount = 0
    let modeFields = 0
    for (const [fields, count] of counts.entries()) {
      if (count > modeCount) {
        modeCount = count
        modeFields = fields
      }
    }
    return { delimiter, modeCount, modeFields, lineCount }
  })
  scores.sort((a, b) => {
    if (b.modeCount !== a.modeCount) return b.modeCount - a.modeCount
    if (b.modeFields !== a.modeFields) return b.modeFields - a.modeFields
    return b.lineCount - a.lineCount
  })
  return scores[0].modeCount > 0 ? scores[0].delimiter : null
}

function resolveDelimiter(value) {
  if (!value) return null
  if (value === "tab") return "\t"
  if (value === "space") return null
  return value
}

function parseColumnSpec(value) {
  const normalized = normalizeText(value)
  for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
    if (aliases.includes(normalized)) {
      return { field }
    }
  }
  if (normalized.includes("stress") || normalized.includes("tensao")) {
    return { field: "tensao_mpa" }
  }
  if (normalized.includes("strain") || normalized.includes("deformacao")) {
    return { field: "deformacao_mm_mm" }
  }
  if (normalized.includes("time") || normalized.includes("tempo")) {
    return { field: "tempo_s" }
  }
  if (normalized.includes("load") || normalized.includes("force") || normalized.includes("forca")) {
    return { field: "forca_n" }
  }
  return { field: null }
}

function mapHeaderToken(raw) {
  const unitRaw = extractUnit(raw)
  const unit = normalizeUnit(unitRaw)
  const base = normalizeText(raw.replace(/\(([^)]+)\)|\[([^\]]+)\]/g, " "))

  const isTime = base.includes("time") || base.includes("tempo")
  if (isTime) return { field: "tempo_s", unit }

  const isForce = base.includes("force") || base.includes("load") || base.includes("forca")
  if (isForce) return { field: "forca_n", unit }

  const isStress = base.includes("stress") || base.includes("tensao")
  if (isStress) return { field: "tensao_mpa", unit }

  const isExtensometer = base.includes("extensometer")
  const isStrain =
    base.includes("strain") ||
    base.includes("alongamento") ||
    base.includes("elongation") ||
    base.includes("epsilon")
  const isDisplacement =
    base.includes("crosshead") ||
    base.includes("displacement") ||
    base.includes("extension") ||
    base.includes("stroke")

  if (isExtensometer || isStrain || base.includes("deformacao")) {
    if (unit && unit.includes("mm/mm")) {
      return { field: "deformacao_mm_mm", unit }
    }
    if (unit && unit.includes("%")) {
      return { field: "deformacao_mm_mm", unit }
    }
    if (unit && unit.includes("mm")) {
      return { field: "deformacao_mm", unit }
    }
    if (isDisplacement) {
      return { field: "deformacao_mm", unit }
    }
    return { field: "deformacao_mm_mm", unit }
  }

  if (isDisplacement) {
    return { field: "deformacao_mm", unit }
  }

  return { field: null, unit }
}

function convertValue(field, unit, value) {
  if (value === null) return null
  const normalizedUnit = normalizeUnit(unit)

  if (field === "tempo_s") {
    if (normalizedUnit === "ms") return value / 1000
    if (normalizedUnit === "min") return value * 60
    if (normalizedUnit === "h") return value * 3600
    return value
  }

  if (field === "forca_n") {
    if (normalizedUnit === "kn") return value * 1000
    return value
  }

  if (field === "tensao_mpa") {
    if (normalizedUnit === "pa") return value / 1_000_000
    if (normalizedUnit === "kpa") return value / 1000
    if (normalizedUnit === "gpa") return value * 1000
    if (normalizedUnit === "psi") return value * 0.00689476
    return value
  }

  if (field === "deformacao_mm_mm") {
    if (normalizedUnit && normalizedUnit.includes("%")) return value / 100
    return value
  }

  if (field === "deformacao_mm") {
    if (normalizedUnit === "um" || normalizedUnit === "micron") return value / 1000
    return value
  }

  return value
}

function parseManualContent(content, options = {}) {
  const rawLines = String(content || "").replace(/\u0000/g, "").split(/\r?\n/)
  const lines = rawLines
    .map((line) => line.trim())
    .filter((line) => line && line !== '""')

  if (!lines.length) {
    return { rows: [], header: [], columnMap: {}, metadata: {}, delimiter: null }
  }

  const delimiter = resolveDelimiter(options.delimiter) ?? detectDelimiter(lines)
  const parseLine = delimiter ? (line) => parseDelimitedLine(line, delimiter) : parseWhitespaceLine

  const columnsOverride = options.columns
    ? Array.isArray(options.columns)
      ? options.columns
      : options.columns.split(",").map((value) => value.trim()).filter(Boolean)
    : null

  let headerIndex = -1
  let header = []
  if (columnsOverride) {
    header = columnsOverride
  } else {
    for (let i = 0; i < lines.length; i += 1) {
      const values = parseLine(lines[i])
      if (values.length < 2) continue
      const mapped = values.map((value) => mapHeaderToken(value).field).filter(Boolean)
      if (mapped.length < 2 && values.length < 3) continue
      const nextLine = lines.slice(i + 1).find((line) => line)
      if (!nextLine) continue
      const nextValues = parseLine(nextLine)
      const numericCount = nextValues.map(parseNumber).filter((value) => value !== null).length
      if (numericCount < Math.max(2, Math.floor(values.length / 2))) continue
      headerIndex = i
      header = values
      break
    }
  }

  if (!header.length) {
    throw new Error("No header found. Use --columns to provide column order.")
  }

  const metadataLines = headerIndex > 0 ? lines.slice(0, headerIndex) : []
  const metadata = {}
  for (const line of metadataLines) {
    const values = parseLine(line)
    if (values.length < 2) continue
    const key = values[0].replace(/^"+|"+$/g, "").trim()
    const value = values.slice(1).join(" ").replace(/^"+|"+$/g, "").trim()
    if (!key) continue
    metadata[key] = value
  }

  const columnMeta = header.map((value) => {
    if (columnsOverride) return parseColumnSpec(value)
    return mapHeaderToken(value)
  })

  const rows = []
  const columnMap = {}
  header.forEach((value, index) => {
    const meta = columnMeta[index]
    if (meta.field) columnMap[value] = meta.field
  })

  const startIndex = headerIndex >= 0 ? headerIndex + 1 : 0
  for (let i = startIndex; i < lines.length; i += 1) {
    const values = parseLine(lines[i])
    if (!values.length) continue
    const row = {}
    const extras = {}
    let hasValue = false

    for (let j = 0; j < columnMeta.length && j < values.length; j += 1) {
      const meta = columnMeta[j]
      const rawValue = values[j]
      const parsed = parseNumber(rawValue)
      if (meta.field && NUMBER_FIELDS.has(meta.field)) {
        const converted = convertValue(meta.field, meta.unit, parsed)
        if (converted !== null) {
          row[meta.field] = converted
          hasValue = true
        }
      } else if (rawValue !== undefined && rawValue !== null && rawValue !== "") {
        const key = normalizeText(header[j] ?? `col_${j + 1}`) || `col_${j + 1}`
        extras[key] = rawValue
      }
    }

    if (!hasValue) continue
    row.extras = extras
    rows.push(row)
  }

  return { rows, header, columnMap, metadata, delimiter }
}

function normalizeManualRows(rows, options = {}) {
  const normalized = []
  const areaMm2 = options.specimenAreaMm2 ?? null
  const gaugeLength = options.specimenLengthMm ?? null
  let computedStress = false
  let computedStrain = false

  for (const row of rows) {
    const next = { ...row }

    if (next.tensao_mpa === undefined && next.tensao_pa !== undefined) {
      next.tensao_mpa = next.tensao_pa / 1_000_000
    }
    if (next.tensao_pa === undefined && next.tensao_mpa !== undefined) {
      next.tensao_pa = next.tensao_mpa * 1_000_000
    }
    if (next.tensao_mpa === undefined && next.forca_n !== undefined && areaMm2) {
      next.tensao_mpa = next.forca_n / areaMm2
      next.tensao_pa = next.tensao_mpa * 1_000_000
      computedStress = true
    }
    if (next.deformacao_mm_mm === undefined && next.deformacao_mm !== undefined && gaugeLength) {
      next.deformacao_mm_mm = next.deformacao_mm / gaugeLength
      computedStrain = true
    }

    normalized.push(next)
  }

  return { rows: normalized, computedStress, computedStrain }
}

module.exports = {
  parseManualContent,
  normalizeManualRows,
  parseNumber,
  slugifyMaterial,
  formatCodeValue,
}
