import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { EditorialHeader } from '@/components/dashboard/editorial-header'
import { KpiStrip } from '@/components/dashboard/kpi-strip'
import { CurveOverlayCard } from '@/components/dashboard/curve-overlay-card'
import { ThermalRings } from '@/components/dashboard/thermal-rings'
import { EditorialActions } from '@/components/dashboard/editorial-actions'
import { ProfileMatrix } from '@/components/dashboard/profile-matrix'
import { getDashboardData } from '@/lib/dashboard-data'

export const dynamic = 'force-dynamic'

const numberFormatter = new Intl.NumberFormat('pt-BR')

export default async function DashboardPage() {
  const { stats, temperatureUsage, profileDetails } = await getDashboardData()

  const avgPoints = stats.totalTests ? Math.round(stats.totalMeasurements / stats.totalTests) : 0

  // KPI values pre-formatted for editorial display: the big number is the
  // "headline", the unit/hint sit beneath for context.
  const kpis = [
    {
      caption: 'Ensaios catalogados',
      value: stats.totalTests.toString().padStart(3, '0'),
      hint: `${stats.testsWithStress} com tensão calculada`,
      accent: true,
    },
    {
      caption: 'Perfis distintos',
      value: stats.totalProfiles.toString().padStart(2, '0'),
      hint: 'Material × temperatura × velocidade',
    },
    {
      caption: 'Pontos medidos',
      value: numberFormatter.format(stats.totalMeasurements),
      hint: `~${numberFormatter.format(avgPoints)} por ensaio`,
    },
    {
      caption: 'Modelo ativo',
      value: 'R.O',
      hint: 'Ramberg-Osgood com RBF',
    },
  ]

  return (
    <DashboardLayout>
      <div className="relative mx-auto w-full max-w-[1320px] space-y-8 pb-12">
        {/* Paper-grain backdrop */}
        <div className="pointer-events-none absolute inset-0 -z-10 grain opacity-60" aria-hidden="true" />

        <EditorialHeader totalTests={stats.totalTests} lastTestAt={stats.lastTest?.createdAt} />

        <KpiStrip items={kpis} />

        {/* Hero band: curve overlay (large), thermal rings and shortcuts on the right */}
        <section className="grid gap-5 lg:grid-cols-[1.7fr_1fr]">
          <CurveOverlayCard profiles={profileDetails} />

          <div className="flex flex-col gap-5">
            <ThermalRings data={temperatureUsage} totalRuns={stats.totalTests} />
            <EditorialActions />
          </div>
        </section>

        {/* Dense profile matrix, replaces the long scrolling ProfileTests */}
        <ProfileMatrix profiles={profileDetails} />

        {/* Editorial colophon */}
        <footer className="flex items-center justify-between border-t border-foreground/15 pt-4 text-[10px] uppercase tracking-[0.18em] text-foreground/40">
          <span>ResistencIA · vol. 01 · ed. {new Date().getFullYear()}</span>
          <span>Dados experimentais reais · sem síntese</span>
        </footer>
      </div>
    </DashboardLayout>
  )
}
