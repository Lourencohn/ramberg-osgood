export function formatDataSource(source?: string | null) {
  if (!source) return null
  const normalized = source.toLowerCase()

  if (normalized === "processed") return "Processado"
  if (normalized === "raw") return "Bruto"
  if (normalized === "manual") return "Manual"
  if (normalized === "manual-ui") return "Manual"
  if (normalized === "none") return "Sem origem"

  return source
}

export function formatTestCode(testCode?: string | null) {
  if (!testCode) return null
  return testCode.replace(/test_/gi, "ensaio_")
}

export function formatProfileLabel(temperature: number, speed: number) {
  const hasTemperature = Number.isFinite(temperature) && temperature > 0
  const hasSpeed = Number.isFinite(speed) && speed > 0

  if (hasTemperature && hasSpeed) {
    return `Temperatura ${temperature}°C · Velocidade ${speed} mm/s`
  }
  if (hasTemperature) {
    return `Temperatura ${temperature}°C`
  }
  if (hasSpeed) {
    return `Velocidade ${speed} mm/s`
  }
  return "Parametros nao informados"
}

export function formatTemperature(value: number | null | undefined) {
  if (!Number.isFinite(value) || (value as number) <= 0) return "--"
  return `${value}°C`
}

export function formatSpeed(value: number | null | undefined) {
  if (!Number.isFinite(value) || (value as number) <= 0) return "--"
  return `${value} mm/s`
}

export function hasValidPrintParams(temperature: number | null | undefined, speed: number | null | undefined) {
  return Number.isFinite(temperature) && (temperature as number) > 0 && Number.isFinite(speed) && (speed as number) > 0
}
