import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { HistoryClient } from '@/components/history/history-client'
import { getRunMetrics } from '@/lib/dashboard-data'

export const dynamic = 'force-dynamic'

type HistoryPageProps = {
  searchParams?:
    | { query?: string; q?: string; view?: string }
    | Promise<{
        query?: string
        q?: string
        view?: string
      }>
}

export default async function HistoryPage({ searchParams }: HistoryPageProps) {
  const runs = await getRunMetrics()
  const resolvedSearchParams = await searchParams
  const query = resolvedSearchParams?.query ?? resolvedSearchParams?.q ?? ''
  const viewId = resolvedSearchParams?.view ? Number(resolvedSearchParams.view) : null
  const initialViewId = Number.isFinite(viewId) ? viewId : null

  return (
    <DashboardLayout>
      <HistoryClient runs={runs} initialQuery={query} initialViewId={initialViewId} />
    </DashboardLayout>
  )
}
