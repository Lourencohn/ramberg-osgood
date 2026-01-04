import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { SettingsClient } from '@/components/settings/settings-client'

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <SettingsClient />
    </DashboardLayout>
  )
}
