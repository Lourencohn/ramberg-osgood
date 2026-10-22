import { query } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type SearchRow = {
  id: number
  test_number: number
  test_code: string | null
  created_at: string
  source: string | null
  profile_code: string
  temperature_c: number
  speed_mm_s: number
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const queryParam = searchParams.get('query')?.trim() ?? ''
  if (!queryParam) {
    return Response.json({ results: [] })
  }

  const likeQuery = `%${queryParam}%`
  const { rows } = await query<SearchRow>(
    `
      SELECT
        t.id,
        t.test_number,
        t.test_code,
        t.created_at,
        t.metadata->>'source' AS source,
        p.code AS profile_code,
        p.temperature_c,
        p.speed_mm_s
      FROM test_runs t
      JOIN print_profiles p ON p.id = t.print_profile_id
      WHERE
        CAST(t.test_number AS text) ILIKE $1
        OR t.test_code ILIKE $1
        OR p.code ILIKE $1
        OR CAST(p.temperature_c AS text) ILIKE $1
        OR CAST(p.speed_mm_s AS text) ILIKE $1
        OR COALESCE(t.metadata->>'source', '') ILIKE $1
      ORDER BY t.created_at DESC
      LIMIT 6
    `,
    [likeQuery]
  )

  return Response.json({
    results: rows.map((row) => ({
      id: row.id,
      testNumber: row.test_number,
      testCode: row.test_code,
      createdAt: new Date(row.created_at).toISOString(),
      source: row.source,
      profileCode: row.profile_code,
      temperature: Number(row.temperature_c),
      speed: Number(row.speed_mm_s),
    })),
  })
}
