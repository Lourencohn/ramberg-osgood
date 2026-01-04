import { Activity } from 'lucide-react'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { TestLiveClient } from '@/components/test-live/test-live-client'

export default function TestLivePage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-foreground to-foreground/80 text-background shadow-md">
              <Activity className="size-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                Simulador de Ensaio em Tempo Real
              </h1>
              <p className="text-muted-foreground">
                Visualize a curva de tracao e o corpo de prova ASTM D638 em um ensaio digital 3D.
              </p>
            </div>
          </div>
        </div>

        <TestLiveClient />
      </div>
    </DashboardLayout>
  )
}
