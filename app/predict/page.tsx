import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PredictionWorkspace } from "@/components/prediction/prediction-workspace"
import { getRambergOsgoodTrainingData } from "@/lib/prediction-data"
import { Sparkles, Info } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export const dynamic = "force-dynamic"

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
                  Configure os parâmetros para prever propriedades mecânicas
                </p>
              </div>
            </div>
          </div>
        </div>


        <Alert className="border-foreground/20 bg-foreground/5">
          <Info className="size-4 text-foreground" />
          <AlertDescription className="text-sm">
            Insira a temperatura e velocidade de impressão para calcular as propriedades mecânicas
            do material PLA usando o modelo de Ramberg-Osgood ajustado com ensaios reais.
          </AlertDescription>
        </Alert>


        <PredictionWorkspace trainingData={trainingData} />
      </div>
    </DashboardLayout>
  )
}
