import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { PageShell } from '@/components/layout/page-shell'
import { MefVerificationClient } from '@/components/verification/mef-verification-client'

export default function VerificacaoPage() {
  return (
    <DashboardLayout>
      <PageShell
        chapter="Cap. IX"
        rubric="Validação"
        title="Verificação"
        accent="da malha"
        description="Confira como o refinamento da malha influencia o erro relativo e a estabilidade do resultado numérico."
        fullBleed
      >
        <MefVerificationClient />
      </PageShell>
    </DashboardLayout>
  )
}
