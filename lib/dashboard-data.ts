import { query } from "@/lib/db"
import { formatProfileLabel, hasValidPrintParams } from "@/lib/formatters"

const STRAIN_EXPRESSION = "COALESCE(m.deformacao_mm_mm, m.alongamento_mm_mm)"

type RunMetricsRow = {
  id: number
  test_code: string
  test_number: number
  created_at: string
  source: string | null
  profile_code: string
  temperature_c: number
  speed_mm_s: number
  max_stress: number | null
  max_strain: number | null
  point_count: string | number
}

type TestPointRow = {
  test_run_id: number
  strain: number | null
  stress: number | null
}

export type RunMetrics = {
  id: number
  testCode: string
  testNumber: number
  createdAt: string
  source: string | null
  profileCode: string
  temperature: number
  speed: number
  maxStress: number | null
  maxStrain: number | null
  pointCount: number
}

export type StressPoint = {
  strain: number
  stress: number
}

export type ProfileAverages = {
  profile: string
  temperature: number
  speed: number
  tests: number
  avgMaxStress: number | null
  avgMaxStrain: number | null
}

export type TemperatureUsage = {
  temperature: number
  tests: number
}

export type StressHistogramBin = {
  range: string
  count: number
}

export type SpeedPerformance = {
  series: number[]
  data: Array<{ speed: number } & Record<string, number | null>>
}

export type DashboardStats = {
  totalTests: number
  totalProfiles: number
  totalMeasurements: number
  testsWithStress: number
  lastTest?: RunMetrics
}

export type TestDetail = {
  id: number
  label: string
  testCode: string
  testNumber: number
  source: string | null
  maxStress: number | null
  maxStrain: number | null
  pointCount: number
  points: StressPoint[]
}

export type ProfileDetail = {
  profile: string
  label: string
  temperature: number
  speed: number
  tests: TestDetail[]
}

export type DashboardData = {
  stats: DashboardStats
  profileAverages: ProfileAverages[]
  temperatureUsage: TemperatureUsage[]
  stressDistribution: StressHistogramBin[]
  speedPerformance: SpeedPerformance
  recentRuns: RunMetrics[]
  profileDetails: ProfileDetail[]
}

function buildStressDistribution(values: number[], bucketCount = 5): StressHistogramBin[] {
  if (!values.length) return []

  const min = Math.min(...values)
  const max = Math.max(...values)

  if (min === max) {
    const singleLabel = `${Math.floor(min)}-${Math.ceil(max + 1)}`
    return [{ range: singleLabel, count: values.length }]
  }

  const span = max - min
  const bucketSize = Math.max(1, Math.ceil(span / bucketCount))
  const start = Math.floor(min / bucketSize) * bucketSize
  const bins: StressHistogramBin[] = []

  for (let i = 0; i < bucketCount; i += 1) {
    const from = start + i * bucketSize
    const to = from + bucketSize
    const count = values.filter((value) => {
      const isLast = i === bucketCount - 1
      return value >= from && (isLast ? value <= to : value < to)
    }).length

    bins.push({
      range: `${from.toFixed(0)}-${to.toFixed(0)}`,
      count,
    })
  }

  return bins.filter((bin) => bin.count > 0)
}

export function buildProfileAverages(metrics: RunMetrics[]): ProfileAverages[] {
  const grouped = new Map<string, ProfileAverages & {
    stressSum: number
    stressCount: number
    strainSum: number
    strainCount: number
  }>()

  for (const metric of metrics) {
    const key = metric.profileCode
    const current =
      grouped.get(key) ??
      {
        profile: metric.profileCode,
        temperature: metric.temperature,
        speed: metric.speed,
        tests: 0,
        avgMaxStress: null,
        avgMaxStrain: null,
        stressSum: 0,
        stressCount: 0,
        strainSum: 0,
        strainCount: 0,
      }

    current.tests += 1
    if (metric.maxStress !== null) {
      current.stressSum += metric.maxStress
      current.stressCount += 1
    }
    if (metric.maxStrain !== null) {
      current.strainSum += metric.maxStrain
      current.strainCount += 1
    }

    grouped.set(key, current)
  }

  return Array.from(grouped.values())
    .map((item) => ({
      profile: item.profile,
      temperature: item.temperature,
      speed: item.speed,
      tests: item.tests,
      avgMaxStress: item.stressCount ? item.stressSum / item.stressCount : null,
      avgMaxStrain: item.strainCount ? item.strainSum / item.strainCount : null,
    }))
    .sort((a, b) => (a.temperature !== b.temperature ? a.temperature - b.temperature : a.speed - b.speed))
}

