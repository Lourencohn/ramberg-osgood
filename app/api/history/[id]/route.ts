import { getRunDetail } from '@/lib/history-data'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = {
  params: {
    id: string
  }
}

export async function GET(_request: Request, { params }: RouteContext) {
  const runId = Number(params.id)
  if (!Number.isFinite(runId)) {
    return Response.json({ error: 'Identificador inválido.' }, { status: 400 })
  }

  const detail = await getRunDetail(runId)
  if (!detail) {
    return Response.json({ error: 'Ensaio não encontrado.' }, { status: 404 })
  }

  return Response.json(detail)
}
