import { ShieldCheck } from 'lucide-react'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { MefVerificationClient } from '@/components/verification/mef-verification-client'

export default function VerificacaoPage() {
  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-foreground to-foreground/80 text-background shadow-md">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                Verificação e Convergência MEF
              </h1>
              <p className="text-muted-foreground">
                Estudo de malha, erro relativo e estabilidade numérica da solução.
              </p>
            </div>
          </div>
        </div>

        <MefVerificationClient />
      </div>
    </DashboardLayout>
  )
}