function groupTemperatureUsage(metrics: RunMetrics[]): TemperatureUsage[] {
  const grouped = new Map<number, number>()

  for (const metric of metrics) {
    if (!Number.isFinite(metric.temperature) || metric.temperature <= 0) continue
    grouped.set(metric.temperature, (grouped.get(metric.temperature) ?? 0) + 1)
  }

  return Array.from(grouped.entries())
    .map(([temperature, tests]) => ({ temperature, tests }))
    .sort((a, b) => a.temperature - b.temperature)
}

function buildSpeedPerformance(metrics: RunMetrics[]): SpeedPerformance {
  const validMetrics = metrics.filter(
    (metric) => metric.maxStress !== null && hasValidPrintParams(metric.temperature, metric.speed),
  )
  const temperatures = Array.from(new Set(validMetrics.map((metric) => metric.temperature))).sort((a, b) => a - b)

  const grouped = new Map<
    number,
    Map<number, { sum: number; count: number }>
  >()

  for (const metric of validMetrics) {
    const speedGroup = grouped.get(metric.speed) ?? new Map<number, { sum: number; count: number }>()
    const current = speedGroup.get(metric.temperature) ?? { sum: 0, count: 0 }

    current.sum += metric.maxStress ?? 0
    current.count += 1

    speedGroup.set(metric.temperature, current)
    grouped.set(metric.speed, speedGroup)
  }

  const data: SpeedPerformance["data"] = Array.from(grouped.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([speed, tempMap]) => {
      const point: { speed: number } & Record<string, number | null> = { speed }

      for (const temperature of temperatures) {
        const aggregated = tempMap.get(temperature)
        point[`t${temperature}`] =
          aggregated && aggregated.count > 0 ? aggregated.sum / aggregated.count : null
      }

      return point
    })

  return { series: temperatures, data }
}

function cleanCurve(points: StressPoint[]): StressPoint[] {
  const startIndex = points.findIndex((point) => point.stress > 0.1 && point.strain > 0)
  if (startIndex > 0) {
    return points.slice(startIndex)
  }
  return points
}

function buildProfileDetails(
  metrics: RunMetrics[],
  pointsMap: Map<number, StressPoint[]>,
): ProfileDetail[] {
  const grouped = new Map<string, ProfileDetail>()

  for (const metric of metrics) {
    const key = metric.profileCode
    const curvePoints = pointsMap.get(metric.id) ?? []
    const current =
      grouped.get(key) ??
      {
        profile: metric.profileCode,
        label: formatProfileLabel(metric.temperature, metric.speed),
        temperature: metric.temperature,
        speed: metric.speed,
        tests: [],
      }

      current.tests.push({
        id: metric.id,
        label: `Ensaio ${metric.testNumber}`,
        testCode: metric.testCode,
        testNumber: metric.testNumber,
        source: metric.source,
        maxStress: metric.maxStress,
        maxStrain: metric.maxStrain,
        pointCount: metric.pointCount,
        points: curvePoints,
      })

    grouped.set(key, current)
  }

  return Array.from(grouped.values())
    .map((profile) => ({
      ...profile,
      tests: profile.tests.sort((a, b) => a.testNumber - b.testNumber),
    }))
    .sort((a, b) => (a.temperature !== b.temperature ? a.temperature - b.temperature : a.speed - b.speed))
}

