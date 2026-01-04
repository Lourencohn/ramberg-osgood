import { query } from '@/lib/db'
import type { StressStrainPoint } from '@/types'
import type { RunDetail } from '@/types/history'

const STRAIN_EXPRESSION = 'COALESCE(m.deformacao_mm_mm, m.alongamento_mm_mm)'

type RunDetailRow = {
  id: number
  test_code: string | null
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

type RunPointRow = {
  strain: number | null
  stress: number | null
}

function cleanCurve(points: StressStrainPoint[]) {
  const startIndex = points.findIndex((point) => point.stress > 0.1 && point.strain > 0)
  if (startIndex > 0) {
    return points.slice(startIndex)
  }
  return points
}

export async function getRunDetail(runId: number): Promise<RunDetail | null> {
  const { rows } = await query<RunDetailRow>(
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
      WHERE t.id = $1
      GROUP BY t.id, t.test_code, t.test_number, t.created_at, t.metadata, p.code, p.temperature_c, p.speed_mm_s
      LIMIT 1
    `,
    [runId]
  )

  const row = rows[0]
  if (!row) return null

  const { rows: pointRows } = await query<RunPointRow>(
    `
      SELECT
        ${STRAIN_EXPRESSION} AS strain,
        m.tensao_mpa AS stress
      FROM test_measurements m
      WHERE m.test_run_id = $1
        AND m.tensao_mpa IS NOT NULL
        AND ${STRAIN_EXPRESSION} IS NOT NULL
      ORDER BY m.point_index
    `,
    [runId]
  )

  const points = cleanCurve(
    pointRows
      .filter((point) => point.strain !== null && point.stress !== null)
      .map((point) => ({
        strain: Number(point.strain),
        stress: Number(point.stress),
      }))
  )

  return {
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
    points,
  }
}
