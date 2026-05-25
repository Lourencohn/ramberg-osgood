import Link from 'next/link'
import { Plus } from 'lucide-react'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { PageShell } from '@/components/layout/page-shell'
import { Button } from '@/components/ui/button'
import { CompareClient } from '@/components/compare/compare-client'
import { buildProfileAverages, getRunMetrics } from '@/lib/dashboard-data'

export const dynamic = 'force-dynamic'

export default async function ComparePage() {
  const runs = await getRunMetrics()
  const profileAverages = buildProfileAverages(runs)

  return (
    <DashboardLayout>
      <PageShell
        chapter="Cap. III"
        rubric="Análise"
        title="Comparar"
        accent="ensaios"
        description="Coloque ensaios lado a lado para enxergar diferenças entre temperaturas, velocidades e perfis."
        actions={
          <Button asChild className="gap-2 bg-foreground text-background hover:bg-foreground/90">
            <Link href="/import">
              <Plus className="size-4" />
              Adicionar ensaio
            </Link>
          </Button>
        }
      >
        <CompareClient runs={runs} profileAverages={profileAverages} />
      </PageShell>
    </DashboardLayout>
  )
}