export async function getRunMetrics(): Promise<RunMetrics[]> {
  const { rows } = await query<RunMetricsRow>(
    `
      SELECT
        t.id,
        t.test_code,
        t.test_number,
        t.created_at,
        t.metadata->>'source' AS source,
        p.code AS profile_code,
        p.temperature_c,
        p.speed_mm_s,
        MAX(m.tensao_mpa) AS max_stress,
        MAX(${STRAIN_EXPRESSION}) AS max_strain,
        COUNT(m.*) AS point_count
      FROM test_runs t
      JOIN print_profiles p ON p.id = t.print_profile_id
      JOIN test_measurements m ON m.test_run_id = t.id
      GROUP BY t.id, t.test_code, t.test_number, t.created_at, t.metadata, p.code, p.temperature_c, p.speed_mm_s
      ORDER BY t.created_at ASC
    `,
  )

  return rows.map((row) => ({
    id: row.id,
    testCode: row.test_code,
    testNumber: row.test_number,
    createdAt: new Date(row.created_at).toISOString(),
    source: row.source,
    profileCode: row.profile_code,
    temperature: Number(row.temperature_c),
    speed: Number(row.speed_mm_s),
    maxStress: row.max_stress === null ? null : Number(row.max_stress),
    maxStrain: row.max_strain === null ? null : Number(row.max_strain),
    pointCount: Number(row.point_count ?? 0),
  }))
}

async function fetchCounts() {
  const { rows } = await query<{ total_profiles: string; total_measurements: string }>(
    `
      SELECT
        (SELECT COUNT(*) FROM print_profiles) AS total_profiles,
        (SELECT COUNT(*) FROM test_measurements) AS total_measurements
    `,
  )

  const [row] = rows
  return {
    totalProfiles: Number(row?.total_profiles ?? 0),
    totalMeasurements: Number(row?.total_measurements ?? 0),
  }
}

async function fetchTestPoints(): Promise<Map<number, StressPoint[]>> {
  const { rows } = await query<TestPointRow>(
    `
      SELECT
        t.id AS test_run_id,
        COALESCE(m.deformacao_mm_mm, m.alongamento_mm_mm) AS strain,
        m.tensao_mpa AS stress
      FROM test_runs t
      JOIN test_measurements m ON m.test_run_id = t.id
      WHERE m.tensao_mpa IS NOT NULL
        AND ${STRAIN_EXPRESSION} IS NOT NULL
      ORDER BY t.id, m.point_index
    `,
  )

  const map = new Map<number, StressPoint[]>()

  for (const row of rows) {
    if (row.strain === null || row.stress === null) continue
    const list = map.get(row.test_run_id) ?? []
    list.push({
      strain: Number(row.strain),
      stress: Number(row.stress),
    })
    map.set(row.test_run_id, list)
  }

  for (const [key, points] of map.entries()) {
    map.set(key, cleanCurve(points))
  }

  return map
}

export async function getDashboardData(): Promise<DashboardData> {
  const [metrics, counts, pointsMap] = await Promise.all([getRunMetrics(), fetchCounts(), fetchTestPoints()])
  const stressValues = metrics.filter((metric) => metric.maxStress !== null).map((metric) => metric.maxStress as number)

  const recentRuns = [...metrics].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )

  const stats: DashboardStats = {
    totalTests: metrics.length,
    totalProfiles: counts.totalProfiles,
    totalMeasurements: counts.totalMeasurements,
    testsWithStress: stressValues.length,
    lastTest: recentRuns[0],
  }

  return {
    stats,
    profileAverages: buildProfileAverages(metrics).filter((item) => item.avgMaxStress !== null),
    temperatureUsage: groupTemperatureUsage(metrics),
    stressDistribution: buildStressDistribution(stressValues),
    speedPerformance: buildSpeedPerformance(metrics),
    recentRuns: recentRuns.slice(0, 6),
    profileDetails: buildProfileDetails(metrics, pointsMap),
  }
}
