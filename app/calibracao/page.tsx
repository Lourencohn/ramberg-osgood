import { Target } from 'lucide-react'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { CalibrationClient } from '@/components/calibration/calibration-client'
import { getRambergOsgoodTrainingData } from '@/lib/prediction-data'

export const dynamic = 'force-dynamic'

export default async function CalibracaoPage() {
  const trainingData = await getRambergOsgoodTrainingData()

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-foreground to-foreground/80 text-background shadow-md">
              <Target className="size-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                Calibração e Identificação
              </h1>
              <p className="text-muted-foreground">
                Ajuste E, σ₀ e n com base experimental e diagnósticos quantitativos.
              </p>
            </div>
          </div>
        </div>

        <CalibrationClient trainingData={trainingData} />
      </div>
    </DashboardLayout>
  )
}
