import { Layers } from 'lucide-react'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { PageShell } from '@/components/layout/page-shell'
import { MefRambergClient } from '@/components/mef/mef-ramberg-client'

export default function MefPage() {
  return (
    <DashboardLayout>
      <PageShell
        title="MEF + Ramberg-Osgood"
        description="Relacione a curva do material com a resposta estrutural via Metodo dos Elementos Finitos."
        icon={<Layers className="size-5" />}
      >
        <MefRambergClient />
      </PageShell>
    </DashboardLayout>
  )
}
