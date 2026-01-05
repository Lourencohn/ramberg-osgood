import { Layers } from 'lucide-react'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { MaterialAtlasClient } from '@/components/atlas/material-atlas-client'
import { getRambergOsgoodTrainingData } from '@/lib/prediction-data'

export const dynamic = 'force-dynamic'

export default async function AtlasPage() {
  const trainingData = await getRambergOsgoodTrainingData()

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-foreground to-foreground/80 text-background shadow-md">
              <Layers className="size-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                Atlas Paramétrico 3D
              </h1>
              <p className="text-muted-foreground">
                Explore o espaço de E, σ₀, n e propriedades derivadas em 3D.
              </p>
            </div>
          </div>
        </div>

        <MaterialAtlasClient trainingData={trainingData} />
      </div>
    </DashboardLayout>
  )
}
