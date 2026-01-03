import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { CompareClient } from '@/components/compare/compare-client'
import { buildProfileAverages, getRunMetrics } from '@/lib/dashboard-data'
import { Plus } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ComparePage() {
  const runs = await getRunMetrics()
  const profileAverages = buildProfileAverages(runs)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Análise Comparativa</h1>
            <p className="mt-1.5 text-muted-foreground">
              Compare resultados de diferentes ensaios lado a lado
            </p>
          </div>
          <Button className="gap-2 shadow-sm">
            <Plus className="size-4" />
            Adicionar Ensaio
          </Button>
        </div>

        <CompareClient runs={runs} profileAverages={profileAverages} />
      </div>
    </DashboardLayout>
  )
}
