import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { PageShell } from '@/components/layout/page-shell'
import { TestLiveClient } from '@/components/test-live/test-live-client'

export default function TestLivePage() {
  return (
    <DashboardLayout>
      <PageShell
        chapter="Cap. VI"
        rubric="Simulador"
        title="Ensaio ao"
        accent="vivo"
        description="Acompanhe a curva de tração e a deformação do corpo de prova ASTM D638 em tempo real, em três dimensões."
        fullBleed
      >
        <TestLiveClient />
      </PageShell>
    </DashboardLayout>
  )
}
