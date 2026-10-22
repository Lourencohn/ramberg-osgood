import { query } from '@/lib/db'
import { ascendingBranch, buildTrainingPoint, type ProfileTests } from '@/lib/training-data'
import { buildExperimentalRun } from '@/lib/experimental-curve'
import type { ExperimentalRun, RambergOsgoodTrainingPoint, StressStrainPoint } from '@/types'

type TestPointRow = {
  profile_code: string
  temperature_c: number
  speed_mm_s: number
  test_run_id: number
  specimen: string
  strain: number | null
  stress: number | null
}

export async function getRambergOsgoodTrainingData({
  withRuns = false,
}: { withRuns?: boolean } = {}): Promise<RambergOsgoodTrainingPoint[]> {
  const { rows } = await query<TestPointRow>(
    `
      SELECT
        p.code AS profile_code,
        p.temperature_c,
        p.speed_mm_s,
        t.id AS test_run_id,
        COALESCE(t.metadata->>'specimen_code', t.test_code, 'CP ' || t.test_number) AS specimen,
        m.deformacao_mm_mm AS strain,
        m.tensao_mpa AS stress
      FROM test_runs t
      JOIN print_profiles p ON p.id = t.print_profile_id
      JOIN test_measurements m ON m.test_run_id = t.id
      WHERE m.tensao_mpa IS NOT NULL
        AND m.deformacao_mm_mm IS NOT NULL
        AND p.temperature_c IS NOT NULL
        AND p.temperature_c > 0
        AND p.speed_mm_s IS NOT NULL
        AND p.speed_mm_s > 0
      ORDER BY p.code, t.id, m.point_index
    `
  )

  type TestEntry = {
    profile: string
    specimen: string
    temperature: number
    speed: number
    points: StressStrainPoint[]
  }
  const tests = new Map<number, TestEntry>()
  for (const row of rows) {
    if (row.strain === null || row.stress === null) continue
    const entry: TestEntry = tests.get(row.test_run_id) ?? {
      profile: row.profile_code,
      specimen: row.specimen,
      temperature: Number(row.temperature_c),
      speed: Number(row.speed_mm_s),
      points: [],
    }
    entry.points.push({ strain: Number(row.strain), stress: Number(row.stress) })
    tests.set(row.test_run_id, entry)
  }

  const profiles = new Map<string, ProfileTests>()
  const runsByProfile = new Map<string, ExperimentalRun[]>()
  for (const test of tests.values()) {
    const profile: ProfileTests = profiles.get(test.profile) ?? {
      profile: test.profile,
      temperature: test.temperature,
      speed: test.speed,
      tests: [],
    }
    profile.tests.push(ascendingBranch(test.points))
    profiles.set(test.profile, profile)

    const run = withRuns ? buildExperimentalRun(test.specimen, test.points) : null
    if (run) runsByProfile.set(test.profile, [...(runsByProfile.get(test.profile) ?? []), run])
  }

  const trainingData: RambergOsgoodTrainingPoint[] = []
  for (const profile of profiles.values()) {
    const point = buildTrainingPoint(profile)
    if (point) trainingData.push({ ...point, runs: runsByProfile.get(profile.profile) })
  }

  return trainingData.sort((a, b) =>
    a.temperature !== b.temperature ? a.temperature - b.temperature : a.speed - b.speed
  )
}
