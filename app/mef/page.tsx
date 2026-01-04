import { Layers } from 'lucide-react'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { MefRambergClient } from '@/components/mef/mef-ramberg-client'

export default function MefPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-foreground to-foreground/80 text-background shadow-md">
              <Layers className="size-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                MEF + Ramberg-Osgood
              </h1>
              <p className="text-muted-foreground">
                Relacione a curva do material com a resposta estrutural via Metodo dos Elementos
                Finitos.
              </p>
            </div>
          </div>
        </div>

        <MefRambergClient />
      </div>
    </DashboardLayout>
  )
}
