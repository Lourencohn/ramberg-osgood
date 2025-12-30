export function formatDataSource(source?: string | null) {
  if (!source) return null
  const normalized = source.toLowerCase()

  if (normalized === "processed") return "Processado"
  if (normalized === "raw") return "Bruto"
  if (normalized === "none") return "Sem origem"

  return source
}

export function formatTestCode(testCode?: string | null) {
  if (!testCode) return null
  return testCode.replace(/test_/gi, "ensaio_")
}

export function formatProfileLabel(temperature: number, speed: number) {
  return `Temperatura ${temperature}°C · Velocidade ${speed} mm/s`
}
