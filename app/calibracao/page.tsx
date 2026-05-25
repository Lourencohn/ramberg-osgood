import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { PageShell } from '@/components/layout/page-shell'
import { CalibrationClient } from '@/components/calibration/calibration-client'
import { getRambergOsgoodTrainingData } from '@/lib/prediction-data'

export const dynamic = 'force-dynamic'

export default async function CalibracaoPage() {
  const trainingData = await getRambergOsgoodTrainingData()

  return (
    <DashboardLayout>
      <PageShell
        chapter="Cap. VIII"
        rubric="Calibração"
        title="Calibrar"
        accent="parâmetros"
        description="Ajuste E, σ₀ e n diretamente sobre os ensaios e veja o quanto cada combinação se aproxima dos dados reais."
        fullBleed
      >
        <CalibrationClient trainingData={trainingData} />
      </PageShell>
    </DashboardLayout>
  )
}
