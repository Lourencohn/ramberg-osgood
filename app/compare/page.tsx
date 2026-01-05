import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { PageShell } from '@/components/layout/page-shell'
import { Button } from '@/components/ui/button'
import { CompareClient } from '@/components/compare/compare-client'
import { buildProfileAverages, getRunMetrics } from '@/lib/dashboard-data'
import { GitCompare, Plus } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function ComparePage() {
  const runs = await getRunMetrics()
  const profileAverages = buildProfileAverages(runs)

  return (
    <DashboardLayout>
      <PageShell
        title="Análise Comparativa"
        description="Compare resultados de diferentes ensaios lado a lado"
        icon={<GitCompare className="size-5" />}
        actions={
          <Button className="gap-2 shadow-sm" asChild>
            <Link href="/import">
              <Plus className="size-4" />
              Adicionar Ensaio
            </Link>
          </Button>
        }
      >
        <CompareClient runs={runs} profileAverages={profileAverages} />
      </PageShell>
    </DashboardLayout>
  )
}
