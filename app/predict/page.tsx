import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { PredictionWorkspace } from '@/components/prediction/prediction-workspace'
import { getRambergOsgoodTrainingData } from '@/lib/prediction-data'
import { Sparkles, Info } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export const dynamic = 'force-dynamic'

export default async function PredictPage() {
  const trainingData = await getRambergOsgoodTrainingData()

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-foreground to-foreground/80 text-background shadow-md">
                <Sparkles className="size-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Nova Predição</h1>
                <p className="text-muted-foreground">
                  Configure as condições de impressão e gere uma previsão técnica das propriedades.
                </p>
              </div>
            </div>
          </div>
        </div>

        <Alert className="border-foreground/20 bg-white">
          <Info className="size-4 text-foreground" />
          <AlertDescription className="text-sm">
            As previsões são obtidas a partir de perfis experimentais reais, com ajuste
            Ramberg-Osgood e interpolação por base radial. A confiança exibida reflete a proximidade
            do envelope experimental.
          </AlertDescription>
        </Alert>

        <PredictionWorkspace trainingData={trainingData} />
      </div>
    </DashboardLayout>
  )
}
