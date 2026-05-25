import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { PageShell } from '@/components/layout/page-shell'
import { MefRambergClient } from '@/components/mef/mef-ramberg-client'

export default function MefPage() {
  return (
    <DashboardLayout>
      <PageShell
        chapter="Cap. V"
        rubric="Estrutural"
        title="MEF e"
        accent="Ramberg-Osgood"
        description="Conecta a curva do material à resposta da peça em elementos finitos para entender como o conjunto se deforma."
        fullBleed
      >
        <MefRambergClient />
      </PageShell>
    </DashboardLayout>
  )
}
