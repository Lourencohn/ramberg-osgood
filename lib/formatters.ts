export function formatDataSource(source?: string | null) {
  if (!source) return null
  const normalized = source.toLowerCase()

  if (normalized === 'processed') return 'Processado'
  if (normalized === 'raw') return 'Bruto'
  if (normalized === 'manual') return 'Manual'
  if (normalized === 'manual-ui') return 'Manual'
  if (normalized === 'none') return 'Sem origem'

  return source
}

export function formatTestCode(testCode?: string | null) {
  if (!testCode) return null
  return testCode.replace(/test_/gi, 'ensaio_')
}

const KNOWN_MATERIALS = ['PLA', 'ABS', 'PETG', 'TPU', 'PA', 'PC']

// Normalize material names from the database. The database has entries like
// "PLA", "ABS", "03 ABS BLACK" — we extract the canonical family token.
export function normalizeMaterial(raw?: string | null): string {
  if (!raw) return 'PLA'
  const cleaned = raw.replace(/[_\-]/g, ' ').trim()
  if (!cleaned) return 'PLA'

  const upper = cleaned.toUpperCase()
  for (const family of KNOWN_MATERIALS) {
    if (upper.includes(family)) return family
  }
  return upper.split(/\s+/)[0]
}

// Extract a friendly variant suffix from a verbose material name like
// "03 ABS BLACK" → "BLACK". Returns null when no variant info is present.
export function extractMaterialVariant(raw?: string | null): string | null {
  if (!raw) return null
  const cleaned = raw.replace(/[_\-]/g, ' ').trim()
  if (!cleaned) return null

  const tokens = cleaned
    .split(/\s+/)
    .filter((token) => !/^\d+$/.test(token))
    .map((token) => token.toUpperCase())

  const family = normalizeMaterial(raw)
  const extras = tokens.filter((token) => token !== family && !KNOWN_MATERIALS.includes(token))
  if (!extras.length) return null
  return extras.join(' ')
}

type ProfileNameOptions = {
  material?: string | null
  temperature: number | null | undefined
  speed: number | null | undefined
  layerHeight?: number | null
}

// Humanized one-line profile name, e.g. "PLA · 190°C · 90 mm/s".
// Falls back gracefully when a value is missing.
export function formatProfileName({ material, temperature, speed }: ProfileNameOptions): string {
  const parts: string[] = []
  const variant = extractMaterialVariant(material)
  const familyToken = normalizeMaterial(material)

  parts.push(variant ? `${familyToken} ${variant}` : familyToken)

  if (Number.isFinite(temperature) && (temperature as number) > 0) {
    parts.push(`${temperature}°C`)
  }
  if (Number.isFinite(speed) && (speed as number) > 0) {
    parts.push(`${speed} mm/s`)
  }

  return parts.join(' · ')
}

// Structured tokens, useful when each piece needs its own styling (chips, mono).
export function formatProfileTokens(options: ProfileNameOptions): {
  material: string
  variant: string | null
  temperature: string | null
  speed: string | null
  layer: string | null
} {
  const variant = extractMaterialVariant(options.material)
  const material = normalizeMaterial(options.material)
  const hasT = Number.isFinite(options.temperature) && (options.temperature as number) > 0
  const hasV = Number.isFinite(options.speed) && (options.speed as number) > 0
  const hasL = Number.isFinite(options.layerHeight) && (options.layerHeight as number) > 0

  return {
    material,
    variant,
    temperature: hasT ? `${options.temperature}°C` : null,
    speed: hasV ? `${options.speed} mm/s` : null,
    layer: hasL ? `${options.layerHeight} mm` : null,
  }
}

// Compact mono code, e.g. "T190·V90" — keeps the legacy short identity but
// rendered with a typographic separator instead of an underscore.
export function formatProfileCode(temperature: number | null | undefined, speed: number | null | undefined) {
  const hasT = Number.isFinite(temperature) && (temperature as number) > 0
  const hasV = Number.isFinite(speed) && (speed as number) > 0
  if (!hasT && !hasV) return '—'
  const t = hasT ? `T${temperature}` : ''
  const v = hasV ? `V${speed}` : ''
  return [t, v].filter(Boolean).join('·')
}

// Preserved for backward compatibility with screens that still call the
// older "Temperatura X · Velocidade Y" sentence.
export function formatProfileLabel(temperature: number, speed: number) {
  const hasTemperature = Number.isFinite(temperature) && temperature > 0
  const hasSpeed = Number.isFinite(speed) && speed > 0

  if (hasTemperature && hasSpeed) {
    return `${temperature}°C · ${speed} mm/s`
  }
  if (hasTemperature) {
    return `${temperature}°C`
  }
  if (hasSpeed) {
    return `${speed} mm/s`
  }
  return 'Parâmetros não informados'
}

export function formatTemperature(value: number | null | undefined) {
  if (!Number.isFinite(value) || (value as number) <= 0) return '--'
  return `${value}°C`
}

export function formatSpeed(value: number | null | undefined) {
  if (!Number.isFinite(value) || (value as number) <= 0) return '--'
  return `${value} mm/s`
}

export function hasValidPrintParams(
  temperature: number | null | undefined,
  speed: number | null | undefined
) {
  return (
    Number.isFinite(temperature) &&
    (temperature as number) > 0 &&
    Number.isFinite(speed) &&
    (speed as number) > 0
  )
}
