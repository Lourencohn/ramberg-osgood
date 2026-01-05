import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { PageShell } from '@/components/layout/page-shell'
import { PredictionWorkspace } from '@/components/prediction/prediction-workspace'
import { getRambergOsgoodTrainingData } from '@/lib/prediction-data'
import { Sparkles, Info } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export const dynamic = 'force-dynamic'

export default async function PredictPage() {
  const trainingData = await getRambergOsgoodTrainingData()

  return (
    <DashboardLayout>
      <PageShell
        title="Nova Predição"
        description="Configure as condições de impressão e gere uma previsão técnica das propriedades."
        icon={<Sparkles className="size-5" />}
      >
        <Alert className="border-foreground/20 bg-white dark:bg-black dark:text-white">
          <Info className="size-4 text-foreground" />
          <AlertDescription className="text-sm">
            As previsões são obtidas a partir de perfis experimentais reais, com ajuste
            Ramberg-Osgood e interpolação por base radial. A confiança exibida reflete a proximidade
            do envelope experimental.
          </AlertDescription>
        </Alert>

        <PredictionWorkspace trainingData={trainingData} />
      </PageShell>
    </DashboardLayout>
  )
}
