import { query } from '@/lib/db'
import { fitRambergOsgoodCurve } from '@/lib/ramberg-osgood-fit'
import type { RambergOsgoodTrainingPoint, StressStrainPoint } from '@/types'

type TestPointRow = {
  profile_code: string
  temperature_c: number
  speed_mm_s: number
  test_run_id: number
  strain: number | null
  stress: number | null
}

type TestRunPoints = {
  profile: string
  temperature: number
  speed: number
  points: StressStrainPoint[]
}

type ProfileAggregate = {
  profile: string
  temperature: number
  speed: number
  points: StressStrainPoint[]
  maxStrains: number[]
}

function cleanCurve(points: StressStrainPoint[]) {
  const startIndex = points.findIndex((point) => point.stress > 0.1 && point.strain > 0)
  if (startIndex > 0) {
    return points.slice(startIndex)
  }
  return points
}

function hashSeed(value: string) {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

function downsample(points: StressStrainPoint[], maxPoints: number) {
  if (points.length <= maxPoints) return points
  const step = Math.ceil(points.length / maxPoints)
  return points.filter((_, index) => index % step === 0)
}

function average(values: number[]) {
  if (!values.length) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

export async function getRambergOsgoodTrainingData(): Promise<RambergOsgoodTrainingPoint[]> {
  const { rows } = await query<TestPointRow>(
    `
      SELECT
        p.code AS profile_code,
        p.temperature_c,
        p.speed_mm_s,
        t.id AS test_run_id,
        COALESCE(m.deformacao_mm_mm, m.alongamento_mm_mm) AS strain,
        m.tensao_mpa AS stress
      FROM test_runs t
      JOIN print_profiles p ON p.id = t.print_profile_id
      JOIN test_measurements m ON m.test_run_id = t.id
      WHERE m.tensao_mpa IS NOT NULL
        AND COALESCE(m.deformacao_mm_mm, m.alongamento_mm_mm) IS NOT NULL
        AND p.temperature_c IS NOT NULL
        AND p.temperature_c > 0
        AND p.speed_mm_s IS NOT NULL
        AND p.speed_mm_s > 0
      ORDER BY p.code, t.id, m.point_index
    `
  )

  const testMap = new Map<number, TestRunPoints>()

  for (const row of rows) {
    if (row.strain === null || row.stress === null) continue
    const list = testMap.get(row.test_run_id) ?? {
      profile: row.profile_code,
      temperature: Number(row.temperature_c),
      speed: Number(row.speed_mm_s),
      points: [],
    }

    list.points.push({
      strain: Number(row.strain),
      stress: Number(row.stress),
    })
    testMap.set(row.test_run_id, list)
  }

  const profileMap = new Map<string, ProfileAggregate>()

  for (const run of testMap.values()) {
    const cleaned = cleanCurve(run.points).filter((point) => point.stress > 0 && point.strain >= 0)
    if (cleaned.length < 10) continue

    const trimmed = downsample(cleaned, 600)
    const maxStrain = Math.max(...trimmed.map((point) => point.strain))

    const profileEntry = profileMap.get(run.profile) ?? {
      profile: run.profile,
      temperature: run.temperature,
      speed: run.speed,
      points: [],
      maxStrains: [],
    }

    profileEntry.points.push(...trimmed)
    profileEntry.maxStrains.push(maxStrain)
    profileMap.set(run.profile, profileEntry)
  }

  const trainingData: RambergOsgoodTrainingPoint[] = []

  for (const profileEntry of profileMap.values()) {
    if (!profileEntry.points.length) continue

    const validationPoints = downsample(profileEntry.points, 400)
      .filter((point) => point.stress > 0 && point.strain >= 0)
      .sort((a, b) => a.strain - b.strain)
    const maxStrain = average(profileEntry.maxStrains)
    const fit = fitRambergOsgoodCurve(profileEntry.points, {
      seed: hashSeed(profileEntry.profile),
      sampleSize: Math.min(400, profileEntry.points.length),
      curvePoints: 120,
      maxStrain,
    })

    trainingData.push({
      profile: profileEntry.profile,
      temperature: profileEntry.temperature,
      speed: profileEntry.speed,
      E: fit.params.E,
      sigma_0: fit.params.sigma_0,
      n: fit.params.n,
      maxStrain,
      rmse: fit.rmse,
      pointsUsed: fit.pointsUsed,
      validationPoints,
    })
  }

  return trainingData.sort((a, b) =>
    a.temperature !== b.temperature ? a.temperature - b.temperature : a.speed - b.speed
  )
}
