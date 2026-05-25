import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { PageShell } from '@/components/layout/page-shell'
import { PredictionWorkspace } from '@/components/prediction/prediction-workspace'
import { getRambergOsgoodTrainingData } from '@/lib/prediction-data'

export const dynamic = 'force-dynamic'

export default async function PredictPage() {
  const trainingData = await getRambergOsgoodTrainingData()

  return (
    <DashboardLayout>
      <PageShell
        chapter="Cap. II"
        rubric="Predição"
        title="Nova"
        accent="predição"
        description="Informe a temperatura, a velocidade e o material. O sistema usa os ensaios reais já cadastrados para estimar a curva de tensão por deformação esperada."
      >
        <PredictionWorkspace trainingData={trainingData} />
      </PageShell>
    </DashboardLayout>
  )
}
