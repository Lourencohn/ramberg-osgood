import { Activity } from 'lucide-react'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { PageShell } from '@/components/layout/page-shell'
import { TestLiveClient } from '@/components/test-live/test-live-client'

export default function TestLivePage() {
  return (
    <DashboardLayout>
      <PageShell
        title="Simulador de Ensaio em Tempo Real"
        description="Visualize a curva de tracao e o corpo de prova ASTM D638 em um ensaio digital 3D."
        icon={<Activity className="size-5" />}
      >
        <TestLiveClient />
      </PageShell>
    </DashboardLayout>
  )
}
