import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { PageShell } from '@/components/layout/page-shell'
import { MaterialAtlasClient } from '@/components/atlas/material-atlas-client'
import { getRambergOsgoodTrainingData } from '@/lib/prediction-data'

export const dynamic = 'force-dynamic'

export default async function AtlasPage() {
  const trainingData = await getRambergOsgoodTrainingData()

  return (
    <DashboardLayout>
      <PageShell
        chapter="Cap. VII"
        rubric="Mapeamento"
        title="Atlas"
        accent="paramétrico"
        description="Veja em três dimensões como o módulo E, a tensão de escoamento σ₀ e o expoente n se relacionam entre todos os perfis cadastrados."
        fullBleed
      >
        <MaterialAtlasClient trainingData={trainingData} />
      </PageShell>
    </DashboardLayout>
  )
}
