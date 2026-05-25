import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { PageShell } from '@/components/layout/page-shell'
import { SettingsClient } from '@/components/settings/settings-client'

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <PageShell
        chapter="Cap. X"
        rubric="Preferências"
        title="Ajustes do"
        accent="sistema"
        description="Configure cálculos, exportação, unidades e aparência. As alterações ficam salvas no seu navegador."
      >
        <SettingsClient />
      </PageShell>
    </DashboardLayout>
  )
}
